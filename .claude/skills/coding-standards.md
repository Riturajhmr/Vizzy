# Coding Standards

## Purpose
Define the TypeScript conventions, naming rules, documentation standards, and Definition of Done that apply to every file in Vizzy Chat. These are non-negotiable baseline standards, not style preferences.

---

## TypeScript

**Strict mode is always on.** `tsconfig.json` must include `"strict": true`. No exceptions.

| Rule | Correct | Wrong |
|---|---|---|
| No `any` | `unknown` + type guard | `any`, `as any` |
| No manual row types | `InferSelectModel<typeof table>` | `interface ConversationRow { ... }` |
| No type casting without guard | `if (isIntent(x)) { ... }` | `x as Intent` |
| Avoid assertion functions | Return typed result | `function assert(x): asserts x is T` (sparingly) |

```ts
// Correct — unknown + type guard
function processResult(value: unknown): WorkflowResult {
  if (!isWorkflowResult(value)) throw new Error('Invalid result shape')
  return value
}

function isWorkflowResult(value: unknown): value is WorkflowResult {
  return typeof value === 'object' && value !== null && 'type' in value && 'status' in value
}
```

---

## Exports

- **Named exports everywhere** — enables tree shaking and explicit imports
- **Default exports only for:** Next.js `page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`

```ts
// Correct
export function detectIntent(...) { ... }
export type Intent = { ... }

// Wrong
export default function detectIntent(...) { ... }
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `image-generation.ts`, `use-conversation.ts` |
| React components | `PascalCase` | `ChatInterface`, `WorkflowOutput` |
| Functions | `camelCase` | `buildImagePrompt`, `detectIntent` |
| Variables | `camelCase` | `activeWorkflow`, `streamingState` |
| Types / Interfaces | `PascalCase` | `WorkflowPlugin`, `Intent` |
| Enums | `PascalCase` with `UPPER_CASE` values | `WorkflowStatus.IN_PROGRESS` |
| DB columns | `snake_case` (in schema definition) | `user_id`, `created_at` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |

---

## Comments

Write a comment only when the **WHY** is non-obvious to a future reader.

```ts
// Correct — explains a non-obvious constraint
// Supabase RLS requires auth.uid() to be set before this query runs.
// The middleware guarantees this, but we check here as a guard.
const session = await getSession()

// Wrong — explains what the code already says
// Get the user's conversations
const conversations = await getUserConversations(userId)
```

Never:
- Comment out code — delete it (git has history)
- Write "TODO" comments without a linked issue
- Explain what is obvious from the function name or types

---

## Function Design

- One function, one responsibility
- If a function does two things: split it
- Pure functions preferred — same input, same output, no side effects
- Keep functions short — if you can't see the whole function without scrolling, it's probably doing too much

```ts
// Bad — two responsibilities
async function validateAndSaveConversation(conv: unknown) {
  if (!isConversation(conv)) throw new Error('Invalid')
  await db.insert(conversations).values(conv)
}

// Good — separated
function validateConversation(value: unknown): Conversation { ... }
async function saveConversation(conv: Conversation) { ... }
```

---

## Dead Code

Delete it. Immediately. There is no "we might need this later."

- No commented-out blocks
- No `_unused` variables
- No re-exported types for removed features
- No backward-compatibility shims unless supporting an external API

Git history preserves deleted code. Comments and dead exports create noise that degrades future sessions' ability to understand the codebase.

---

## Documentation Standards

| Artifact | Documentation required |
|---|---|
| Workflow plugin | `README.md` in plugin folder (see `workflow-design.md`) |
| Major architecture decision | `docs/architecture/<decision>.md` |
| AI prompt strategy or versioning rationale | Comment block at top of prompt file |
| Complex algorithm or non-obvious invariant | Inline comment with WHY |

Stale documentation is worse than no documentation. Update or delete when the code changes.

---

## Definition of Done

A feature is shippable when ALL of these are true:

1. **Functional** — works end-to-end including error cases and edge cases
2. **Typed** — no `any`, all interfaces in `src/types/` or colocated `types.ts`
3. **Tested** — Vitest unit tests for business logic; Playwright e2e for critical paths
4. **Documented** — plugin README written; architecture decisions recorded if significant
5. **Architecturally clean** — follows folder structure, plugin boundaries, and state rules in `CLAUDE.md`
6. **Additive** — integrates via plugin registry or service layer without modifying existing code

If any of these are missing, the feature is not done.

---

## Development Workflow

Every non-trivial implementation follows this sequence:

**Understand → Design → Architecture Validation → Interface Design → Implementation → Testing → Documentation → Review → Refactor**

Do not write code before understanding the requirement and validating it against the architecture. Do not skip testing. Do not ship without documentation for significant features.

**See also:** All other skills in `.claude/skills/`
