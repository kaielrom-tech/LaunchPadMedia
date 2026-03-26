/**
 * Cloud config — `npm run build` / `/api/lpm-public-config` can overwrite these values.
 * Reviews load and save only via Supabase. Contact may use Supabase, Web3Forms, or localStorage.
 */
window.LPM_CONFIG = {
  supabaseUrl: "https://fcxfnieqtrpvrzuvgrgl.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjeGZuaWVxdHJwdnJ6dXZncmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjA0MTQsImV4cCI6MjA5MDEzNjQxNH0.ORPch9os_ZsS-5TCOApDIjkrNFqk1VMHrloJhChqhNk",
  adminFunctionUrl: "/api/lpm-admin",
  adminGmailAccountHint: "contact.launch.pad.media@gmail.com",
  /** Set your key from https://web3forms.com — contact form emails you instead of Supabase/localStorage. */
  web3formsAccessKey: ""
};

window.LPM_USE_REMOTE = function () {
  const c = window.LPM_CONFIG || {};
  return Boolean(String(c.supabaseUrl || "").trim() && String(c.supabaseAnonKey || "").trim());
};
