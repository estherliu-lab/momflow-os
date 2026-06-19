export function buildPrompt(systemPrompt: string, userInput: string) {
  return `${systemPrompt.trim()}\n\nUser idea:\n${userInput.trim()}`;
}
