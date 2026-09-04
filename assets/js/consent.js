/* ==========================================================================
   HUK FUSION EDM — Cookie consent + Supabase client + visitor id
   ==========================================================================

   One cookie (`huk53_visitor_id`, a random UUID) is used to attribute
   likes/comments to an anonymous visitor and to log the consent decision
   itself. It is set ONLY after explicit "Akzeptieren". "Ablehnen" just
   dismisses the banner for this visit — the rest of the site works
   completely normally either way, only the like/comment feature (which
   functionally needs the id) stays off. See datenschutz.html.

   Requires two values set on `window` BEFORE this script loads (see
   edm.html): HUK53_SUPABASE_URL and HUK53_SUPABASE_ANON_KEY (both are
   public-by-design values from Supabase — see README). Until both are
   set, the API-dependent features degrade gracefully (see main.js).
   ========================================================================== */

(() => {
  "use strict";

  const COOKIE_NAME = "huk53_visitor_id";
  const COOKIE_DAYS = 365;

  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
  }

  window.HUK53 = window.HUK53 || {};
  window.HUK53.getVisitorId = () => getCookie(COOKIE_NAME);
  window.HUK53.hasConsent = () => !!getCookie(COOKIE_NAME);

  /* --- Supabase client (lazy singleton) --- */
  let client = null;
  let clientTried = false;
  window.HUK53.getSupabase = function getSupabase() {
    if (client) return client;
    if (clientTried) return null;
    clientTried = true;
    const url = window.HUK53_SUPABASE_URL;
    const key = window.HUK53_SUPABASE_ANON_KEY;
    if (!url || !key || !window.supabase) return null;
    client = window.supabase.createClient(url, key);
    return client;
  };

  async function logConsent(granted, visitorId) {
    const supa = window.HUK53.getSupabase();
    if (!supa) return;
    try {
      await supa.from("consent_log").insert({
        visitor_id: visitorId,
        granted,
        page: location.pathname,
      });
    } catch (err) {
      console.warn("Konnte Consent-Entscheidung nicht protokollieren:", err);
    }
  }

  /* --- Banner --- */
  let banner = null;

  function buildBanner() {
    const el = document.createElement("div");
    el.className = "cookie-banner";
    el.innerHTML = `
      <div class="cookie-banner__text">
        <strong>Ein Cookie für Likes &amp; Kommentare</strong>
        <p>
          Wir setzen ein einzelnes technisches Cookie, um deine Likes und Kommentare
          einem anonymen Besuchsprofil zuzuordnen und Missbrauch zu verhindern.
          Ohne Zustimmung funktioniert die restliche Seite ganz normal — nur Liken
          und Kommentieren ist dann nicht möglich. Details in der
          <a href="datenschutz.html">Datenschutzerklärung</a>.
        </p>
      </div>
      <div class="cookie-banner__actions">
        <button type="button" class="btn btn--ghost" data-role="reject">Ablehnen</button>
        <button type="button" class="btn btn--primary" data-role="accept">Akzeptieren</button>
      </div>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));

    el.querySelector('[data-role="accept"]').addEventListener("click", () => {
      const id = crypto.randomUUID();
      setCookie(COOKIE_NAME, id, COOKIE_DAYS);
      logConsent(true, id);
      dismiss();
      document.dispatchEvent(new CustomEvent("huk53:consent-changed", { detail: { granted: true } }));
    });

    el.querySelector('[data-role="reject"]').addEventListener("click", () => {
      logConsent(false, null);
      dismiss();
      document.dispatchEvent(new CustomEvent("huk53:consent-changed", { detail: { granted: false } }));
    });

    function dismiss() {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 300);
      banner = null;
    }

    return el;
  }

  function init() {
    if (!window.HUK53.hasConsent()) {
      banner = buildBanner();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
