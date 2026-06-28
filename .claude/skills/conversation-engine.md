# Conversation Engine

## Purpose
Define what the Conversation Engine owns, what it does not own, and how it coordinates the stateful chat experience across workflow executions and refinement cycles.

---

## What the Conversation Engine Is

The Conversation Engine is the **stateful core of the chat layer**. It persists and manages everything that spans multiple messages and workflow executions within a session.

Location: `src/features/chat/` (engine logic) + `src/store/conversation.ts` (Zustand for streaming UI) + React Context (session state accessible to child components)

---

## State Inventory

The Conversation Engine owns:

| State | Type | Description |
|---|---|---|
| `messages` | `Message[]` | Full conversation history — user and assistant turns |
| `streamingState` | `'idle' \| 'pending' \| 'streaming' \| 'complete' \| 'error'` | Current streaming lifecycle |
| `activeWorkflow` | `WorkflowPlugin \| null` | The plugin that produced the most recent output |
| `activeOutput` | `WorkflowResult \| null` | The most recent workflow result, available for refinement |
| `selectedAssets` | `Asset[]` | Files or images the user has attached or referenced |
| `sessionId` | `string` | Current session identifier for DB persistence |

Future additions (Phase 4):
- `memory`: persistent facts about the user's creative preferences
- `context`: summarized conversation for long-session continuity

---

## What the Engine Does NOT Own

- AI provider credentials or model configuration
- Plugin logic or workflow execution
- UI rendering details (belongs in React components)
- Persistent database writes (belongs in `src/services/conversation.ts`)

---

## WorkflowContext Construction

When the engine hands off to the WorkflowRouter, it constructs `WorkflowContext` from its current state:

```ts
function buildContext(intent: Intent): WorkflowContext {
  return {
    intent,
    conversationHistory: state.messages,
    activeOutput: state.activeOutput ?? undefined,
    selectedAssets: state.selectedAssets,
    userPreferences: session.preferences,
  }
}
```

The WorkflowContext is a **point-in-time snapshot** of the engine's state — plugins read it, never mutate it.

---

## Stateless Plugin Contract

Plugins are stateless. They receive `WorkflowContext`, return `WorkflowResult`, and have zero side effects.

The engine is responsible for:
1. Building context before plugin execution
2. Updating `activeOutput` with the result after execution
3. Appending the assistant message to `messages`
4. Persisting the conversation to the DB via service layer

Plugins are responsible for nothing except: receive context → produce result.

---

## Streaming State Lifecycle

```
idle
  → pending     (user submits message, intent detection starts)
    → streaming (WorkflowRouter returns, AI response begins streaming)
      → complete (stream closed, result committed to state)
      → error    (stream failed — engine enters error recovery)
```

Streaming state drives UI indicators. Never let streaming state persist in `error` silently — always surface a message.

---

## Refinement Semantics

When the user sends a refinement message ("make it warmer", "shorter", "more playful"):

1. Intent detection produces a `refinement` intent type with the original output as context
2. The active plugin's `refine()` method is called if available; otherwise `execute()` is called with `activeOutput` in context
3. The engine replaces `activeOutput` with the new result
4. The previous output is preserved in `messages` history

**Never discard conversation context to generate a new output.** Refinement is a first-class operation.

---

## Future Memory Integration (Phase 4)

Memory will plug in between intent detection and context construction:

```
Intent
  → MemoryRetrieval (fetch relevant user preferences and history)
    → WorkflowContext (enriched with memory facts)
      → WorkflowRouter
```

The engine architecture is designed to accept this addition without restructuring. Do not pre-implement memory — design context construction to be extensible.

---

## Common Mistakes

- **Plugin writing back to conversation state** — plugins return results; the engine appends them
- **Storing `WorkflowResult` payload in Zustand** — Zustand holds streaming/UI state, not creative output
- **Forgetting to pass `activeOutput` in context** — refinements break silently without it
- **Resetting `activeOutput` on every message** — only reset on a new non-refinement generation
- **Conflating streaming state with conversation state** — streaming is transient UI state; messages are persistent

**See also:** `plugin-system.md`, `frontend.md`, `product-philosophy.md`
