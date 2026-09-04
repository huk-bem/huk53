/* ==========================================================================
   HUK FUSION EDM — One-Pager Logic
   Player + hero + stats are plain vanilla JS. Likes/comments are backed by
   a small Supabase project (see assets/js/consent.js for the client setup
   and window.HUK53_SUPABASE_URL/ANON_KEY in edm.html) — real, shared,
   persistent storage, gated behind the cookie-consent banner since posting
   a like/comment needs the anonymous visitor id that cookie provides.
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1) TRACK CONFIG
   * Replace `audioSrc` with a real file (e.g. "assets/audio/track-1.mp3")
   * to go live. Until a file exists at that path, the player automatically
   * falls back to a short synthesized preview loop tuned to the track's
   * BPM, so the demo is fully playable out of the box.
   *
   * All six tracks below are live. `bpm`/`genre` are placeholder
   * estimates — adjust to the real values, they only affect the tag chip
   * and the (unused, since real files exist) demo-loop fallback tempo.
   *
   * No seed likes/comments here on purpose: once likes/comments are real
   * and shared (see section 4b below), inventing fake starter numbers or
   * fictional reviewer quotes would misrepresent genuine audience
   * feedback — every like and comment shown is now a real one.
   *
   * Streaming links: Apple Music / Spotify only publish an artist-level
   * page for HUK Fusion (no separate per-song deep links are available),
   * so every track points to the same two artist URLs below. Preview
   * playback is hard-capped at PREVIEW_SECONDS — once reached (or once
   * the file ends, if shorter), playback stops for good and the two
   * streaming buttons appear.
   * ------------------------------------------------------------------ */
  const PREVIEW_SECONDS = 30;
  const APPLE_MUSIC_URL = "https://music.apple.com/de/artist/huk-fusion/6803407059";
  const SPOTIFY_URL = "https://open.spotify.com/artist/5V0AuyekqjEpdtGwjL6m85";

  const SONGS = [
    { id: "back-on-track", title: "Back on Track", genre: "Dance / EDM", bpm: 126, audioSrc: "assets/audio/back-on-track.mp3" },
    { id: "sonar", title: "Sonar", genre: "Dance / Techno", bpm: 130, audioSrc: "assets/audio/sonar.mp3" },
    { id: "pocket-of-rain", title: "Pocket of Rain", genre: "EDM / Fusion", bpm: 124, audioSrc: "assets/audio/pocket-of-rain.mp3" },
    { id: "jump", title: "Jump", genre: "Dance / EDM", bpm: 128, audioSrc: "assets/audio/jump.mp3" },
    { id: "new-world", title: "New World", genre: "EDM / Crossover", bpm: 122, audioSrc: "assets/audio/new-world.mp3" },
    { id: "pulp-random-roll-it-out", title: "Pulp Random Roll It Out", genre: "Dance / Fusion", bpm: 132, audioSrc: "assets/audio/pulp-random-roll-it-out.mp3" },
  ];

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

  /* ------------------------------------------------------------------ *
   * 4b) LIKES & COMMENTS — Supabase-backed (real, shared, persistent)
   * Gated behind the cookie-consent visitor id from consent.js. Degrades
   * gracefully (clear inline message, nothing throws) if Supabase isn't
   * configured yet or a request fails — the rest of the page keeps working.
   * ------------------------------------------------------------------ */
  function getVisitorId() {
    return window.HUK53?.getVisitorId?.() || null;
  }

  async function fetchLikeState(song) {
    const supa = window.HUK53?.getSupabase?.();
    if (!supa) return { count: null, liked: false, unavailable: true };
    const visitorId = getVisitorId();
    const { count } = await supa
      .from("likes")
      .select("track_id", { count: "exact", head: true })
      .eq("track_id", song.id);
    let liked = false;
    if (visitorId) {
      const { data } = await supa
        .from("likes")
        .select("track_id")
        .eq("track_id", song.id)
        .eq("visitor_id", visitorId)
        .maybeSingle();
      liked = !!data;
    }
    return { count: count ?? 0, liked, unavailable: false };
  }

  async function toggleLike(song, currentlyLiked) {
    const supa = window.HUK53?.getSupabase?.();
    const visitorId = getVisitorId();
    if (!supa || !visitorId) throw new Error("unavailable");
    if (currentlyLiked) {
      await supa.from("likes").delete().eq("track_id", song.id).eq("visitor_id", visitorId);
    } else {
      const { error } = await supa.from("likes").insert({ track_id: song.id, visitor_id: visitorId });
      if (error) throw error;
    }
  }

  async function fetchComments(song) {
    const supa = window.HUK53?.getSupabase?.();
    if (!supa) return { comments: [], unavailable: true };
    const { data, error } = await supa
      .from("comments")
      .select("name, body, created_at")
      .eq("track_id", song.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { comments: [], unavailable: true };
    return { comments: data || [], unavailable: false };
  }

  async function postComment(song, name, text) {
    const supa = window.HUK53?.getSupabase?.();
    const visitorId = getVisitorId();
    if (!supa || !visitorId) throw new Error("unavailable");
    const { error } = await supa
      .from("comments")
      .insert({ track_id: song.id, name, body: text, visitor_id: visitorId });
    if (error) throw error;
  }

  function formatCommentDate(iso) {
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }

  function renderComments(container, comments) {
    if (!comments.length) {
      container.innerHTML = `<p class="comment comment--empty">No comments yet — be the first.</p>`;
      return;
    }
    container.innerHTML = comments
      .map(
        (c) => `
        <div class="comment">
          <strong>${escapeHtml(c.name)}</strong>${escapeHtml(c.body)}
          <time>${formatCommentDate(c.created_at)}</time>
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
          <button class="play-btn" type="button" aria-label="Play ${song.title} (30-second preview)">
            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          </button>
          <div class="song-card__progress-wrap">
            <div class="song-card__progress" data-role="progress">
              <div class="song-card__progress-fill" data-role="progress-fill"></div>
            </div>
            <div class="song-card__times">
              <span data-role="time-current">0:00</span>
              <span data-role="time-total">0:${String(PREVIEW_SECONDS).padStart(2, "0")}</span>
            </div>
          </div>
        </div>

        <div class="waveform" aria-hidden="true">${buildWaveform()}</div>

        <p class="song-card__note" data-role="mode-note">30-second preview — loading…</p>

        <div class="song-card__links" data-role="stream-links">
          <span class="song-card__links-label">Preview finished — keep listening on</span>
          <div class="song-card__link-row">
            <a class="stream-btn stream-btn--apple" href="${APPLE_MUSIC_URL}" target="_blank" rel="noopener">Open directly in the Apple Music Store</a>
            <a class="stream-btn stream-btn--spotify" href="${SPOTIFY_URL}" target="_blank" rel="noopener">Open directly in Spotify</a>
          </div>
        </div>
      </div>

      <div class="song-card__feedback">
        <div class="feedback__row">
          <button class="like-btn" type="button" data-role="like-btn" aria-pressed="false" disabled>
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.6 8.4 2.3 5 5.8 5c2 0 3.4 1 4.2 2.3C10.8 6 12.2 5 14.2 5c3.5 0 5.2 3.4 3.8 6.7C19.5 16.4 12 21 12 21z"/></svg>
            <span data-role="like-count">…</span>
          </button>
          <span class="feedback__count-label" data-role="comment-count-label"></span>
        </div>

        <div class="comments" data-role="comments"><p class="comment comment--empty">Loading…</p></div>

        <form class="comment-form" data-role="comment-form">
          <div class="comment-form__row">
            <input type="text" name="name" placeholder="Your name" maxlength="30" required />
          </div>
          <textarea name="text" placeholder="What do you think of the track?" maxlength="240" required></textarea>
          <button type="submit">Send comment</button>
        </form>

        <p class="feedback__disclaimer" data-role="feedback-note">💬 Likes &amp; comments are visible to all visitors and stored securely. This requires accepting the cookie once (banner at the bottom of the screen).</p>
      </div>
    </article>`;
  }

  function initSongCard(song) {
    const card = document.getElementById(`card-${song.id}`);
    const playBtn = card.querySelector(".play-btn");
    const progressFill = card.querySelector('[data-role="progress-fill"]');
    const timeCurrent = card.querySelector('[data-role="time-current"]');
    const modeNote = card.querySelector('[data-role="mode-note"]');
    const streamLinks = card.querySelector('[data-role="stream-links"]');
    const likeBtn = card.querySelector('[data-role="like-btn"]');
    const likeCountEl = card.querySelector('[data-role="like-count"]');
    const commentsEl = card.querySelector('[data-role="comments"]');
    const commentCountLabel = card.querySelector('[data-role="comment-count-label"]');
    const commentForm = card.querySelector('[data-role="comment-form"]');

    /* --- Player: real <audio> first, synthesized loop as fallback ---
       One-shot 30-second preview per track per page load (see
       PREVIEW_SECONDS above) — mirrors the previous Jazz-page behaviour.
       After the cap (or if the file itself is shorter), playback stops
       for good and the Apple Music / Spotify buttons appear. */
    const audio = new Audio();
    audio.preload = "none";
    let mode = "pending"; // "file" | "demo"
    let rafId = null;
    let synth = null; // active demo synth handle
    let previewUsed = false; // once true, no further playback is allowed

    audio.addEventListener("error", () => {
      if (mode !== "file") switchToDemoMode();
    });
    audio.addEventListener("loadedmetadata", () => {
      mode = "file";
      modeNote.textContent = "🎵 Live track — 30-second preview";
    });
    audio.src = song.audioSrc;
    audio.load();

    function switchToDemoMode() {
      mode = "demo";
      modeNote.textContent = "🔊 Preview loop (demo — add a real MP3 to assets/audio/) — 30 seconds";
    }
    // If no metadata arrives quickly (no file present), assume demo mode.
    setTimeout(() => { if (mode === "pending") switchToDemoMode(); }, 900);

    function stopEngines() {
      audio.pause();
      if (synth) { synth.stop(); synth = null; }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function stopAll() {
      card.classList.remove("is-playing");
      stopEngines();
    }

    function endPreviewForGood() {
      stopAll();
      previewUsed = true;
      progressFill.style.width = "100%";
      timeCurrent.textContent = formatTime(PREVIEW_SECONDS);
      playBtn.disabled = true;
      playBtn.setAttribute("aria-label", `${song.title}: preview finished`);
      modeNote.textContent = "✅ Preview finished.";
      streamLinks.classList.add("is-visible");
    }

    function tickFile(startedAt) {
      const elapsed = (performance.now() - startedAt) / 1000;
      if (elapsed >= PREVIEW_SECONDS) { endPreviewForGood(); return; }
      const pct = (elapsed / PREVIEW_SECONDS) * 100;
      progressFill.style.width = `${pct}%`;
      timeCurrent.textContent = formatTime(elapsed);
      rafId = requestAnimationFrame(() => tickFile(startedAt));
    }

    function tickDemo(startedAt) {
      const elapsed = (performance.now() - startedAt) / 1000;
      if (elapsed >= PREVIEW_SECONDS) { endPreviewForGood(); return; }
      const pct = (elapsed / PREVIEW_SECONDS) * 100;
      progressFill.style.width = `${pct}%`;
      timeCurrent.textContent = formatTime(elapsed);
      rafId = requestAnimationFrame(() => tickDemo(startedAt));
    }

    playBtn.addEventListener("click", () => {
      if (previewUsed) return; // no replays once the 30s preview has run

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
      const startedAt = performance.now();

      if (mode === "demo") {
        synth = createDemoLoop(song.bpm);
        tickDemo(startedAt);
      } else {
        audio.currentTime = 0;
        audio.play().then(() => tickFile(startedAt)).catch(() => {
          switchToDemoMode();
          synth = createDemoLoop(song.bpm);
          tickDemo(startedAt);
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

    card.addEventListener("huk53:stop", stopAll);

    /* --- Likes & Comments (Supabase, cookie-consent-gated) --- */
    let likeState = { liked: false, count: null };

    function renderLikeButton() {
      const hasConsent = !!window.HUK53?.hasConsent?.();
      const configured = !!window.HUK53?.getSupabase?.();
      likeBtn.classList.toggle("is-liked", likeState.liked);
      likeBtn.setAttribute("aria-pressed", String(likeState.liked));
      likeCountEl.textContent = likeState.count === null ? "–" : likeState.count;
      likeBtn.disabled = !hasConsent || !configured;
      likeBtn.title = !configured
        ? "Feedback backend not connected yet"
        : hasConsent ? "" : "Please accept the cookie first (banner below)";
    }

    async function loadLikes() {
      try {
        likeState = await fetchLikeState(song);
      } catch {
        likeState = { liked: false, count: null };
      }
      renderLikeButton();
    }

    likeBtn.addEventListener("click", async () => {
      if (likeBtn.disabled) return;
      const prev = likeState;
      likeState = { liked: !prev.liked, count: (prev.count ?? 0) + (!prev.liked ? 1 : -1) };
      renderLikeButton();
      likeBtn.classList.remove("pop");
      void likeBtn.offsetWidth; // restart animation
      likeBtn.classList.add("pop");
      try {
        await toggleLike(song, prev.liked);
      } catch (err) {
        console.warn("Could not save like:", err);
        likeState = prev; // revert optimistic update
        renderLikeButton();
      }
    });

    async function refreshComments() {
      const { comments, unavailable } = await fetchComments(song);
      renderComments(commentsEl, comments);
      commentCountLabel.textContent = unavailable
        ? ""
        : `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
    }

    function updateFormAvailability() {
      const hasConsent = !!window.HUK53?.hasConsent?.();
      const configured = !!window.HUK53?.getSupabase?.();
      const enabled = hasConsent && configured;
      commentForm.querySelectorAll("input, textarea, button").forEach((el) => { el.disabled = !enabled; });
      const submitBtn = commentForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = !configured
          ? "Backend not connected yet"
          : hasConsent ? "Send comment" : "Please accept the cookie";
      }
    }

    loadLikes();
    refreshComments();
    updateFormAvailability();

    document.addEventListener("huk53:consent-changed", () => {
      renderLikeButton();
      updateFormAvailability();
      if (window.HUK53?.hasConsent?.()) loadLikes();
    });

    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!window.HUK53?.hasConsent?.()) return;
      const name = commentForm.elements.name.value.trim();
      const text = commentForm.elements.text.value.trim();
      if (!name || !text) return;
      const submitBtn = commentForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try {
        await postComment(song, name, text);
        commentForm.reset();
        await refreshComments();
      } catch (err) {
        console.warn("Could not save comment:", err);
      } finally {
        submitBtn.disabled = false;
      }
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
   * 6) FOOTER — current year
   * ------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
