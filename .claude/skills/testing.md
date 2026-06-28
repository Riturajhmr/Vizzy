# Testing

## Purpose
Define the testing strategy for Vizzy Chat — what to test, how to test it, and how to handle the unique challenges of testing AI-powered workflows. Tests verify correctness of business logic; end-to-end tests verify product behavior.

---

## Testing Stack

| Tool | Use |
|---|---|
| Vitest | Unit tests — services, utils, plugins, parsers, prompt builders |
| Playwright | E2E tests — full user flows in a real browser |

No other testing libraries unless there is a specific gap these cannot fill.

---

## What to Unit Test

High priority:
- Workflow plugins: `detect()`, `execute()` with mocked AI client, `validate()`
- Services in `src/services/`
- Pure utilities in `src/utils/`
- AI parsers in `src/ai/parsers/`
- Prompt builders in `src/ai/prompts/` (snapshot tests)
- Intent detection output parsing

Lower priority:
- React components (only for complex interaction logic, not rendering)
- API route handlers (prefer integration testing via Playwright)

Never unit test: shadcn/ui internals, Drizzle internals, Next.js routing, Supabase client.

---

## Unit Test Structure

Colocate test files with source:

```
src/workflows/image-generation/
  execute.ts
  detect.ts
  __tests__/
    detect.test.ts
    execute.test.ts
    validate.test.ts
```

Or use `.test.ts` suffix alongside the source file for small utilities.

---

## Testing Workflow Plugins

Plugins are stateless — they are the easiest thing to unit test in this codebase.

```ts
// src/workflows/image-generation/__tests__/execute.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { execute } from '../execute'

vi.mock('@/lib/ai/client', () => ({
  aiClient: {
    generateImage: vi.fn().mockResolvedValue({ url: 'https://example.com/image.jpg', model: 'mock' })
  }
}))

describe('image-generation execute', () => {
  it('returns image result for valid context', async () => {
    const context = buildMockContext({ intent: { type: 'image-generation', description: 'a cat' } })
    const result = await execute(context)

    expect(result.status).toBe('success')
    expect(result.type).toBe('image')
    expect(result.payload.url).toBeTruthy()
  })
})
```

Always mock `src/lib/ai/client` in unit tests — never call real AI.

---

## Testing AI Non-Determinism

AI responses are non-deterministic. Strategies:

| Test goal | Approach |
|---|---|
| Plugin logic correctness | Mock AI client — test the logic around the AI call |
| Prompt rendering | Snapshot test the rendered prompt string |
| Intent detection parsing | Test the parser with hardcoded AI response fixtures |
| Output validation | Test `validate()` with known good and bad result shapes |
| Real AI quality | Manual review or scheduled integration test (not in CI by default) |

Never write assertions like "response contains the word 'sunset'" — AI output is not deterministic.

---

## E2E Tests with Playwright

Focus on critical user paths:

1. **Auth flow:** sign up, log in, session persistence
2. **Full conversation:** send a creative message → receive streamed response → see output
3. **Refinement:** send a follow-up → output updates in context
4. **Error recovery:** AI fails → graceful message displayed
5. **Asset upload:** attach image → workflow uses it

E2E tests run against a test Supabase project with seeded data. Never run against production.

```ts
// e2e/chat-flow.spec.ts
test('user can generate an image through conversation', async ({ page }) => {
  await page.goto('/app')
  await page.fill('[data-testid="chat-input"]', 'Create a watercolor painting of a mountain at sunrise')
  await page.keyboard.press('Enter')
  await page.waitForSelector('[data-testid="workflow-output"]', { timeout: 30000 })
  await expect(page.locator('[data-testid="workflow-output"] img')).toBeVisible()
})
```

---

## Prompt Snapshot Tests

Prompt builder functions are deterministic. Use snapshots to catch unintentional changes:

```ts
it('renders image generation prompt correctly', () => {
  const prompt = buildImageGenerationPrompt({
    description: 'a serene lake at dawn',
    style: 'photorealistic',
    aspectRatio: '16:9',
  })
  expect(prompt.system).toMatchSnapshot()
  expect(prompt.user).toMatchSnapshot()
})
```

Update snapshots intentionally with `vitest --update-snapshots` when prompt behavior is meant to change.

---

## What NOT to Test

- Third-party library internals (shadcn/ui, Drizzle, Supabase)
- Next.js routing and middleware behavior
- Implementation details that are likely to change (internal function signatures, private state)
- That the AI returned the right creative content (it's non-deterministic)

---

## Common Mistakes

- Testing implementation details instead of behavior — tests break on refactors
- Mocking business logic itself — you end up testing the mock, not the code
- No e2e coverage for the core conversation flow — the most important path goes untested
- Calling real AI in CI unit tests — slow, expensive, non-deterministic, and unreliable
- Writing test assertions on AI response content

**See also:** `plugin-system.md`, `api-design.md`, `prompt-engineering.md`
