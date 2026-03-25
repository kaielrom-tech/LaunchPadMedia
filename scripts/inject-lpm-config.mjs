/**
 * Writes js/lpm-config.js from environment variables.
 * On Netlify: set SUPABASE_URL + SUPABASE_ANON_KEY (anon public key, not service_role).
 * Run locally: SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ... npm run build
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "js", "lpm-config.js");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
const adminFunctionUrl = (process.env.LPM_ADMIN_FUNCTION_URL || "/.netlify/functions/lpm-admin").trim();
const adminGmailAccountHint = (process.env.LPM_GMAIL_HINT || "contact.launch.pad.media@gmail.com").trim();

if ((supabaseUrl && !supabaseAnonKey) || (!supabaseUrl && supabaseAnonKey)) {
  console.warn(
    "inject-lpm-config: Set both SUPABASE_URL and SUPABASE_ANON_KEY for remote mode (or leave both unset for localStorage-only)."
  );
}

const file = `/**
 * Cloud config — overwritten by \`npm run build\` / Netlify (see scripts/inject-lpm-config.mjs).
 * Empty URL/key = localStorage only on this browser.
 */
window.LPM_CONFIG = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  adminFunctionUrl: ${JSON.stringify(adminFunctionUrl)},
  adminGmailAccountHint: ${JSON.stringify(adminGmailAccountHint)}
};

window.LPM_USE_REMOTE = function () {
  const c = window.LPM_CONFIG || {};
  return Boolean(String(c.supabaseUrl || "").trim() && String(c.supabaseAnonKey || "").trim());
};
`;

fs.writeFileSync(outPath, file, "utf8");
console.log(`inject-lpm-config: wrote ${path.relative(root, outPath)} (${supabaseUrl ? "Supabase remote" : "local-only defaults"})`);
