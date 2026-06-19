# Prompt System

Prompts live outside components so creators can replace them.

Principles:

- Gentle, useful, and non-judgmental.
- Turn fragmented life into content assets.
- Protect rest and energy.
- Output clear structures users can copy or edit.

Suggested folders:

- `src/prompts/system`
- `src/prompts/platforms`
- `src/prompts/features`

The MVP uses local templates in `src/lib/generator.ts`. Future AI providers should use these prompt files through `src/lib/ai/promptBuilder.ts`.
