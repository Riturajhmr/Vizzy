# Vizzy Chat — Engineering Handbook

## Project Identity

**Vizzy Chat** is a conversational creative operating system.
It is NOT an image generator. It is NOT a chatbot.
It is a single chat interface where users describe what they want and the system routes to the correct creative workflow automatically.
Every user interaction begins and ends in the chat. No separate creative tools exist.
Conversation is the primary interface — users describe intent, AI selects the workflow.
No tool switching. No menus. Refinement is preferred over regeneration.
The chat surface is the single point of entry for all creative capabilities.

---

## Engineering Principles

- **Maintainability over shortcuts** — write code a future engineer can understand without the author present
- **Extensibility over hardcoding** — open abstractions; closed, stable interfaces
- **Composition over duplication** — share logic through modules, not copy-paste
- **Low coupling, high cohesion** — modules depend on contracts, not implementations
- **Plugin-first** — every creative capability is a plugin; nothing is hardcoded in core
- **Testability** — if it is hard to test, redesign it
- **Developer experience** — clear patterns, consistent naming, minimal cognitive overhead
- **Reusable abstractions over feature-specific implementations** — solve the general case once

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript — strict mode everywhere |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI | Vercel AI SDK (provider-agnostic) — Anthropic, OpenAI, Google |
| State | Zustand (UI) / React Context (conversation) |
| Database | Supabase — PostgreSQL + Auth + Storage |
| ORM | Drizzle |
| Testing | Vitest (unit) + Playwright (e2e) |
| Deploy | Vercel |

---

## Folder Structure

```
src/
  app/           # Next.js App Router pages + API routes
  features/      # Domain feature slices: chat, auth, assets, dashboard
  workflows/     # One folder per creative capability (plugin modules)
  ai/
    intent/      # Intent detection module
    router/      # Workflow router module
    prompts/     # Versioned prompt templates (never inline)
    parsers/     # Centralized response parsers
  components/    # Shared UI components — no business logic
  db/
    schema/      # Drizzle table definitions (one file per domain group)
    migrations/  # Drizzle migration files
    queries/     # Typed query helpers — no raw SQL in routes
  lib/
    ai/          # AI service abstraction: client.ts + providers/ (anthropic, openai, google)
    supabase.ts  # Supabase client singleton
  services/      # Stateless business logic (framework-agnostic)
  hooks/         # Shared React hooks
  store/         # Zustand store definitions
  types/         # Global TypeScript interfaces and enums
  utils/         # Pure utility functions
```

---

## Plugin Workflow Architecture

This is the most critical architectural rule of the project.

**Every creative capability is a workflow plugin.** All plugins implement this interface:

```ts
interface WorkflowPlugin {
  id: string
  name: string
  detect: (intent: Intent) => boolean
  execute: (context: WorkflowContext) => Promise<WorkflowResult>
  validate: (result: WorkflowResult) => boolean
}
```

**Execution pipeline:**

```
User Message
  → Chat Layer
    → IntentDetector        (src/ai/intent/)
      → WorkflowRouter      (src/ai/router/)
        → PluginRegistry    (src/workflows/registry.ts)
          → WorkflowPlugin  (src/workflows/<capability>/)
            → OutputValidator
              → ConversationMemory
                → Response to Chat
```

**Hard rules:**
- The chat layer calls ONLY `WorkflowRouter.route(intent)` — never a plugin directly.
- WorkflowRouter resolves plugin via PluginRegistry — never by name-switching or conditionals.
- Adding a new capability = create `src/workflows/<capability>/`, implement `WorkflowPlugin`, register in `src/workflows/registry.ts`.
- Never modify existing plugins to add new features (Open/Closed Principle).
- Plugins self-register — WorkflowRouter NEVER imports plugins directly; discovery belongs to PluginRegistry alone.
- Adding a new workflow requires zero router modifications.

**Plugin lifecycle (forward-compatible):** The core interface is intentionally minimal and stable. Future plugins may support additional lifecycle methods (`prepare`, `refine`, `export`) without changing the `WorkflowPlugin` contract or the router.

---

## Conversation Engine

The Conversation Engine is the stateful core of the chat layer. It owns:

- Message history and streaming state
- Active workflow and output context
- Selected assets and refinement references
- Future: persistent memory and multi-turn context

**Workflows are stateless.** Context flows in via `WorkflowContext`; plugins return results without side effects.

---

## AI Architecture

- Prompt templates live in `src/ai/prompts/` as versioned `.ts` files — never inline strings.
- Prompt templates accept typed parameter objects — no string concatenation.
- Use structured outputs (tool use / JSON mode) wherever the response must be parsed.
- Intent detection is isolated in `src/ai/intent/` — it has no knowledge of plugins.
- Response parsing is centralized in `src/ai/parsers/` — no ad-hoc parsing in routes or plugins.
- Stream all user-facing AI responses via Vercel AI SDK `streamText`.
- Business logic and plugins import only from `src/lib/ai/client.ts` — never provider SDK types directly.
- Default provider: Anthropic (`claude-sonnet-4-6`); escalate to `claude-opus-4-8` for complex reasoning. Switching providers requires only changes in `src/lib/ai/providers/`.

---

## Component Guidelines

- Shared components: `src/components/` — zero business logic, purely presentational or interaction.
- Feature-scoped components: `src/features/<domain>/components/`.
- Use shadcn/ui as the foundation — extend via wrapper components, never fork source files.
- Prefer composition. No prop drilling beyond 2 levels; use context or zustand instead.
- Single responsibility: split when a component handles multiple concerns, not because of line count.

---

## State Management

- Zustand: UI state only — theme, sidebar open, modal visibility, loading flags.
- React Context: conversation state — message history, active workflow, session metadata.
- Supabase / server: all persistent data — never replicate DB state into client stores.
- Never store credentials, tokens, or PII in client-side state.

---

## API Routes

- All routes under `src/app/api/`.
- Validate every request body with a Zod schema at the route entry point.
- Consistent response envelope: `{ data: T | null, error: string | null, meta?: Record<string, unknown> }`.
- Supabase client: import only from `src/lib/supabase.ts`.
- AI client: import only from `src/lib/ai/client.ts` — never provider SDKs directly.

---

## Database

- Schema files in `src/db/schema/` — one file per logical domain (users, conversations, assets, workflows).
- All migrations tracked in `src/db/migrations/` — never edit schema and skip migration.
- All database access goes through query helpers in `src/db/queries/` — no inline SQL in routes or services.
- RLS policies enforced in Supabase for every table.

---

## Error Handling

- No silent failures. Every `catch` block must log the error and surface a message to the user or caller.
- AI failures: return a graceful fallback message and retry up to 2 times with exponential backoff.
- User-facing errors: friendly, actionable copy. Developer errors: structured log with context.
- Define error types centrally in `src/types/errors.ts`.

---

## Code Standards

- TypeScript strict mode: `"strict": true` in `tsconfig.json`. No exceptions.
- No `any`. Use `unknown` with type guards.
- Named exports everywhere. Default exports only for Next.js page/layout files.
- File names: `kebab-case`. Component names: `PascalCase`. Functions/variables: `camelCase`.
- Comments only when the WHY is non-obvious. No what-comments. No commented-out code.
- Delete dead code. No `_unused` variables. No re-exported types for removed features.
- Keep functions small and pure. If a function does two things, split it.

---

## Documentation

- Every workflow plugin includes a `README.md` in its folder.
- Major architectural decisions are documented in `docs/architecture/`.
- Prompt strategies and versioning rationale are documented alongside `src/ai/prompts/`.
- Stale documentation is deleted or updated — never left to rot.

---

## Security

- All secrets in `.env.local` (gitignored). Never hardcode keys or tokens.
- API keys are server-side only — never imported in client components.
- Sanitize all user input before injecting into AI prompts (prevent prompt injection).
- Auth enforced via Supabase middleware on all protected routes.
- Supabase RLS is the last line of defense — always configure it, even in development.

---

## Development Workflow

Every non-trivial implementation follows this sequence:

**Understand → Design → Architecture Validation → Interface Design → Implementation → Testing → Documentation → Review → Refactor**

Think before implementing. Design the interface before writing the body. Validate architecture fit before writing code. Always confirm understanding before starting implementation.

---

## Development Phases

| Phase | Focus |
|---|---|
| 1 | Project setup, chat UI shell, design system, app layout |
| 2 | Conversation engine, intent detection, workflow routing, AI integration |
| 3 | Creative workflows: image gen, image editing, poster, story generation |
| 4 | Conversation refinement, version history, asset management, memory |
| 5 | Business features, personalization, export, optimization, deployment |

---

## Definition of Done

A feature is shippable only when it is:

1. **Functional** — works end-to-end including error and edge cases
2. **Typed** — no `any`, all interfaces defined in `src/types/`
3. **Tested** — Vitest unit tests for services/utils; Playwright e2e for critical user paths
4. **Documented** — workflow plugins include a `README.md` in their folder
5. **Architecturally clean** — follows folder structure, plugin boundaries, and state rules above
6. **Additive** — integrates via plugin registry without modifying existing plugins or routes
