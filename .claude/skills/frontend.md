# Frontend

## Purpose
Define component architecture, state ownership, and rendering patterns for Vizzy Chat's Next.js 15 frontend. Covers shadcn/ui conventions, Server vs. Client Component decisions, and Zustand/Context usage.

---

## Component Placement

| Location | Use for |
|---|---|
| `src/components/` | Shared UI — used across multiple features; no domain knowledge |
| `src/features/<domain>/components/` | Feature-scoped — belongs to one feature and knows its types |

Never put business logic in either. Components render state; services and hooks contain logic.

---

## shadcn/ui Policy

shadcn/ui components are **installed into `src/components/ui/`** and treated as owned source code.

- **Never edit** `src/components/ui/` files directly — they will be regenerated on updates
- **Extend** by creating wrapper components in `src/components/` that compose shadcn primitives
- **Never fork** shadcn components to add one-off behavior — compose instead

```tsx
// Correct — wrapper extends without forking
// src/components/creative-button.tsx
import { Button } from '@/components/ui/button'

export function CreativeButton({ children, ...props }) {
  return <Button variant="creative" className="rounded-full" {...props}>{children}</Button>
}
```

---

## Server vs. Client Components

Default: **Server Component**. Opt into Client only when necessary.

| Needs | Use |
|---|---|
| Data fetching, DB queries, auth check | Server Component |
| Browser APIs (localStorage, window, navigator) | Client Component (`'use client'`) |
| Event handlers, interactivity, useState/useEffect | Client Component |
| AI streaming with `useChat` | Client Component |
| Static layout, display-only | Server Component |

Never add `'use client'` to a component that doesn't need it — it removes RSC benefits for the entire subtree.

---

## Chat UI and Streaming

The main chat interface is a Client Component that uses Vercel AI SDK's `useChat` hook:

```tsx
'use client'
import { useChat } from 'ai/react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  })
  // render messages + input form
}
```

`useChat` handles streaming, message history, and loading state. Do not re-implement these manually.

---

## State Ownership

| State type | Tool | Location |
|---|---|---|
| UI flags (sidebar, modals, theme) | Zustand | `src/store/ui.ts` |
| Conversation state (messages, active workflow, streaming) | React Context | `src/features/chat/context/` |
| Persistent user data | Supabase (server) | `src/db/queries/` |
| Form state | React state (`useState`) | Local to form component |

**Never** put DB data in Zustand. **Never** use Zustand for conversation state — conversation state must be accessible via context to the full chat subtree.

---

## Composition Rules

- No prop drilling beyond 2 levels — use Context or Zustand instead
- Prefer composition with `children` over growing a prop list
- Build small, focused components that do one thing
- Split when a component handles multiple responsibilities — not because of line count

```tsx
// Bad — prop drilling through 3 levels
<ChatLayout userId={id} userName={name} userAvatar={avatar} theme={theme} />

// Good — context provides user; component reads what it needs
<ChatLayout />  // reads UserContext internally
```

---

## Common Mistakes

- Business logic in JSX or component files — move to hooks or services
- Forking shadcn/ui components instead of composing wrappers
- Marking a component `'use client'` when it doesn't need interactivity
- Using Zustand to store fetched DB data — it becomes stale and out of sync
- Prop drilling past 2 levels — add a context or Zustand slice
- Implementing manual streaming when `useChat` handles it

**See also:** `conversation-engine.md`, `api-design.md`, `state-management` (in this file)
