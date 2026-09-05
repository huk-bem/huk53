/* ==========================================================================
   HUK — Editable site copy loader
   Fetches all rows from the public `site_content` Supabase table and uses
   them to override the text of any element on the current page carrying
   a matching `data-content-key` attribute. The hard-coded text already in
   the HTML is the fallback — shown as-is if Supabase isn't reachable, not
   configured, or a given key has no row yet, so the page never breaks.
   Edited via assets/admin.html (owner-only, see there for details).
   ========================================================================== */

(() => {
  "use strict";

  function getClient() {
    const url = window.HUK53_SUPABASE_URL;
    const key = window.HUK53_SUPABASE_ANON_KEY;
    if (!url || !key || !window.supabase) return null;
    return window.supabase.createClient(url, key);
  }

  async function applyContentOverrides() {
    const nodes = document.querySelectorAll("[data-content-key]");
    if (!nodes.length) return;

    const supa = getClient();
    if (!supa) return; // no config/CDN — keep the built-in default text

    try {
      const { data, error } = await supa.from("site_content").select("key, value");
      if (error || !data) return;
      const values = new Map(data.map((row) => [row.key, row.value]));
      nodes.forEach((el) => {
        const value = values.get(el.dataset.contentKey);
        if (typeof value === "string" && value.length) {
          el.textContent = value;
        }
      });
    } catch (err) {
      console.warn("Could not load editable site content:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyContentOverrides);
  } else {
    applyContentOverrides();
  }
})();
