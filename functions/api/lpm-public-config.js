function firstEnv(env, keys) {
  for (const k of keys) {
    const v = String(env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = firstEnv(env, ["SUPABASE_URL", "PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"]);
  const supabaseAnonKey = firstEnv(env, [
    "SUPABASE_ANON_KEY",
    "PUBLIC_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ]);
  const adminFunctionUrl = String(env.LPM_ADMIN_FUNCTION_URL || "/api/lpm-admin").trim();

  return new Response(
    JSON.stringify({
      supabaseUrl,
      supabaseAnonKey,
      adminFunctionUrl
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120"
      }
    }
  );
}
