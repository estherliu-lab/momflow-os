export interface AiRequest {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  prompt: string;
}

export async function generateWithAi(request: AiRequest) {
  if (!request.apiKey || request.provider === "local-template") {
    return { mode: "local", text: "" };
  }
  return {
    mode: "placeholder",
    text: "AI provider connection is reserved for production integration."
  };
}
