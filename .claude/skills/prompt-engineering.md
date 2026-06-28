# Prompt Engineering

## Purpose
Define how to write, structure, version, and maintain AI prompts in Vizzy Chat. Prompts are first-class code — they follow conventions as strict as any other module.

---

## Prompt File Conventions

All prompts live in `src/ai/prompts/`. Each prompt is a versioned TypeScript file that exports a typed builder function.

```
src/ai/prompts/
  intent-detection.v1.ts
  image-generation.v1.ts
  image-generation.v2.ts   # Active version after behavior change
  story-generation.v1.ts
  refinement.v1.ts
```

**Naming:** `<purpose>.v<N>.ts` — bump version when prompt behavior changes meaningfully. Keep old versions until all dependents are migrated.

---

## Prompt Function Signature

Every prompt is exported as a function with a typed parameter object:

```ts
// src/ai/prompts/image-generation.v2.ts

interface ImageGenerationPromptParams {
  description: string
  style: 'photorealistic' | 'illustrated' | 'abstract'
  mood?: string
  aspectRatio: '1:1' | '16:9' | '9:16'
}

export function buildImageGenerationPrompt(params: ImageGenerationPromptParams): {
  system: string
  user: string
} {
  return {
    system: `You are a creative AI that generates vivid, detailed image generation prompts...`,
    user: `Create an image: ${params.description}. Style: ${params.style}...`
  }
}
```

**Never:**
- Return a single string blob mixing system and user content
- Accept `string` parameters without a typed interface
- Concatenate prompt strings across multiple files

---

## Message Role Responsibilities

| Role | Responsibility |
|---|---|
| `system` | Persona, constraints, output format, rules the AI must follow |
| `user` | The specific creative request for this invocation |
| `assistant` | Only used for few-shot examples in the prompt — not generated content |

Keep system prompts stable across invocations. Keep user prompts specific to the current request.

---

## Intent Detection Prompt Design

The intent detection prompt must return a **structured discriminated union**, not free text.

Use `generateObject` with a Zod schema:

```ts
const intentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('image-generation'), style: z.string(), mood: z.string().optional() }),
  z.object({ type: z.literal('story-creation'), genre: z.string(), length: z.enum(['short', 'medium', 'long']) }),
  z.object({ type: z.literal('refinement'), targetField: z.string(), direction: z.string() }),
])
```

The prompt must instruct the model to respond only with JSON matching this schema.

---

## Structured Output Prompt Design

When a plugin needs structured output:

1. Define the Zod schema for the expected output shape
2. Pass it to `generateObject` — the model is constrained to match it
3. The Zod schema also serves as runtime validation

```ts
const posterSchema = z.object({
  headline: z.string().max(60),
  subheadline: z.string().optional(),
  colorScheme: z.array(z.string()).length(3),
  layout: z.enum(['centered', 'left-aligned', 'split']),
})

const result = await aiClient.generateObject({
  prompt: buildPosterPrompt(params),
  schema: posterSchema,
})
```

---

## Prompt Versioning

**When to bump the version:**
- The output format changes
- System prompt instructions change significantly
- A bug in the prompt caused incorrect outputs

**When NOT to bump:**
- Wording tweaks that don't change behavior
- Formatting changes in the returned string that don't affect parsing

**Migration:** import the new version in the plugin. Archive the old version. Do not delete old versions until you confirm no session is referencing them.

---

## Prompt Injection Defense

User input must never reach the system prompt directly.

```ts
// Wrong — prompt injection risk
system: `You are a creative AI. User preferences: ${user.freeTextInput}`

// Correct — sanitized and structured
system: `You are a creative AI.`
user: buildUserMessage({ sanitizedDescription: sanitize(userInput) })
```

Sanitization: strip HTML tags, remove control characters, truncate at a safe length. See `security.md`.

---

## Testing Prompts

Prompts are deterministic when given fixed inputs. Test them with snapshots:

```ts
// src/ai/prompts/__tests__/image-generation.test.ts
it('builds correct prompt for photorealistic style', () => {
  const result = buildImageGenerationPrompt({ description: 'a cat', style: 'photorealistic', aspectRatio: '1:1' })
  expect(result.user).toMatchSnapshot()
})
```

Snapshot tests catch unintentional prompt changes during refactors.

---

## Common Mistakes

- Building prompt strings inside `execute.ts` — use `src/ai/prompts/`
- Mixing system and user content in one string
- Accepting `any` as prompt parameters
- Leaking user PII into the system prompt
- Not versioning when behavior changes — causes silent regressions
- Using `generateText` for structured outputs — use `generateObject` with Zod

**See also:** `ai-engine.md`, `security.md`
