export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    if (!env.DEEPSEEK_API_KEY) {
      return new Response("Missing DEEPSEEK_API_KEY", { status: 500, headers: cors });
    }

    const body = await request.json();
    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      return new Response("Missing prompt", { status: 400, headers: cors });
    }

    const upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: body.model || "deepseek-chat",
        temperature: body.temperature ?? 0.7,
        messages: [
          {
            role: "system",
            content: "You are MomFlow, a practical, warm AI content assistant. Create fresh, specific output based on the user's exact idea."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return new Response(JSON.stringify(data), {
        status: upstream.status,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      text: data?.choices?.[0]?.message?.content || ""
    }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
};
