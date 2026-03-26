import { createClient } from "@supabase/supabase-js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { password, op, data = {} } = body;
  const adminPass = env.LPM_ADMIN_PASSWORD;
  if (!adminPass || password !== adminPass) {
    return json(401, { error: "Unauthorized" });
  }

  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return json(500, { error: "Server missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
  }

  const supabase = createClient(url, key);

  try {
    switch (op) {
      case "ping":
        return json(200, { ok: true });

      case "bootstrap": {
        const [rev, msg] = await Promise.all([
          supabase.from("reviews").select("*").order("created_at", { ascending: false }),
          supabase.from("contact_messages").select("*").order("submitted", { ascending: false })
        ]);
        if (rev.error) throw rev.error;
        if (msg.error) throw msg.error;
        return json(200, { reviews: rev.data || [], messages: msg.data || [] });
      }

      case "reviews:update": {
        const { id, patch } = data;
        const { error } = await supabase.from("reviews").update(patch).eq("id", id);
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "reviews:delete": {
        const { error } = await supabase.from("reviews").delete().eq("id", data.id);
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "messages:update": {
        const { id, patch } = data;
        const { error } = await supabase.from("contact_messages").update(patch).eq("id", id);
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "messages:delete": {
        const { error } = await supabase.from("contact_messages").delete().eq("id", data.id);
        if (error) throw error;
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: "Unknown op" });
    }
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
}
