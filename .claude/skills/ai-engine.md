# AI Engine

## Purpose
Define the AI service abstraction layer — how to wire AI capabilities in a provider-independent way, how intent detection and workflow routing modules work, and when to use each Vercel AI SDK function.

---

## Provider Abstraction

The AI layer is provider-agnostic. Business logic, plugins, and services interact only with the internal AI client — never with provider SDKs directly.

```
src/lib/ai/
  client.ts          # The only import used by the rest of the app
  providers/
    anthropic.ts     # Anthropic adapter
    openai.ts        # OpenAI adapter
    google.ts        # Google adapter
  types.ts           # Shared AI types (GenerateOptions, StreamOptions, etc.)
```

**Rule:** `import { aiClient } from '@/lib/ai/client'` — everywhere in the codebase. Never `import Anthropic from '@anthropic-ai/sdk'` outside of `providers/`.

Switching providers requires changes only in `src/lib/ai/providers/` and the client factory. No business logic changes.

---

## AI Client Interface

```ts
// src/lib/ai/client.ts — conceptual shape
interface AIClient {
  generate: (options: GenerateOptions) => Promise<GenerateResult>
  stream: (options: StreamOptions) => ReadableStream
  generateObject: <T>(options: ObjectOptions<T>) => Promise<T>
  generateImage: (options: ImageOptions) => Promise<ImageResult>
}
```

The client selects the configured provider at runtime. Default: Anthropic (`claude-sonnet-4-6`). Escalate to `claude-opus-4-8` for multi-step reasoning tasks.

---

## Intent Detection Module

Location: `src/ai/intent/`

**What it does:**
- Takes a user message and conversation history
- Returns a typed `Intent` object with `type`, `description`, `parameters`, and `confidence`

**What it does NOT do:**
- Know anything about plugins or workflows
- Return plugin IDs or workflow names
- Make decisions about which capability to use

```ts
// src/ai/intent/detector.ts
export async function detectIntent(
  message: string,
  history: Message[]
): Promise<Intent> { ... }
```

Intent types are a discriminated union defined in `src/types/intent.ts`. Adding a new intent type requires adding it to this union and updating the detection prompt.

---

## Workflow Routing Module

Location: `src/ai/router/`

**What it does:**
- Takes an `Intent` and `WorkflowContext`
- Calls `PluginRegistry.resolve(intent)` to find the right plugin
- Executes the plugin and validates the result
- Returns a `WorkflowResult`

**What it does NOT do:**
- Import or reference specific plugins
- Contain `if/else` or `switch` on intent types
- Make AI calls directly (that belongs to plugins)

---

## Vercel AI SDK — When to Use Each Function

| Function | Use when |
|---|---|
| `streamText` | Conversational responses, chat replies, refinement messages |
| `generateText` | Short, deterministic text completions inside plugins |
| `generateObject` | When output must be parsed into a typed structure (use with Zod schema) |
| `streamObject` | Structured output that benefits from progressive rendering |

For image generation, video, or non-text outputs: use provider-specific adapters in `src/lib/ai/providers/` and expose them through a typed method on `AIClient`.

---

## Response Parsing

All AI response parsing is centralized in `src/ai/parsers/`.

- No `JSON.parse()` in routes or plugins
- No regex extraction of structured data in routes or plugins
- Parsers are typed, tested, and versioned alongside prompts

```ts
// src/ai/parsers/intent-parser.ts
export function parseIntentResponse(raw: string): Intent { ... }
```

---

## Model Selection Rules

| Task | Model |
|---|---|
| Intent detection | `claude-sonnet-4-6` (fast, cheap, accurate for classification) |
| Conversational response | `claude-sonnet-4-6` |
| Complex multi-step reasoning | `claude-opus-4-8` |
| Image generation | Provider-specific (Stable Diffusion, DALL-E, Imagen) via provider adapter |

Never hardcode model IDs outside `src/lib/ai/providers/`. Pass model as a configuration option.

---

## Common Mistakes

- Importing `@anthropic-ai/sdk` in business logic, plugins, or routes
- Hardcoding model ID strings in plugins or services
- Calling `JSON.parse()` on AI responses in route handlers
- Intent detection returning plugin names instead of typed intent discriminators
- Using `generateText` for outputs that should be structured (use `generateObject`)

**See also:** `prompt-engineering.md`, `plugin-system.md`
