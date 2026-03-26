/**
 * Writes js/lpm-config.js from environment variables (CI / Cloudflare Pages build).
 * Set SUPABASE_URL + SUPABASE_ANON_KEY (anon key, not service_role).
 * Run locally: SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ... npm run build
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "js", "lpm-config.js");

function firstEnv(keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

const DEFAULT_SUPABASE_URL = "https://fcxfnieqtrpvrzuvgrgl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjeGZuaWVxdHJwdnJ6dXZncmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjA0MTQsImV4cCI6MjA5MDEzNjQxNH0.ORPch9os_ZsS-5TCOApDIjkrNFqk1VMHrloJhChqhNk";

const supabaseUrl =
  firstEnv(["SUPABASE_URL", "PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"]) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  firstEnv([
    "SUPABASE_ANON_KEY",
    "PUBLIC_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ]) || DEFAULT_SUPABASE_ANON_KEY;
const adminFunctionUrl = (process.env.LPM_ADMIN_FUNCTION_URL || "/api/lpm-admin").trim();
const adminGmailAccountHint = (process.env.LPM_GMAIL_HINT || "contact.launch.pad.media@gmail.com").trim();
const web3formsAccessKey = firstEnv([
  "WEB3FORMS_ACCESS_KEY",
  "PUBLIC_WEB3FORMS_ACCESS_KEY",
  "VITE_WEB3FORMS_ACCESS_KEY"
]);

if ((supabaseUrl && !supabaseAnonKey) || (!supabaseUrl && supabaseAnonKey)) {
  console.warn(
    "inject-lpm-config: Set both SUPABASE_URL and SUPABASE_ANON_KEY for remote mode (or leave both unset for localStorage-only)."
  );
}

const file = `/**
 * Cloud config — overwritten by \`npm run build\` (see scripts/inject-lpm-config.mjs).
 * Empty URL/key = localStorage only on this browser.
 */
window.LPM_CONFIG = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  adminFunctionUrl: ${JSON.stringify(adminFunctionUrl)},
  adminGmailAccountHint: ${JSON.stringify(adminGmailAccountHint)},
  web3formsAccessKey: ${JSON.stringify(web3formsAccessKey)}
};

window.LPM_USE_REMOTE = function () {
  const c = window.LPM_CONFIG || {};
  return Boolean(String(c.supabaseUrl || "").trim() && String(c.supabaseAnonKey || "").trim());
};
`;

fs.writeFileSync(outPath, file, "utf8");
console.log(`inject-lpm-config: wrote ${path.relative(root, outPath)} (${supabaseUrl ? "Supabase remote" : "local-only defaults"})`);
