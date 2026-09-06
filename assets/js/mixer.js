/* ==========================================================================
   HUK — Mix Lab: a two-deck virtual DJ mixer
   Load any real track from either catalog (EDM Fusion + Jazz Fusion) onto
   Deck A and Deck B, play both at once, and blend them live with the
   crossfader — plus per-deck EQ, speed, a Hall (reverb) send, a
   Logic-style hold-to-repeat effect, a scratch jog wheel, and a Sync
   button to match one deck's tempo to the other's.

   Built on AudioBufferSourceNode (not <audio>) so Repeater/Scratch can
   manipulate playback with sample-level precision, including true
   reverse playback for scratching — none of which is reliably possible
   with a plain HTMLMediaElement. Tracks are decoded once (fetch + Web
   Audio decodeAudioData) and cached per track index.

   Nothing here is recorded or exported — it's a live-listen toy.
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   * TRACK CATALOG — the same real tracks used on edm.html/jazz.html.
   * ------------------------------------------------------------------ */
  const TRACKS = [
    { id: "back-on-track", title: "Back on Track", area: "EDM Fusion", bpm: 126, audioSrc: "assets/audio/back-on-track.mp3" },
    { id: "sonar", title: "Sonar", area: "EDM Fusion", bpm: 130, audioSrc: "assets/audio/sonar.mp3" },
    { id: "pocket-of-rain", title: "Pocket of Rain", area: "EDM Fusion", bpm: 124, audioSrc: "assets/audio/pocket-of-rain.mp3" },
    { id: "jump", title: "Jump", area: "EDM Fusion", bpm: 128, audioSrc: "assets/audio/jump.mp3" },
    { id: "new-world", title: "New World", area: "EDM Fusion", bpm: 122, audioSrc: "assets/audio/new-world.mp3" },
    { id: "pulp-random-roll-it-out", title: "Pulp Random Roll It Out", area: "EDM Fusion", bpm: 132, audioSrc: "assets/audio/pulp-random-roll-it-out.mp3" },
    { id: "turning-point", title: "Turning Point", area: "Jazz Fusion", bpm: 92, audioSrc: "assets/audio/echo.mp3" },
    { id: "end-of-summer", title: "End of Summer", area: "Jazz Fusion", bpm: 90, audioSrc: "assets/audio/end-of-summer.mp3" },
    { id: "sunday-feeling", title: "Sunday Feeling", area: "Jazz Fusion", bpm: 96, audioSrc: "assets/audio/sunday-feeling.mp3" },
    { id: "changing-moods", title: "Changing Moods", area: "Jazz Fusion", bpm: 88, audioSrc: "assets/audio/fading-light.mp3" },
  ];

  const trackOptions = TRACKS
    .map((t, i) => `<option value="${i}">${t.title} — ${t.area}</option>`)
    .join("");

  const bufferCache = new Map(); // trackIndex -> decoded AudioBuffer

  /* ------------------------------------------------------------------ *
   * SHARED AUDIO GRAPH
   * Per deck:  source --sourceMute--> low --> mid --> high --> deckGain
   *            --> crossfadeGain --> master (dry)
   *                                --> reverbSend --> sharedConvolver
   *                                                 --> sharedReverbWet --> master
   * Repeater/scratch sources connect straight into the same `low` node,
   * joining the deck's EQ/volume/crossfader/reverb chain "for free" —
   * BiquadFilterNode sums multiple inputs automatically.
   * ------------------------------------------------------------------ */
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  /* --- Shared "Hall" reverb bus: a synthesized impulse response (no audio
     asset needed) feeding one convolver both decks can send into. --- */
  function buildImpulseResponse(seconds, decay) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }
  const sharedConvolver = ctx.createConvolver();
  sharedConvolver.buffer = buildImpulseResponse(2.4, 2.2);
  const sharedReverbWet = ctx.createGain();
  sharedReverbWet.gain.value = 0.9;
  sharedConvolver.connect(sharedReverbWet).connect(master);

  function buildDeck(prefix) {
    const low = ctx.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 320;
    const mid = ctx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 0.9;
    const high = ctx.createBiquadFilter();
    high.type = "highshelf";
    high.frequency.value = 3200;
    const deckGain = ctx.createGain();
    const crossfadeGain = ctx.createGain();
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0;

    low.connect(mid).connect(high).connect(deckGain).connect(crossfadeGain);
    crossfadeGain.connect(master);
    crossfadeGain.connect(reverbSend).connect(sharedConvolver);

    return {
      prefix,
      low, mid, high, deckGain, crossfadeGain, reverbSend,
      trackIndex: null,
      buffer: null,
      bpm: 120,
      rate: 1,
      isPlaying: false,
      sourceNode: null,      // the continuously-running "real" playback source
      sourceMute: null,      // gain right after sourceNode, muted during repeat/scratch
      fxNode: null,          // active repeater or scratch source, if any
      startCtxTime: 0,       // ctx.currentTime when sourceNode's current run began
      startOffset: 0,        // buffer position (s) at that moment
    };
  }

  const deckA = buildDeck("deckA");
  const deckB = buildDeck("deckB");
  deckA.other = deckB;
  deckB.other = deckA;

  function eqDbFromSlider(v) {
    return (Number(v) - 1) * 24; // 0–2 slider -> roughly -24dB..+24dB, 1 = flat
  }

  function applyCrossfader(x) {
    const angle = x * (Math.PI / 2);
    deckA.crossfadeGain.gain.value = Math.cos(angle);
    deckB.crossfadeGain.gain.value = Math.sin(angle);
  }

  /* ------------------------------------------------------------------ *
   * DECK PLAYBACK ENGINE
   * ------------------------------------------------------------------ */
  function getPosition(deck) {
    if (!deck.buffer) return 0;
    if (!deck.isPlaying) return deck.startOffset;
    const pos = deck.startOffset + (ctx.currentTime - deck.startCtxTime) * deck.rate;
    return Math.max(0, Math.min(deck.buffer.duration, pos));
  }

  function stopMainSource(deck) {
    if (deck.sourceNode) {
      try { deck.sourceNode.stop(); } catch { /* already stopped */ }
      deck.sourceNode.disconnect();
      deck.sourceNode = null;
    }
    if (deck.sourceMute) { deck.sourceMute.disconnect(); deck.sourceMute = null; }
  }

  function stopFx(deck) {
    if (deck.fxNode) {
      try { deck.fxNode.stop(); } catch { /* already stopped */ }
      deck.fxNode.disconnect();
      deck.fxNode = null;
    }
  }

  function playFrom(deck, offset) {
    if (!deck.buffer) return;
    stopMainSource(deck);
    const node = ctx.createBufferSource();
    node.buffer = deck.buffer;
    node.playbackRate.value = deck.rate;
    const mute = ctx.createGain();
    mute.gain.value = 1;
    node.connect(mute).connect(deck.low);
    const clampedOffset = Math.max(0, Math.min(deck.buffer.duration - 0.01, offset));
    node.start(0, clampedOffset);
    node.onended = () => {
      if (deck.sourceNode === node) {
        deck.isPlaying = false;
        deck.startOffset = deck.buffer.duration;
        deck.onPlayStateChange?.();
      }
    };
    deck.sourceNode = node;
    deck.sourceMute = mute;
    deck.startCtxTime = ctx.currentTime;
    deck.startOffset = clampedOffset;
    deck.isPlaying = true;
  }

  function pauseDeck(deck) {
    if (!deck.isPlaying) return;
    deck.startOffset = getPosition(deck);
    stopMainSource(deck);
    stopFx(deck);
    deck.isPlaying = false;
  }

  function setRate(deck, newRate) {
    if (deck.isPlaying) {
      deck.startOffset = getPosition(deck);
      deck.startCtxTime = ctx.currentTime;
    }
    deck.rate = newRate;
    if (deck.sourceNode) deck.sourceNode.playbackRate.value = newRate;
  }

  async function loadTrack(deck, index) {
    const track = TRACKS[index];
    deck.trackIndex = index;
    deck.bpm = track.bpm;
    const wasPlaying = deck.isPlaying;
    pauseDeck(deck);
    deck.startOffset = 0;
    deck.buffer = null;
    deck.onLoading?.(true);

    if (!bufferCache.has(index)) {
      const res = await fetch(track.audioSrc);
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.set(index, decoded);
    }
    // Bail out if the deck moved on to a different track while this was decoding.
    if (deck.trackIndex !== index) return;
    deck.buffer = bufferCache.get(index);
    deck.onLoading?.(false);
    deck.onDurationChange?.(deck.buffer.duration);
    if (wasPlaying) playFrom(deck, 0);
    return track;
  }

  /* --- Repeater: hold to loop a small slice of the beat, release to
     return to the real (continuously advancing) timeline underneath. --- */
  function startRepeater(deck, beatFraction) {
    if (!deck.buffer || !deck.isPlaying || deck.fxNode) return;
    const beatSec = 60 / (deck.bpm * deck.rate);
    const loopLen = Math.max(0.03, beatSec * beatFraction);
    const pos = getPosition(deck);
    const node = ctx.createBufferSource();
    node.buffer = deck.buffer;
    node.playbackRate.value = deck.rate;
    node.loop = true;
    node.loopStart = pos;
    node.loopEnd = Math.min(deck.buffer.duration, pos + loopLen);
    node.connect(deck.low);
    node.start(0, node.loopStart);
    deck.fxNode = node;
    if (deck.sourceMute) deck.sourceMute.gain.value = 0; // silence the real timeline, keep it running underneath
  }

  function stopRepeater(deck) {
    stopFx(deck);
    if (deck.sourceMute) deck.sourceMute.gain.value = 1;
  }

  /* --- Scratch: jog-wheel drag scrubs a short one-shot source (supports
     negative playbackRate = real reverse audio) while the real timeline
     keeps running muted underneath, exactly like the repeater. --- */
  function scratchTo(deck, offset, rate) {
    if (!deck.buffer || !deck.isPlaying) return;
    stopFx(deck);
    const node = ctx.createBufferSource();
    node.buffer = deck.buffer;
    node.playbackRate.value = rate;
    node.connect(deck.low);
    const clamped = Math.max(0, Math.min(deck.buffer.duration - 0.05, offset));
    // Reverse playback needs a start position near the end of what we
    // want to hear, since a negative rate plays backwards from there.
    node.start(0, clamped);
    deck.fxNode = node;
    if (deck.sourceMute) deck.sourceMute.gain.value = 0;
    // Auto-stop shortly after: a scratch touch is a brief grain, not a
    // sustained loop — the next pointermove (or release) replaces it.
    setTimeout(() => { if (deck.fxNode === node) { try { node.stop(); } catch {} } }, 220);
  }

  function endScratch(deck) {
    stopFx(deck);
    if (deck.sourceMute) deck.sourceMute.gain.value = 1;
  }

  /* ------------------------------------------------------------------ *
   * UI WIRING
   * ------------------------------------------------------------------ */
  function wireDeck(deck, defaultTrackIndex) {
    const p = deck.prefix;
    const select = document.getElementById(`${p}Select`);
    const playBtn = document.getElementById(`${p}Play`);
    const volume = document.getElementById(`${p}Volume`);
    const speed = document.getElementById(`${p}Speed`);
    const low = document.getElementById(`${p}Low`);
    const mid = document.getElementById(`${p}Mid`);
    const high = document.getElementById(`${p}High`);
    const hall = document.getElementById(`${p}Hall`);
    const timeEl = document.getElementById(`${p}Time`);
    const meter = document.getElementById(`${p}Meter`);
    const loadingEl = document.getElementById(`${p}Loading`);
    const repeatBtn = document.getElementById(`${p}RepeatBtn`);
    const repeatDiv = document.getElementById(`${p}RepeatDiv`);
    const jog = document.getElementById(`${p}Jog`);
    const syncBtn = document.getElementById(`${p}Sync`);

    select.innerHTML = trackOptions;
    select.value = defaultTrackIndex;

    function formatTime(sec) {
      if (!isFinite(sec) || sec < 0) sec = 0;
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }

    function updatePlayLabel() {
      playBtn.textContent = deck.isPlaying ? "⏸ Pause" : "▶ Play";
      playBtn.classList.toggle("is-playing", deck.isPlaying);
    }
    deck.onPlayStateChange = updatePlayLabel;
    deck.onLoading = (loading) => { loadingEl.hidden = !loading; playBtn.disabled = loading; };
    deck.onDurationChange = () => {};

    select.addEventListener("change", () => loadTrack(deck, Number(select.value)));
    loadTrack(deck, Number(select.value));

    playBtn.addEventListener("click", async () => {
      if (ctx.state === "suspended") await ctx.resume();
      if (!deck.buffer) return;
      if (deck.isPlaying) {
        pauseDeck(deck);
      } else {
        playFrom(deck, getPosition(deck));
      }
      updatePlayLabel();
    });

    volume.addEventListener("input", () => { deck.deckGain.gain.value = Number(volume.value); });
    deck.deckGain.gain.value = Number(volume.value);

    speed.addEventListener("input", () => setRate(deck, Number(speed.value)));

    low.addEventListener("input", () => { deck.low.gain.value = eqDbFromSlider(low.value); });
    mid.addEventListener("input", () => { deck.mid.gain.value = eqDbFromSlider(mid.value); });
    high.addEventListener("input", () => { deck.high.gain.value = eqDbFromSlider(high.value); });

    hall.addEventListener("input", () => { deck.reverbSend.gain.value = Number(hall.value); });

    /* --- Repeater: hold mouse/touch to engage --- */
    function repeaterOn(e) {
      e.preventDefault();
      startRepeater(deck, Number(repeatDiv.value));
      repeatBtn.classList.add("is-active");
    }
    function repeaterOff() {
      stopRepeater(deck);
      repeatBtn.classList.remove("is-active");
    }
    repeatBtn.addEventListener("pointerdown", repeaterOn);
    repeatBtn.addEventListener("pointerup", repeaterOff);
    repeatBtn.addEventListener("pointerleave", repeaterOff);
    repeatBtn.addEventListener("pointercancel", repeaterOff);

    /* --- Scratch: drag the jog wheel --- */
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let scratchOffset = 0;
    const PIXELS_TO_SECONDS = 0.012;

    jog.addEventListener("pointerdown", (e) => {
      if (!deck.isPlaying) return;
      dragging = true;
      jog.setPointerCapture(e.pointerId);
      jog.classList.add("is-active");
      lastX = e.clientX;
      lastT = performance.now();
      scratchOffset = getPosition(deck);
    });
    jog.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
      scratchOffset += dx * PIXELS_TO_SECONDS;
      scratchOffset = Math.max(0, Math.min((deck.buffer?.duration || 0), scratchOffset));
      const speedFactor = Math.max(-4, Math.min(4, (dx / dt) * 18)); // px/ms -> playback rate, signed
      scratchTo(deck, scratchOffset, speedFactor || 0.0001);
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      jog.classList.remove("is-active");
      try { jog.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      endScratch(deck);
    }
    jog.addEventListener("pointerup", endDrag);
    jog.addEventListener("pointercancel", endDrag);

    /* --- Sync: match this deck's tempo to the other deck's --- */
    syncBtn.addEventListener("click", () => {
      const other = deck.other;
      if (!other || !other.buffer) return;
      const targetRate = (other.bpm * other.rate) / deck.bpm;
      const clamped = Math.max(Number(speed.min), Math.min(Number(speed.max), targetRate));
      speed.value = clamped;
      setRate(deck, clamped);
    });

    function tick() {
      const pos = getPosition(deck);
      const dur = deck.buffer ? deck.buffer.duration : 0;
      timeEl.textContent = `${formatTime(pos)} / ${formatTime(dur)}`;
      meter.style.width = dur ? `${(pos / dur) * 100}%` : "0%";
      requestAnimationFrame(tick);
    }
    tick();
  }

  wireDeck(deckA, 0);
  wireDeck(deckB, 6);

  const crossfader = document.getElementById("crossfader");
  crossfader.addEventListener("input", () => applyCrossfader(Number(crossfader.value)));
  applyCrossfader(Number(crossfader.value));

  document.getElementById("masterVolume").addEventListener("input", (e) => {
    master.gain.value = Number(e.target.value);
  });

  document.getElementById("mixReset").addEventListener("click", () => {
    document.querySelectorAll('input[type="range"]').forEach((el) => {
      el.value = el.dataset.default;
      el.dispatchEvent(new Event("input"));
    });
    pauseDeck(deckA);
    pauseDeck(deckB);
    deckA.onPlayStateChange?.();
    deckB.onPlayStateChange?.();
  });
})();
