/* ==========================================================================
   HUK53 — Jazz page logic
   Five tracks, 30-second capped preview each. After 30s (or if the file
   ends early) playback stops for good and two streaming buttons (Apple
   Music / Spotify) fade in with the real links. No re-play afterwards —
   this is a one-shot preview per track per page load, by design.
   ========================================================================== */

(() => {
  "use strict";

  const PREVIEW_SECONDS = 30;

  /* ------------------------------------------------------------------ *
   * TRACK CONFIG
   * Same fallback behaviour as the dance tracks on the homepage: point
   * `audioSrc` at a real file in assets/audio/ to go live — until that
   * file exists, a short synthesized "jazz-ish" loop plays instead so the
   * page is fully interactive out of the box. `appleUrl`/`spotifyUrl` are
   * placeholders — replace with the real links before launch.
   * ------------------------------------------------------------------ */
  const JAZZ_TRACKS = [
    {
      id: "blue-hour",
      title: "Blue Hour",
      tag: "Piano Trio",
      bpm: 92,
      audioSrc: "assets/audio/jazz-blue-hour.mp3",
      appleUrl: "https://music.apple.com/", // TODO: add the real Apple Music link
      spotifyUrl: "https://open.spotify.com/", // TODO: add the real Spotify link
    },
    {
      id: "midnight-sax",
      title: "Midnight Sax",
      tag: "Sax Ballad",
      bpm: 76,
      audioSrc: "assets/audio/jazz-midnight-sax.mp3",
      appleUrl: "https://music.apple.com/",
      spotifyUrl: "https://open.spotify.com/",
    },
    {
      id: "velvet-keys",
      title: "Velvet Keys",
      tag: "Piano Jazz",
      bpm: 100,
      audioSrc: "assets/audio/jazz-velvet-keys.mp3",
      appleUrl: "https://music.apple.com/",
      spotifyUrl: "https://open.spotify.com/",
    },
    {
      id: "smoky-room",
      title: "Smoky Room",
      tag: "Swing",
      bpm: 112,
      audioSrc: "assets/audio/jazz-smoky-room.mp3",
      appleUrl: "https://music.apple.com/",
      spotifyUrl: "https://open.spotify.com/",
    },
    {
      id: "autumn-stroll",
      title: "Autumn Stroll",
      tag: "Bossa",
      bpm: 88,
      audioSrc: "assets/audio/jazz-autumn-stroll.mp3",
      appleUrl: "https://music.apple.com/",
      spotifyUrl: "https://open.spotify.com/",
    },
  ];

  const WAVEFORM_BARS = 18;

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function buildWaveform() {
    let bars = "";
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      const delay = (Math.random() * 0.6).toFixed(2);
      const dur = (0.7 + Math.random() * 0.5).toFixed(2);
      bars += `<span style="animation-delay:-${delay}s;animation-duration:${dur}s"></span>`;
    }
    return bars;
  }

  function trackTemplate(track) {
    return `
    <article class="jazz-card" id="jazz-${track.id}" data-id="${track.id}">
      <div class="jazz-card__top">
        <div class="jazz-card__art" aria-hidden="true"></div>
        <div class="jazz-card__meta">
          <h3>${track.title}</h3>
          <div class="jazz-card__tags">
            <span class="tag tag--gold">${track.tag}</span>
          </div>
        </div>
      </div>

      <div class="jazz-card__controls">
        <button class="play-btn" type="button" aria-label="Play ${track.title} (30-second preview)">
          <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
        </button>
        <div class="jazz-card__progress-wrap">
          <div class="jazz-card__progress"><div class="jazz-card__progress-fill" data-role="progress-fill"></div></div>
          <div class="jazz-card__times">
            <span data-role="time-current">0:00</span>
            <span>0:${PREVIEW_SECONDS}</span>
          </div>
        </div>
      </div>

      <div class="waveform" aria-hidden="true">${buildWaveform()}</div>

      <p class="jazz-card__note" data-role="mode-note">30-second preview — loading…</p>

      <div class="jazz-card__links" data-role="links">
        <span class="jazz-card__links-label">Preview finished — keep listening on</span>
        <div class="jazz-card__link-row">
          <a class="stream-btn stream-btn--apple" href="${track.appleUrl}" target="_blank" rel="noopener">Open directly in the Apple Music Store</a>
          <a class="stream-btn stream-btn--spotify" href="${track.spotifyUrl}" target="_blank" rel="noopener">Open directly in Spotify</a>
        </div>
      </div>
    </article>`;
  }

  /* --- Demo synth: soft walking-bass + brushed hats "jazz-ish" loop --- */
  let sharedCtx = null;
  function createJazzLoop(bpm) {
    sharedCtx = sharedCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sharedCtx;
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.2);
    master.connect(ctx.destination);

    // Simple walking bassline over a two-bar ii-V-I-vi-ish pattern.
    const bassNotes = [55, 61.74, 65.41, 73.42]; // A1, B1, C2, D2 — kept intentionally simple
    const beatMs = (60000 / bpm);
    let step = 0;

    function bassNote(freq, time) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + beatMs / 1000 * 0.9);
      osc.connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + beatMs / 1000);
    }

    function brushHat(time) {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 4500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      noise.connect(filter).connect(gain).connect(master);
      noise.start(time);
    }

    function chordStab(time) {
      [0, 4, 7].forEach((semi) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220 * Math.pow(2, semi / 12), time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);
        osc.connect(gain).connect(master);
        osc.start(time);
        osc.stop(time + 1.2);
      });
    }

    const intervalId = setInterval(() => {
      const t = ctx.currentTime + 0.02;
      bassNote(bassNotes[step % bassNotes.length], t);
      brushHat(t + beatMs / 2000);
      if (step % 8 === 0) chordStab(t);
      step++;
    }, beatMs);

    return {
      stop() {
        clearInterval(intervalId);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        setTimeout(() => master.disconnect(), 250);
      },
    };
  }

  function initJazzCard(track) {
    const card = document.getElementById(`jazz-${track.id}`);
    const playBtn = card.querySelector(".play-btn");
    const progressFill = card.querySelector('[data-role="progress-fill"]');
    const timeCurrent = card.querySelector('[data-role="time-current"]');
    const modeNote = card.querySelector('[data-role="mode-note"]');
    const links = card.querySelector('[data-role="links"]');

    const audio = new Audio();
    audio.preload = "none";
    let mode = "pending"; // "file" | "demo"
    let synth = null;
    let rafId = null;
    let previewUsed = false; // once true, no further playback is allowed

    audio.addEventListener("error", () => { if (mode !== "file") switchToDemoMode(); });
    audio.addEventListener("loadedmetadata", () => {
      mode = "file";
      modeNote.textContent = "🎵 Live track — 30-second preview";
    });
    audio.src = track.audioSrc;
    audio.load();

    function switchToDemoMode() {
      mode = "demo";
      modeNote.textContent = "🔊 Preview loop (demo — add a real MP3 to assets/audio/) — 30 seconds";
    }
    setTimeout(() => { if (mode === "pending") switchToDemoMode(); }, 900);

    function endPreviewForGood() {
      stopEngines();
      previewUsed = true;
      card.classList.remove("is-playing");
      progressFill.style.width = "100%";
      timeCurrent.textContent = formatTime(PREVIEW_SECONDS);
      playBtn.disabled = true;
      playBtn.setAttribute("aria-label", `${track.title}: preview finished`);
      modeNote.textContent = "✅ Preview finished.";
      links.classList.add("is-visible");
    }

    function stopEngines() {
      audio.pause();
      if (synth) { synth.stop(); synth = null; }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function tick(startedAt) {
      const elapsed = (performance.now() - startedAt) / 1000;
      if (elapsed >= PREVIEW_SECONDS) {
        endPreviewForGood();
        return;
      }
      const pct = (elapsed / PREVIEW_SECONDS) * 100;
      progressFill.style.width = `${pct}%`;
      timeCurrent.textContent = formatTime(elapsed);
      rafId = requestAnimationFrame(() => tick(startedAt));
    }

    playBtn.addEventListener("click", () => {
      if (previewUsed) return; // no replays once the 30s preview has run

      const willPlay = !card.classList.contains("is-playing");

      document.querySelectorAll(".jazz-card.is-playing").forEach((other) => {
        if (other !== card) other.dispatchEvent(new Event("huk53jazz:stop"));
      });

      if (!willPlay) {
        stopEngines();
        card.classList.remove("is-playing");
        return;
      }

      card.classList.add("is-playing");
      const startedAt = performance.now();

      if (mode === "demo") {
        synth = createJazzLoop(track.bpm);
        tick(startedAt);
      } else {
        audio.currentTime = 0;
        audio.play().then(() => tick(startedAt)).catch(() => {
          switchToDemoMode();
          synth = createJazzLoop(track.bpm);
          tick(startedAt);
        });
        // Belt-and-braces: also stop on the audio's own end event if it's
        // shorter than 30s, and on the browser's native timeupdate so the
        // cap holds even if rAF throttles in a background tab.
        audio.addEventListener("ended", () => { if (!previewUsed) endPreviewForGood(); });
        audio.addEventListener("timeupdate", () => {
          if (!previewUsed && audio.currentTime >= PREVIEW_SECONDS) endPreviewForGood();
        });
      }
    });

    card.addEventListener("huk53jazz:stop", () => {
      stopEngines();
      card.classList.remove("is-playing");
    });
  }

  const grid = document.getElementById("jazzGrid");
  if (grid) {
    grid.innerHTML = JAZZ_TRACKS.map(trackTemplate).join("");
    JAZZ_TRACKS.forEach(initJazzCard);
  }
})();
