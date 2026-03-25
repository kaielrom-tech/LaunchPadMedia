/**
 * Loads public Supabase URL + anon key from the Pages Function when js/lpm-config.js is empty
 * (e.g. env only available at request time, or no build-time inject).
 */
window.__lpmRemoteReady = (async function hydrateRuntimeConfig() {
  try {
    if (typeof window.LPM_USE_REMOTE === "function" && window.LPM_USE_REMOTE()) {
      return;
    }
    const res = await fetch("/api/lpm-public-config", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.supabaseUrl || !data.supabaseAnonKey) return;
    window.LPM_CONFIG = Object.assign({}, window.LPM_CONFIG || {}, {
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.supabaseAnonKey
    });
    if (data.adminFunctionUrl) {
      window.LPM_CONFIG.adminFunctionUrl = data.adminFunctionUrl;
    }
  } catch (_) {
    /* Offline, wrong host, or Functions not deployed */
  }
})();
