/**
 * Cloud config — overwritten by `npm run build` (see scripts/inject-lpm-config.mjs).
 * On Cloudflare Pages, `/api/lpm-public-config` can also hydrate empty values at runtime.
 * Empty URL/key = localStorage only (same device).
 */
window.LPM_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  adminFunctionUrl: "/api/lpm-admin",
  adminGmailAccountHint: "contact.launch.pad.media@gmail.com"
};

window.LPM_USE_REMOTE = function () {
  const c = window.LPM_CONFIG || {};
  return Boolean(String(c.supabaseUrl || "").trim() && String(c.supabaseAnonKey || "").trim());
};
