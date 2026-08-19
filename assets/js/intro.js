/* ==========================================================================
   HUK53 — Hidden "Intro Mode" (background motif + autoplay soundtrack)
   ==========================================================================

   WHAT THIS DOES
   When active, the page tries to autoplay a soundtrack on load (looping)
   while the existing animated hero background (assets/js/main.js, the
   canvas blob motif) plays as the visual "Motiv". A small floating sound
   button appears immediately — before playback even starts — so every
   visitor has a direct, always-available way to turn the sound off. Only
   the ON/OFF *decision to run Intro Mode at all* is hidden behind the
   secret trigger below; muting is never hidden.

   HOW TO TURN IT ON FOR EVERYONE (all visitors, every browser)
   Flip INTRO_ENABLED_DEFAULT below to `true` and redeploy. This is a
   normal site setting, not a per-visitor preference — there is no
   backend, so a code change is the only way it applies to people other
   than you.

   THE HIDDEN OWNER TOGGLE
   Two ways to open the settings bar (nobody else will stumble onto this
   by clicking around):
     1. Type  h u k 5 3  anywhere on the page (not while a text field is
        focused) — a "secret word", no key combo to remember.
     2. Ctrl+Shift+E (Cmd+Shift+E on Mac) as a fallback if typing feels
        awkward, e.g. on mobile.

   Whatever you choose there is saved with `localStorage` — i.e. **only
   in the browser/device you used to set it**. It does NOT change what
   other visitors see; it's meant for previewing the effect on your own
   machine. To ship a decision to everyone, use the constant below.
   ========================================================================== */

(() => {
  "use strict";

  const INTRO_ENABLED_DEFAULT = true;
  const OVERRIDE_KEY = "huk53_intro_override"; // "on" | "off" | (absent = default)
  const SECRET_WORD = "huk53";

  function effectiveIntroEnabled() {
    const override = localStorage.getItem(OVERRIDE_KEY);
    if (override === "on") return true;
    if (override === "off") return false;
    return INTRO_ENABLED_DEFAULT;
  }

  /* ------------------------------------------------------------------ *
   * Soundtrack playback
   * Each page declares its own intro track before this script loads:
   *   <script>window.HUK53_INTRO_TRACK = "assets/audio/xyz.mp3";</script>
   * If that file doesn't exist (yet), the visual motif still runs; we
   * don't synthesize a fallback soundtrack here — see README for why.
   *
   * The mute/sound button is shown immediately once intro mode is on —
   * *before* playback even starts — so every visitor has a direct, always-
   * available way to turn the sound off, regardless of whether autoplay
   * succeeded yet. Muting here also cancels any pending autoplay retry.
   * ------------------------------------------------------------------ */
  let introAudio = null;
  let soundBtn = null;
  let userMuted = false;

  function buildSoundButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "intro-mute-btn";
    updateSoundButton(btn);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      userMuted = !userMuted;
      if (introAudio) introAudio.muted = userMuted;
      updateSoundButton(btn);
      if (!userMuted) attemptPlay(); // resume/retry immediately on unmute
    });
    document.body.appendChild(btn);
    return btn;
  }

  function updateSoundButton(btn) {
    btn.innerHTML = userMuted ? "🔇" : "🔊";
    btn.setAttribute("aria-label", userMuted ? "Soundtrack einschalten" : "Soundtrack stummschalten");
  }

  function attemptPlay() {
    if (!introAudio || userMuted) return;
    introAudio.play().catch(() => {
      // Blocked by the browser's autoplay policy — try again on the
      // visitor's first interaction with the page (a click/tap/keypress
      // anywhere other than the sound button itself, handled above).
      // This is the closest a browser allows to "plays immediately".
      const retry = () => {
        if (!userMuted) introAudio.play().catch(() => {});
      };
      document.addEventListener("pointerdown", retry, { once: true });
      document.addEventListener("keydown", retry, { once: true });
    });
  }

  function pauseIntroAudio() {
    if (introAudio) introAudio.pause();
  }

  function startIntroSoundtrack() {
    soundBtn = buildSoundButton(); // visible right away, even before playback starts

    const src = window.HUK53_INTRO_TRACK;
    if (!src) return; // visual motif only — no soundtrack file declared for this page

    introAudio = new Audio(src);
    introAudio.loop = true;
    introAudio.volume = 0.55;
    attemptPlay();

    // If a visitor presses a track's own play button, get out of the way.
    document.addEventListener("click", (e) => {
      if (e.target.closest(".play-btn")) pauseIntroAudio();
    });
  }

  function applyIntroMode() {
    if (!effectiveIntroEnabled()) return;
    document.body.classList.add("intro-active");
    startIntroSoundtrack();
  }

  /* ------------------------------------------------------------------ *
   * Hidden settings bar
   * ------------------------------------------------------------------ */
  let bar = null;

  function buildBar() {
    const el = document.createElement("div");
    el.className = "intro-settings-bar";
    el.innerHTML = `
      <div class="intro-settings-bar__head">
        <strong>🔧 Intro-Einstellungen</strong>
        <button type="button" class="intro-settings-bar__close" aria-label="Schließen">✕</button>
      </div>
      <p class="intro-settings-bar__hint">Nur in diesem Browser sichtbar/gespeichert — ändert nichts für andere Besucher:innen.</p>
      <label class="intro-settings-bar__toggle">
        <input type="checkbox" id="introToggleInput" />
        <span>Intro-Modus (Hintergrund-Motiv + Soundtrack beim Öffnen)</span>
      </label>
      <div class="intro-settings-bar__status" id="introStatus"></div>
      <button type="button" class="intro-settings-bar__reset" id="introReset">Auf Website-Standard zurücksetzen</button>
    `;
    document.body.appendChild(el);

    const checkbox = el.querySelector("#introToggleInput");
    const status = el.querySelector("#introStatus");
    const closeBtn = el.querySelector(".intro-settings-bar__close");
    const resetBtn = el.querySelector("#introReset");

    function refreshStatus() {
      const override = localStorage.getItem(OVERRIDE_KEY);
      checkbox.checked = effectiveIntroEnabled();
      if (override === "on") status.textContent = "Status: manuell AN (nur hier).";
      else if (override === "off") status.textContent = "Status: manuell AUS (nur hier).";
      else status.textContent = `Status: Website-Standard (aktuell ${INTRO_ENABLED_DEFAULT ? "AN" : "AUS"}).`;
    }

    checkbox.addEventListener("change", () => {
      localStorage.setItem(OVERRIDE_KEY, checkbox.checked ? "on" : "off");
      refreshStatus();
    });

    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(OVERRIDE_KEY);
      refreshStatus();
    });

    closeBtn.addEventListener("click", hideBar);
    refreshStatus();
    return el;
  }

  function showBar() {
    if (!bar) bar = buildBar();
    bar.classList.add("is-visible");
  }

  function hideBar() {
    if (bar) bar.classList.remove("is-visible");
  }

  function toggleBar() {
    if (bar && bar.classList.contains("is-visible")) hideBar();
    else showBar();
  }

  /* ------------------------------------------------------------------ *
   * Secret triggers
   * ------------------------------------------------------------------ */
  let typedBuffer = "";

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if (bar && bar.classList.contains("is-visible") && e.key === "Escape") {
      hideBar();
      return;
    }

    if (isTyping) return;

    // Ctrl/Cmd+Shift+E
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") {
      e.preventDefault();
      toggleBar();
      return;
    }

    // Typed secret word
    if (e.key.length === 1) {
      typedBuffer = (typedBuffer + e.key.toLowerCase()).slice(-SECRET_WORD.length);
      if (typedBuffer === SECRET_WORD) {
        typedBuffer = "";
        toggleBar();
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyIntroMode);
  } else {
    applyIntroMode();
  }
})();
