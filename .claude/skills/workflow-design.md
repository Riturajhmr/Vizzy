# Workflow Design

## Purpose
Guide the design and implementation of new creative workflow plugins. Every new creative capability in Vizzy Chat is a workflow plugin. This skill defines how to scope, design, and build one correctly.

---

## What Qualifies as a New Workflow

A new workflow plugin is justified when the capability has:
- A **distinct input type** (text description, uploaded image, structured brief)
- A **distinct AI strategy** (different prompts, different models, different output shape)
- A **distinct output type** (generated image, story text, structured brand kit)

Variations of existing workflows (e.g., "a warmer version of this image") are **refinements** handled by the Conversation Engine, not new plugins.

When in doubt: if the same plugin can handle it via parameters or context, don't create a new plugin.

---

## Workflow Taxonomy

| Type | Behavior | Examples |
|---|---|---|
| **Generative** | Creates new content from description | Image generation, story writing, poster creation |
| **Transformative** | Modifies existing content | Photo editing, style transfer, color grading |
| **Compositional** | Assembles multiple pieces | Mood board, brand kit, campaign set |
| **Informational** | Returns structured creative guidance | Ideation, color palette, creative brief |

Know your workflow's type before designing its AI strategy.

---

## The WorkflowPlugin Interface

```ts
interface WorkflowPlugin {
  id: string                                           // Unique kebab-case identifier
  name: string                                         // Human-readable display name
  detect: (intent: Intent) => boolean                  // Intent matching
  execute: (context: WorkflowContext) => Promise<WorkflowResult>  // Core logic
  validate: (result: WorkflowResult) => boolean        // Output quality gate
}
```

---

## Designing `detect(intent: Intent): boolean`

- Return `true` only when intent clearly belongs to this plugin's domain
- Prefer specificity over breadth — a missed intent falls back to a default; a stolen intent breaks another plugin
- Never catch-all — there is no "else" plugin; ambiguous intents should return `false` everywhere and trigger a clarification response
- Base detection on intent type discriminator, not keyword matching

```ts
// Good: narrow, explicit
detect: (intent) => intent.type === 'image-generation' && intent.style !== 'photo-realistic'

// Bad: too broad, will steal intents
detect: (intent) => intent.description.includes('create')
```

---

## Designing `execute(context: WorkflowContext): Promise<WorkflowResult>`

Rules:
- **Always stateless** — read context, call AI/services, return result. Zero side effects.
- One clear output type per plugin
- Use versioned prompts from `src/ai/prompts/` — never build prompts inline
- Use `src/lib/ai/client.ts` — never import provider SDKs directly
- Structural validation before returning; leave quality judgment to `validate()`

```ts
// execute.ts
export async function execute(context: WorkflowContext): Promise<WorkflowResult> {
  const prompt = buildImagePrompt({ description: context.userIntent, style: context.parameters.style })
  const image = await aiClient.generateImage(prompt)
  return { type: 'image', url: image.url, metadata: { prompt, model: image.model } }
}
```

---

## Designing `validate(result: WorkflowResult): boolean`

- Verify the result meets minimum structural requirements (non-null, correct type, no error flags)
- Return `false` to trigger a graceful fallback response — do not throw
- Keep validation fast and synchronous; no AI calls inside `validate()`

---

## Folder Structure

```
src/workflows/<capability>/
  index.ts        # WorkflowPlugin export (assembles detect, execute, validate)
  execute.ts      # Core execution logic
  detect.ts       # Intent matching logic
  validate.ts     # Output validation
  types.ts        # Plugin-specific types (extends WorkflowResult)
  README.md       # Required — see README spec below
```

---

## Splitting vs. Combining Plugins

| Same plugin | Separate plugins |
|---|---|
| Same AI strategy, different parameters | Different AI strategies |
| Same output type, different content | Different output types |
| Refinements of the same creative act | Distinct creative acts |

---

## Workflow README Spec

Every plugin folder must include a `README.md` with:

```markdown
# <Workflow Name>

## Purpose
One sentence on what this workflow creates.

## Input
What fields from WorkflowContext this plugin uses.

## Output
The shape of WorkflowResult this plugin returns.

## AI Strategy
Which model, which prompt file, structured vs. streaming output.

## Known Limitations
Edge cases, unsupported inputs, quality constraints.

## Example Prompts
3–5 user messages that correctly trigger this workflow.
```

---

## Common Mistakes

- `detect()` returns `true` too broadly — breaks other plugins
- AI calls or DB writes inside `validate()`
- Prompts built inline in `execute.ts` instead of imported from `src/ai/prompts/`
- Plugin holds state between invocations
- UI rendering logic inside a plugin
- No `README.md`

**See also:** `plugin-system.md`, `prompt-engineering.md`, `ai-engine.md`
