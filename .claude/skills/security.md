# Security

## Purpose
Define security patterns for Vizzy Chat — secrets management, authentication enforcement, Supabase RLS, prompt injection prevention, and input validation. Security is not an afterthought; these rules apply from day one.

---

## Secrets Management

**Rule: All secrets live in `.env.local`, which is gitignored. Never in `.env` (which may be committed).**

```
.env.local          # Real secrets — NEVER committed
.env.example        # Template with dummy values — committed
```

Validate secrets at application startup using Zod:

```ts
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
})

export const env = envSchema.parse(process.env)
```

If a required secret is missing, the application fails at startup with a clear error — not at runtime with an obscure crash.

---

## Server-Only Rule

**API keys and secrets must never be imported in client-side code (`'use client'` components, client utilities).**

Enforce this with Next.js `server-only` package:

```ts
// src/lib/env.ts
import 'server-only'  // Throws at build time if imported in client bundle

export const env = { ... }
```

Signs of leakage: secrets appearing in browser network requests, or `NEXT_PUBLIC_` prefix on sensitive variables.

---

## Authentication

Auth is enforced via Supabase middleware in `middleware.ts`:

```ts
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

**Rule:** Protected routes and API routes must check session. Middleware is the first gate; RLS is the last.

---

## Supabase RLS

RLS is the last line of defense. It prevents data access even if middleware has a bug.

**Configure RLS on every table before writing application code that uses it.**

Standard policies:
```sql
-- Users own their data
CREATE POLICY "user_isolation" ON conversations
  USING (user_id = auth.uid());

-- Service role bypasses RLS for admin operations
-- Use SUPABASE_SERVICE_ROLE_KEY only in server-side trusted contexts
```

Never disable RLS to "fix" a query bug — fix the query or the policy instead.

---

## Prompt Injection Prevention

User input must be sanitized before it is included in any AI prompt.

```ts
// src/utils/sanitize.ts
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '')  // Remove control characters
    .trim()
    .slice(0, 4000)                     // Hard truncation
}
```

Rules:
- Sanitize at the API route entry point, not inside prompt builders
- User text only enters the `user` role message — never the `system` prompt
- Structured parameters (style, format) come from Zod-validated enums, not raw user input

---

## Input Validation

Validate all external input at system boundaries:

| Boundary | Validation |
|---|---|
| API route body | Zod schema (see `api-design.md`) |
| Query parameters | Zod schema |
| Form actions | Zod schema |
| Webhooks | Signature verification + Zod schema |
| File uploads | MIME type + size limits |

Never trust data that crosses a system boundary without explicit validation.

---

## Error Exposure

Never leak internal details to the client:

```ts
// Wrong — exposes stack trace and internal message
return Response.json({ error: error.message, stack: error.stack }, { status: 500 })

// Correct — friendly message to client, full details to server logs
console.error('[api/chat] Error:', { error, userId, sessionId })
return Response.json({ data: null, error: 'Something went wrong. Please try again.' }, { status: 500 })
```

---

## Common Mistakes

- Putting real API keys in `.env` instead of `.env.local`
- Using `NEXT_PUBLIC_` prefix on sensitive variables (makes them client-accessible)
- Missing RLS on a new table — "I'll add it later" becomes a security gap
- User's raw message text injected directly into the system prompt
- Skipping Zod validation because "the frontend already validates"
- Returning `error.message` to the client (leaks implementation details)

**See also:** `api-design.md`, `database.md`, `prompt-engineering.md`
