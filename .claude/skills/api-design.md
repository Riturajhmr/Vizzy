# API Design

## Purpose
Define patterns for Next.js App Router API routes — request validation, response structure, streaming, error handling, and retry behavior. Every API route in this project follows these conventions.

---

## Route Placement

All API routes live under `src/app/api/`. Use resource-based naming:

```
src/app/api/
  chat/route.ts              # Main conversation endpoint (streaming)
  workflows/route.ts         # Workflow metadata
  assets/route.ts            # Asset upload and retrieval
  auth/callback/route.ts     # Supabase auth callback
```

File: `route.ts`. Export named HTTP method handlers: `GET`, `POST`, `PATCH`, `DELETE`.

---

## Request Validation

Every handler validates its request body with Zod **before any logic runs**.

```ts
// src/app/api/chat/route.ts
import { z } from 'zod'

const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().uuid(),
  selectedAssets: z.array(z.string().url()).optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { data: null, error: 'Invalid request', meta: { issues: parsed.error.issues } },
      { status: 400 }
    )
  }

  // Proceed with parsed.data — fully typed
}
```

Never use raw `body` after this point. Only `parsed.data`.

---

## Response Envelope

All non-streaming responses use this envelope:

```ts
type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: Record<string, unknown>
}
```

Success: `{ data: result, error: null }`
Error: `{ data: null, error: 'Human-readable message' }`
With metadata: `{ data: result, error: null, meta: { count: 42, cursor: '...' } }`

Never return raw objects. Always wrap.

---

## Streaming Routes

The main `/api/chat` route returns a streaming response using Vercel AI SDK:

```ts
import { streamText } from 'ai'
import { aiClient } from '@/lib/ai/client'

export async function POST(request: Request) {
  // ... validate request ...

  const result = streamText({
    model: aiClient.model(),
    messages: context.messages,
    system: systemPrompt,
  })

  return result.toDataStreamResponse()
}
```

Use `toDataStreamResponse()` for compatibility with Vercel AI SDK's `useChat` on the client.

---

## Client Imports in Routes

| Client | Import from |
|---|---|
| Supabase | `@/lib/supabase` |
| AI client | `@/lib/ai/client` |
| DB queries | `@/db/queries/<domain>` |

Never import provider SDKs (`@anthropic-ai/sdk`, `openai`) in route files.

---

## Error Handling

Every route wraps its logic in a try/catch:

```ts
try {
  // logic
} catch (error) {
  console.error('[api/chat] Unexpected error:', { error, sessionId })
  return Response.json(
    { data: null, error: 'Something went wrong. Please try again.' },
    { status: 500 }
  )
}
```

Rules:
- Log with a route identifier prefix: `[api/chat]`
- Log enough context to debug: session ID, user ID if available, operation
- Return friendly error copy — never stack traces or internal messages to the client
- Use appropriate HTTP status codes (see table below)

---

## HTTP Status Codes

| Code | Use case |
|---|---|
| 200 | Successful GET or non-creation POST |
| 201 | Resource created |
| 400 | Invalid request body (Zod validation failure) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 500 | Unexpected server error |

---

## AI Call Retry Strategy

AI calls in service layer (not routes) retry on transient failures:

```ts
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts || !isTransientError(error)) throw error
      await wait(attempt * 500) // 500ms, 1000ms
    }
  }
  throw new Error('Max retries exceeded')
}
```

Retry only on transient errors (network timeout, rate limit 429). Do not retry on 400/401/403.

---

## Common Mistakes

- No Zod validation — trusting `request.json()` directly
- Returning raw objects instead of the response envelope
- Catching errors silently — no log, no client error message
- Importing `@anthropic-ai/sdk` directly in a route file
- Using `200` for all responses regardless of what happened
- Retrying non-transient errors (4xx)

**See also:** `security.md`, `database.md`, `ai-engine.md`
