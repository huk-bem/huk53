/* ==========================================================================
   HUK53 — One-Pager Logic
   Vanilla JS, no dependencies, no backend. Comments/Likes persist locally
   in the visitor's own browser (localStorage) — see the disclaimer text
   rendered under each song's feedback column.
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1) TRACK CONFIG
   * Replace `audioSrc` with a real file (e.g. "assets/audio/track-1.mp3")
   * to go live. Until a file exists at that path, the player automatically
   * falls back to a short synthesized preview loop tuned to the track's
   * BPM, so the demo is fully playable out of the box. Max 3 tracks by
   * design — add a 4th here only if you also relax that constraint.
   *
   * "Back on Track" and "Sonar" are live (assets/audio/back-on-track.mp3,
   * assets/audio/sonar.mp3). Their `bpm`/`genre` below are placeholder
   * estimates — adjust to the real values, they only affect the tag chip
   * and the (unused, since a real file exists) demo-loop fallback tempo.
   * ------------------------------------------------------------------ */
  const SONGS = [
    {
      id: "back-on-track",
      title: "Back on Track",
      genre: "Dance",
      bpm: 126,
      audioSrc: "assets/audio/back-on-track.mp3",
      baseLikes: 142,
      seedComments: [
        { name: "Mira", text: "Der Drop bei 1:10 killt live jedes Mal.", date: "2026-07-02" },
        { name: "Jonas", text: "Perfekt für den Openslot, sofort Energie im Raum.", date: "2026-07-14" },
      ],
    },
    {
      id: "sonar",
      title: "Sonar",
      genre: "Dance / Techno",
      bpm: 130,
      audioSrc: "assets/audio/sonar.mp3",
      baseLikes: 118,
      seedComments: [
        { name: "Elif", text: "Bassline ist brutal gut abgemischt.", date: "2026-06-28" },
      ],
    },
    {
      id: "night-pulse",
      title: "Night Pulse",
      genre: "Dance / Electro",
      bpm: 128,
      audioSrc: "assets/audio/night-pulse.mp3",
      baseLikes: 96,
      seedComments: [
        { name: "Timo", text: "Läuft bei uns seit Wochen im Closing-Set.", date: "2026-07-20" },
        { name: "Sana", text: "Groove ist unfassbar tight 🔥", date: "2026-08-01" },
      ],
    },
  ];

  const STORAGE_PREFIX = "huk53_";
  const WAVEFORM_BARS = 22;

  /* ------------------------------------------------------------------ *
   * 2) NAV — mobile menu + smooth scroll close
   * ------------------------------------------------------------------ */
  const nav = document.getElementById("nav");
  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");

  navBurger?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navBurger.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navBurger?.setAttribute("aria-expanded", "false");
    });
  });

  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    nav.style.background = window.scrollY > 40 ? "rgba(11,11,20,0.8)" : "rgba(11,11,20,0.55)";
    lastScrollY = window.scrollY;
  }, { passive: true });

  /* ------------------------------------------------------------------ *
   * 3) HERO — animated moving background (canvas blobs)
   * Lightweight stand-in for a background video: soft, slow-drifting
   * gradient blobs in the brand colors. Swap for a <video> element in the
   * markup if you'd rather use real footage — this keeps working either
   * way without any asset dependency.
   * ------------------------------------------------------------------ */
  (() => {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w, h, dpr;
    const blobs = [
      { color: "255,46,146", r: 0.42, x: 0.28, y: 0.35, vx: 0.00018, vy: 0.00014, t: 0 },
      { color: "123,47,247", r: 0.38, x: 0.7, y: 0.55, vx: -0.00015, vy: 0.0002, t: 100 },
      { color: "0,229,255", r: 0.3, x: 0.5, y: 0.75, vx: 0.0002, vy: -0.00016, t: 200 },
    ];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0b0b14";
      ctx.fillRect(0, 0, w, h);

      blobs.forEach((b) => {
        const cx = (b.x + Math.sin(time * b.vx + b.t) * 0.12) * w;
        const cy = (b.y + Math.cos(time * b.vy + b.t) * 0.12) * h;
        const r = b.r * Math.max(w, h);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${b.color},0.55)`);
        grad.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      if (!prefersReducedMotion) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
    if (prefersReducedMotion) draw(0); // paint one static frame
  })();

  /* ------------------------------------------------------------------ *
   * 4) SONG CARDS — render + player + likes + comments
   * ------------------------------------------------------------------ */
  const grid = document.getElementById("songsGrid");

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function loadLikeState(song) {
    const liked = localStorage.getItem(`${STORAGE_PREFIX}liked_${song.id}`) === "1";
    const stored = localStorage.getItem(`${STORAGE_PREFIX}likecount_${song.id}`);
    const count = stored !== null ? parseInt(stored, 10) : song.baseLikes;
    return { liked, count };
  }

  function saveLikeState(song, liked, count) {
    localStorage.setItem(`${STORAGE_PREFIX}liked_${song.id}`, liked ? "1" : "0");
    localStorage.setItem(`${STORAGE_PREFIX}likecount_${song.id}`, String(count));
  }

  function loadComments(song) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}comments_${song.id}`);
    const extra = raw ? JSON.parse(raw) : [];
    return [...song.seedComments, ...extra];
  }

  function addComment(song, comment) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}comments_${song.id}`);
    const extra = raw ? JSON.parse(raw) : [];
    extra.push(comment);
    localStorage.setItem(`${STORAGE_PREFIX}comments_${song.id}`, JSON.stringify(extra));
  }

  function renderComments(container, song) {
    const comments = loadComments(song);
    container.innerHTML = comments
      .slice()
      .reverse()
      .map(
        (c) => `
        <div class="comment">
          <strong>${escapeHtml(c.name)}</strong>${escapeHtml(c.text)}
          <time>${c.date}</time>
        </div>`
      )
      .join("");
    container.scrollTop = 0;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function buildWaveform() {
    let bars = "";
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      const delay = (Math.random() * 0.6).toFixed(2);
      const dur = (0.6 + Math.random() * 0.5).toFixed(2);
      bars += `<span style="animation-delay:-${delay}s;animation-duration:${dur}s"></span>`;
    }
    return bars;
  }

  function songCardTemplate(song) {
    const { liked, count } = loadLikeState(song);
    return `
    <article class="song-card" id="card-${song.id}" data-id="${song.id}">
      <div class="song-card__player">
        <div class="song-card__top">
          <div class="song-card__art" aria-hidden="true"></div>
          <div class="song-card__meta">
            <h3>${song.title}</h3>
            <div class="song-card__tags">
              <span class="tag">${song.genre}</span>
              <span class="tag tag--bpm">${song.bpm} BPM</span>
            </div>
          </div>
        </div>

        <div class="song-card__controls">
          <button class="play-btn" type="button" aria-label="${song.title} abspielen">
            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          </button>
          <div class="song-card__progress-wrap">
            <div class="song-card__progress" data-role="progress">
              <div class="song-card__progress-fill" data-role="progress-fill"></div>
            </div>
            <div class="song-card__times">
              <span data-role="time-current">0:00</span>
              <span data-role="time-total">–:–</span>
            </div>
          </div>
        </div>

        <div class="waveform" aria-hidden="true">${buildWaveform()}</div>

        <p class="song-card__note" data-role="mode-note">Lädt Vorschau …</p>
      </div>

      <div class="song-card__feedback">
        <div class="feedback__row">
          <button class="like-btn ${liked ? "is-liked" : ""}" type="button" data-role="like-btn" aria-pressed="${liked}">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.6 8.4 2.3 5 5.8 5c2 0 3.4 1 4.2 2.3C10.8 6 12.2 5 14.2 5c3.5 0 5.2 3.4 3.8 6.7C19.5 16.4 12 21 12 21z"/></svg>
            <span data-role="like-count">${count}</span>
          </button>
          <span class="feedback__count-label" data-role="comment-count-label"></span>
        </div>

        <div class="comments" data-role="comments"></div>

        <form class="comment-form" data-role="comment-form">
          <div class="comment-form__row">
            <input type="text" name="name" placeholder="Dein Name" maxlength="30" required />
          </div>
          <textarea name="text" placeholder="Was denkst du über den Track?" maxlength="240" required></textarea>
          <button type="submit">Kommentar senden</button>
        </form>

        <p class="feedback__disclaimer">💬 Likes &amp; Kommentare werden lokal in deinem Browser gespeichert (Demo-Modus ohne Server). Für ein geteiltes Feedback-Board für alle Besucher:innen an ein Backend / einen Formular-Service anbinden.</p>
      </div>
    </article>`;
  }

  function initSongCard(song) {
    const card = document.getElementById(`card-${song.id}`);
    const playBtn = card.querySelector(".play-btn");
    const progressWrap = card.querySelector('[data-role="progress"]');
    const progressFill = card.querySelector('[data-role="progress-fill"]');
    const timeCurrent = card.querySelector('[data-role="time-current"]');
    const timeTotal = card.querySelector('[data-role="time-total"]');
    const modeNote = card.querySelector('[data-role="mode-note"]');
    const likeBtn = card.querySelector('[data-role="like-btn"]');
    const likeCountEl = card.querySelector('[data-role="like-count"]');
    const commentsEl = card.querySelector('[data-role="comments"]');
    const commentCountLabel = card.querySelector('[data-role="comment-count-label"]');
    const commentForm = card.querySelector('[data-role="comment-form"]');

    /* --- Player: real <audio> first, synthesized loop as fallback --- */
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    let mode = "pending"; // "file" | "demo"
    let rafId = null;
    let synth = null; // active demo synth handle

    audio.addEventListener("error", () => {
      if (mode !== "file") switchToDemoMode();
    });
    audio.addEventListener("loadedmetadata", () => {
      mode = "file";
      timeTotal.textContent = formatTime(audio.duration);
      modeNote.textContent = "🎵 Live-Track";
    });
    audio.src = song.audioSrc;
    audio.load();

    function switchToDemoMode() {
      mode = "demo";
      timeTotal.textContent = "loop";
      modeNote.textContent = "🔊 Preview-Loop (Demo — echte MP3 in assets/audio/ ablegen für Live-Sound)";
    }
    // If no metadata arrives quickly (no file present), assume demo mode.
    setTimeout(() => { if (mode === "pending") switchToDemoMode(); }, 900);

    function stopAll() {
      card.classList.remove("is-playing");
      audio.pause();
      if (synth) { synth.stop(); synth = null; }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function tickFile() {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      progressFill.style.width = `${pct}%`;
      timeCurrent.textContent = formatTime(audio.currentTime);
      rafId = requestAnimationFrame(tickFile);
    }

    function tickDemo(startedAt) {
      const loopMs = (60000 / song.bpm) * 16; // 16 beats ≈ 4 bars per loop
      const elapsedTotal = (performance.now() - startedAt) / 1000;
      const elapsedLoop = ((performance.now() - startedAt) % loopMs) / loopMs;
      progressFill.style.width = `${elapsedLoop * 100}%`;
      timeCurrent.textContent = formatTime(elapsedTotal);
      rafId = requestAnimationFrame(() => tickDemo(startedAt));
    }

    playBtn.addEventListener("click", () => {
      const willPlay = !card.classList.contains("is-playing");

      // Only one song plays at a time.
      document.querySelectorAll(".song-card.is-playing").forEach((other) => {
        if (other !== card) other.dispatchEvent(new Event("huk53:stop"));
      });

      if (!willPlay) {
        stopAll();
        return;
      }

      card.classList.add("is-playing");

      if (mode === "demo") {
        synth = createDemoLoop(song.bpm);
        tickDemo(performance.now());
      } else {
        audio.currentTime = 0;
        audio.play().then(() => tickFile()).catch(() => {
          switchToDemoMode();
          synth = createDemoLoop(song.bpm);
          tickDemo(performance.now());
        });
      }
    });

    card.addEventListener("huk53:stop", stopAll);

    progressWrap.addEventListener("click", (e) => {
      if (mode !== "file" || !audio.duration) return; // seeking only meaningful for real files
      const rect = progressWrap.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });

    /* --- Likes --- */
    likeBtn.addEventListener("click", () => {
      const { liked, count } = loadLikeState(song);
      const nextLiked = !liked;
      const nextCount = count + (nextLiked ? 1 : -1);
      saveLikeState(song, nextLiked, nextCount);
      likeBtn.classList.toggle("is-liked", nextLiked);
      likeBtn.setAttribute("aria-pressed", String(nextLiked));
      likeCountEl.textContent = nextCount;
      likeBtn.classList.remove("pop");
      void likeBtn.offsetWidth; // restart animation
      likeBtn.classList.add("pop");
    });

    /* --- Comments --- */
    function refreshComments() {
      const comments = loadComments(song);
      renderComments(commentsEl, song);
      commentCountLabel.textContent = `${comments.length} Kommentar${comments.length === 1 ? "" : "e"}`;
    }
    refreshComments();

    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = commentForm.elements.name.value.trim();
      const text = commentForm.elements.text.value.trim();
      if (!name || !text) return;
      addComment(song, {
        name,
        text,
        date: new Date().toISOString().slice(0, 10),
      });
      commentForm.reset();
      refreshComments();
    });
  }

  /* --- Demo synth: simple 4-on-the-floor kick/hi-hat loop at the given BPM --- */
  let sharedCtx = null;
  function createDemoLoop(bpm) {
    sharedCtx = sharedCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sharedCtx;
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.15);
    master.connect(ctx.destination);

    const beatMs = 60000 / bpm;
    let step = 0;

    function kick(time) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
      gain.gain.setValueAtTime(0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + 0.25);
    }

    function hat(time) {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 7000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      noise.connect(filter).connect(gain).connect(master);
      noise.start(time);
    }

    const intervalId = setInterval(() => {
      const t = ctx.currentTime + 0.02;
      if (step % 2 === 0) kick(t);
      hat(t);
      step++;
    }, beatMs / 2);

    return {
      stop() {
        clearInterval(intervalId);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        setTimeout(() => master.disconnect(), 200);
      },
    };
  }

  if (grid) {
    grid.innerHTML = SONGS.map(songCardTemplate).join("");
    SONGS.forEach(initSongCard);
  }

  /* ------------------------------------------------------------------ *
   * 5) ABOUT — animated stat counters
   * ------------------------------------------------------------------ */
  const stats = document.querySelectorAll(".stat strong[data-count]");
  if (stats.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const duration = 900;
          const start = performance.now();
          function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          observer.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * 6) BOOKING — mailto handoff (no backend attached yet)
   * ------------------------------------------------------------------ */
  const bookingForm = document.getElementById("bookingForm");
  bookingForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = bookingForm.elements.name.value.trim();
    const date = bookingForm.elements.date.value;
    const message = bookingForm.elements.message.value.trim();
    const subject = encodeURIComponent(`Gig-Anfrage: ${name}`);
    const body = encodeURIComponent(
      `Name/Location: ${name}\nDatum: ${date || "–"}\n\n${message}`
    );
    // TODO: replace with the studio's real booking address.
    window.location.href = `mailto:booking@huk53.de?subject=${subject}&body=${body}`;
  });

  /* ------------------------------------------------------------------ *
   * 7) FOOTER — current year
   * ------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
