/**
 * Cloud data (Supabase) — fill in after running docs/SUPABASE_SETUP.md
 * Leave supabaseUrl empty to use browser localStorage only (same device).
 */
window.LPM_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  adminFunctionUrl: "/.netlify/functions/lpm-admin",
  /** Optional: shown in Admin as a reminder — “From” is whoever is logged in at mail.google.com in this browser. */
  adminGmailAccountHint: "contact.launch.pad.media@gmail.com"
};

window.LPM_USE_REMOTE = function () {
  const c = window.LPM_CONFIG || {};
  return Boolean(String(c.supabaseUrl || "").trim() && String(c.supabaseAnonKey || "").trim());
};
