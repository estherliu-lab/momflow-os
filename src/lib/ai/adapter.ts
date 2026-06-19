export interface AiRequest {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  prompt: string;
}

export type AiResponse =
  | { mode: "local"; text: ""; reason: "missing-config" | "local-provider" }
  | { mode: "ai"; text: string };

function buildEndpoint(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  return `${trimmed}/chat/completions`;
}

export async function generateWithAi(request: AiRequest): Promise<AiResponse> {
  if (request.provider === "local-template") {
    return { mode: "local", text: "", reason: "local-provider" };
  }
  if (!request.apiKey?.trim() || !request.baseUrl?.trim() || !request.model?.trim()) {
    return { mode: "local", text: "", reason: "missing-config" };
  }

  const response = await fetch(buildEndpoint(request.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: request.model.trim(),
      temperature: request.temperature ?? 0.7,
      messages: [
        {
          role: "system",
          content: "You are MomFlow, a practical, warm AI content assistant. Create fresh, specific output based on the user's exact idea. Do not reuse a fixed template unless the user asks for one."
        },
        {
          role: "user",
          content: request.prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `AI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";
  if (!text.trim()) throw new Error("AI returned an empty response.");

  return { mode: "ai", text: text.trim() };
}
