import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the registry so the router is tested without any real plugin state.
vi.mock('@/workflows/registry', () => ({
  resolve: vi.fn(),
}))

import { resolve } from '@/workflows/registry'
import { route } from '@/ai/router'
import type { Intent, WorkflowContext, WorkflowResult, WorkflowPlugin } from '@/types'

const mockResolve = vi.mocked(resolve)

function makeConversationIntent(): Extract<Intent, { type: 'conversation' }> {
  return { type: 'conversation', description: 'What can Vizzy do?', confidence: 0.95 }
}

function makeContext(intent: Intent): WorkflowContext {
  return { intent, conversationHistory: [] }
}

function makeSuccessResult(pluginId = 'test-plugin'): WorkflowResult {
  return {
    type: 'conversation',
    status: 'success',
    payload: { message: 'ok' },
    metadata: { pluginId, executedAt: new Date().toISOString() },
  }
}

function makePlugin(
  overrides: Partial<WorkflowPlugin> = {},
): WorkflowPlugin {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    detect: () => true,
    execute: vi.fn().mockResolvedValue(makeSuccessResult()),
    validate: vi.fn().mockReturnValue(true),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// No matching plugin
// ---------------------------------------------------------------------------

describe('route — no matching plugin', () => {
  it('returns a fallback result when resolve returns null', async () => {
    mockResolve.mockReturnValue(null)
    const intent = makeConversationIntent()

    const result = await route(intent, makeContext(intent))

    expect(result.type).toBe('fallback')
    expect(result.status).toBe('error')
  })

  it('fallback payload message includes the intent type', async () => {
    mockResolve.mockReturnValue(null)
    const intent = makeConversationIntent()

    const result = await route(intent, makeContext(intent))

    const message = (result.payload as { message: string }).message
    expect(message).toContain('conversation')
  })

  it('fallback metadata pluginId is "system"', async () => {
    mockResolve.mockReturnValue(null)
    const intent = makeConversationIntent()

    const result = await route(intent, makeContext(intent))

    expect(result.metadata.pluginId).toBe('system')
  })
})

// ---------------------------------------------------------------------------
// Plugin found — happy path
// ---------------------------------------------------------------------------

describe('route — plugin found and result is valid', () => {
  it('calls plugin.execute with the provided context', async () => {
    const plugin = makePlugin()
    mockResolve.mockReturnValue(plugin)
    const intent = makeConversationIntent()
    const context = makeContext(intent)

    await route(intent, context)

    expect(plugin.execute).toHaveBeenCalledOnce()
    expect(plugin.execute).toHaveBeenCalledWith(context)
  })

  it('calls plugin.validate with the execute result', async () => {
    const expectedResult = makeSuccessResult()
    const plugin = makePlugin({
      execute: vi.fn().mockResolvedValue(expectedResult),
      validate: vi.fn().mockReturnValue(true),
    })
    mockResolve.mockReturnValue(plugin)
    const intent = makeConversationIntent()

    await route(intent, makeContext(intent))

    expect(plugin.validate).toHaveBeenCalledOnce()
    expect(plugin.validate).toHaveBeenCalledWith(expectedResult)
  })

  it('returns the plugin result when validate returns true', async () => {
    const expected = makeSuccessResult('my-plugin')
    const plugin = makePlugin({
      execute: vi.fn().mockResolvedValue(expected),
      validate: vi.fn().mockReturnValue(true),
    })
    mockResolve.mockReturnValue(plugin)
    const intent = makeConversationIntent()

    const result = await route(intent, makeContext(intent))

    expect(result).toEqual(expected)
  })
})

// ---------------------------------------------------------------------------
// Plugin found — invalid result
// ---------------------------------------------------------------------------

describe('route — plugin validate returns false', () => {
  it('returns a fallback result when validate returns false', async () => {
    const plugin = makePlugin({ validate: vi.fn().mockReturnValue(false) })
    mockResolve.mockReturnValue(plugin)
    const intent = makeConversationIntent()

    const result = await route(intent, makeContext(intent))

    expect(result.type).toBe('fallback')
    expect(result.status).toBe('error')
  })
})

// ---------------------------------------------------------------------------
// Plugin execute throws
// ---------------------------------------------------------------------------

describe('route — plugin execute throws', () => {
  it('returns a fallback result when execute throws', async () => {
    const plugin = makePlugin({
      execute: vi.fn().mockRejectedValue(new Error('AI provider timeout')),
    })
    mockResolve.mockReturnValue(plugin)
    const intent = makeConversationIntent()

    const result = await route(intent, makeContext(intent))

    expect(result.type).toBe('fallback')
    expect(result.status).toBe('error')
  })

  it('does not re-throw when execute throws — caller receives fallback', async () => {
    const plugin = makePlugin({
      execute: vi.fn().mockRejectedValue(new Error('crash')),
    })
    mockResolve.mockReturnValue(plugin)
    const intent = makeConversationIntent()

    await expect(route(intent, makeContext(intent))).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Router independence — never checks intent.type
// ---------------------------------------------------------------------------

describe('route — architectural constraints', () => {
  it('routes any intent type without inspecting its value (open/closed)', async () => {
    const imageIntent: Extract<Intent, { type: 'image-generation' }> = {
      type: 'image-generation',
      description: 'a dragon',
      confidence: 0.92,
    }
    const storyIntent: Extract<Intent, { type: 'story-generation' }> = {
      type: 'story-generation',
      description: 'a mystery tale',
      confidence: 0.88,
    }

    const imageResult = makeSuccessResult('image-plugin')
    const storyResult = makeSuccessResult('story-plugin')

    // Simulate two different plugins being resolved for two different intents
    mockResolve
      .mockReturnValueOnce(
        makePlugin({ id: 'image-plugin', execute: vi.fn().mockResolvedValue(imageResult) }),
      )
      .mockReturnValueOnce(
        makePlugin({ id: 'story-plugin', execute: vi.fn().mockResolvedValue(storyResult) }),
      )

    const r1 = await route(imageIntent, makeContext(imageIntent))
    const r2 = await route(storyIntent, makeContext(storyIntent))

    expect(r1).toEqual(imageResult)
    expect(r2).toEqual(storyResult)
  })
})
