/**
 * Cloud config — overwritten by `npm run build` on Netlify (see scripts/inject-lpm-config.mjs).
 * For local testing with Supabase, run: npm run build with SUPABASE_URL + SUPABASE_ANON_KEY set.
 * Empty values = localStorage only (same device).
 */
window.LPM_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  adminFunctionUrl: "/.netlify/functions/lpm-admin",
  adminGmailAccountHint: "contact.launch.pad.media@gmail.com"
};

window.LPM_USE_REMOTE = function () {
  const c = window.LPM_CONFIG || {};
  return Boolean(String(c.supabaseUrl || "").trim() && String(c.supabaseAnonKey || "").trim());
};
