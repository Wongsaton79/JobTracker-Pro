/**
 * Cloudflare Worker for LINE Messaging API Proxy (CORS bypass for GitHub Pages)
 *
 * How to deploy (FREE in 1 minute):
 * 1. Go to https://dash.cloudflare.com/ -> Workers & Pages -> Create Application -> Create Worker
 * 2. Paste this entire code and click "Deploy"
 * 3. Copy the worker URL (e.g., https://my-line-proxy.yourname.workers.dev)
 * 4. Paste it into the JobTracker "LINE Relay / Proxy URL" setting!
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ status: "LINE Relay Proxy Active", method: request.method }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      const body = await request.json();

      // Extract target parameters
      const token =
        request.headers.get("Authorization")?.replace("Bearer ", "") ||
        body.channelAccessToken ||
        body.token;
      const targetId = body.targetId || body.to;
      const messages = body.messages || (body.payload ? (Array.isArray(body.payload) ? body.payload : [body.payload]) : null);

      if (!token) {
        return new Response(JSON.stringify({ success: false, error: "Missing LINE channel access token" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const linePayload = {
        to: targetId,
        messages: messages,
      };

      // Forward to LINE Messaging API
      const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(linePayload),
      });

      const resText = await lineRes.text();

      return new Response(resText, {
        status: lineRes.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
