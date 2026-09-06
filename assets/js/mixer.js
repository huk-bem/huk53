/* ==========================================================================
   HUK — Mix Lab: a two-deck virtual DJ mixer
   Load any real track from either catalog (EDM Fusion + Jazz Fusion) onto
   Deck A and Deck B, play both at once, and blend them live with the
   crossfader — plus a small per-deck EQ and speed control on each deck,
   the way a simple DJ mixer works. Everything runs client-side via the
   Web Audio API; nothing is recorded or uploaded, this is a live-listen
   toy, not a mix exporter.
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   * TRACK CATALOG — the same real tracks used on edm.html/jazz.html.
   * Kept as a flat, independent list here on purpose: this page doesn't
   * load main.js/jazz.js (it needs none of the likes/comments/preview-cap
   * logic there), so the two small arrays are simply duplicated rather
   * than sharing a module — keeps this page dependency-free.
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

  /* ------------------------------------------------------------------ *
   * AUDIO GRAPH
   * Per deck:  <audio> --MediaElementSource--> lowShelf --> peaking
   *            --> highShelf --> deckGain --> crossfadeGain --> master
   * Crossfader uses an equal-power curve so the perceived loudness
   * stays constant while blending, same principle as a real DJ mixer.
   * ------------------------------------------------------------------ */
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  function buildDeck(prefix) {
    const audio = document.getElementById(`${prefix}Audio`);
    const source = ctx.createMediaElementSource(audio);
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

    source.connect(low).connect(mid).connect(high).connect(deckGain).connect(crossfadeGain).connect(master);

    return { audio, low, mid, high, deckGain, crossfadeGain, trackIndex: null };
  }

  const deckA = buildDeck("deckA");
  const deckB = buildDeck("deckB");

  function eqDbFromSlider(v) {
    // Slider 0–2, 1 = flat. Maps to roughly -24dB..+24dB, a "kill to boost" range.
    return (Number(v) - 1) * 24;
  }

  function applyCrossfader(x) {
    // x: 0 (full A) .. 1 (full B), equal-power curve.
    const angle = x * (Math.PI / 2);
    deckA.crossfadeGain.gain.value = Math.cos(angle);
    deckB.crossfadeGain.gain.value = Math.sin(angle);
  }

  function loadTrack(deck, index) {
    const track = TRACKS[index];
    deck.trackIndex = index;
    const wasPlaying = !deck.audio.paused;
    deck.audio.src = track.audioSrc;
    deck.audio.load();
    if (wasPlaying) deck.audio.play().catch(() => {});
    return track;
  }

  function wireDeck(prefix, deck) {
    const select = document.getElementById(`${prefix}Select`);
    const playBtn = document.getElementById(`${prefix}Play`);
    const volume = document.getElementById(`${prefix}Volume`);
    const speed = document.getElementById(`${prefix}Speed`);
    const low = document.getElementById(`${prefix}Low`);
    const mid = document.getElementById(`${prefix}Mid`);
    const high = document.getElementById(`${prefix}High`);
    const timeEl = document.getElementById(`${prefix}Time`);
    const meter = document.getElementById(`${prefix}Meter`);

    select.innerHTML = trackOptions;

    function formatTime(sec) {
      if (!isFinite(sec) || sec < 0) sec = 0;
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }

    function updatePlayLabel() {
      playBtn.textContent = deck.audio.paused ? "▶ Play" : "⏸ Pause";
      playBtn.classList.toggle("is-playing", !deck.audio.paused);
    }

    select.addEventListener("change", () => loadTrack(deck, Number(select.value)));
    loadTrack(deck, Number(select.value)); // load the first track by default

    playBtn.addEventListener("click", async () => {
      if (ctx.state === "suspended") await ctx.resume();
      if (deck.audio.paused) {
        deck.audio.play().catch(() => {});
      } else {
        deck.audio.pause();
      }
    });
    deck.audio.addEventListener("play", updatePlayLabel);
    deck.audio.addEventListener("pause", updatePlayLabel);
    deck.audio.addEventListener("ended", updatePlayLabel);

    volume.addEventListener("input", () => { deck.deckGain.gain.value = Number(volume.value); });
    deck.deckGain.gain.value = Number(volume.value);

    speed.addEventListener("input", () => { deck.audio.playbackRate = Number(speed.value); });

    low.addEventListener("input", () => { deck.low.gain.value = eqDbFromSlider(low.value); });
    mid.addEventListener("input", () => { deck.mid.gain.value = eqDbFromSlider(mid.value); });
    high.addEventListener("input", () => { deck.high.gain.value = eqDbFromSlider(high.value); });

    function tick() {
      timeEl.textContent = `${formatTime(deck.audio.currentTime)} / ${formatTime(deck.audio.duration)}`;
      const pct = deck.audio.duration ? (deck.audio.currentTime / deck.audio.duration) * 100 : 0;
      meter.style.width = `${pct}%`;
      requestAnimationFrame(tick);
    }
    tick();
  }

  wireDeck("deckA", deckA);
  wireDeck("deckB", deckB);

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
    deckA.audio.pause();
    deckB.audio.pause();
  });
})();
