import { describe, it, expect } from 'vitest'
import { detect } from '@/workflows/conversation/detect'
import { execute } from '@/workflows/conversation/execute'
import { validate } from '@/workflows/conversation/validate'
import type { Intent, WorkflowContext, WorkflowResult } from '@/types'

// Import index to trigger self-registration (needed for the end-to-end test).
import '@/workflows/conversation/index'
import { route } from '@/ai/router'
import { getRegisteredPluginIds } from '@/workflows/registry'

function makeConversationIntent(description = 'What can Vizzy do?'): Extract<
  Intent,
  { type: 'conversation' }
> {
  return { type: 'conversation', description, confidence: 0.96 }
}

function makeContext(intent: Intent): WorkflowContext {
  return { intent, conversationHistory: [] }
}

// ---------------------------------------------------------------------------
// detect()
// ---------------------------------------------------------------------------

describe('conversationPlugin.detect', () => {
  it('returns true for a conversation intent', () => {
    expect(detect(makeConversationIntent())).toBe(true)
  })

  it('returns false for image-generation', () => {
    const intent: Extract<Intent, { type: 'image-generation' }> = {
      type: 'image-generation',
      description: 'a sunset',
      confidence: 0.9,
    }
    expect(detect(intent)).toBe(false)
  })

  it('returns false for story-generation', () => {
    const intent: Extract<Intent, { type: 'story-generation' }> = {
      type: 'story-generation',
      description: 'a short tale',
      confidence: 0.88,
    }
    expect(detect(intent)).toBe(false)
  })

  it('returns false for refinement', () => {
    const intent: Extract<Intent, { type: 'refinement' }> = {
      type: 'refinement',
      description: 'make it darker',
      direction: 'darker, more contrast',
      confidence: 0.91,
    }
    expect(detect(intent)).toBe(false)
  })

  it('returns false for unknown', () => {
    const intent: Extract<Intent, { type: 'unknown' }> = {
      type: 'unknown',
      description: 'unclear',
      confidence: 0.3,
    }
    expect(detect(intent)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// execute()
// ---------------------------------------------------------------------------

describe('conversationPlugin.execute', () => {
  it('returns a WorkflowResult with status success', async () => {
    const intent = makeConversationIntent()
    const result = await execute(makeContext(intent))
    expect(result.status).toBe('success')
  })

  it('returns type "conversation"', async () => {
    const result = await execute(makeContext(makeConversationIntent()))
    expect(result.type).toBe('conversation')
  })

  it('payload message echoes the intent description', async () => {
    const intent = makeConversationIntent('How do I export my image?')
    const result = await execute(makeContext(intent))
    expect((result.payload as { message: string }).message).toBe(
      'How do I export my image?',
    )
  })

  it('metadata pluginId is "conversation"', async () => {
    const result = await execute(makeContext(makeConversationIntent()))
    expect(result.metadata.pluginId).toBe('conversation')
  })

  it('metadata executedAt is a non-empty string', async () => {
    const result = await execute(makeContext(makeConversationIntent()))
    expect(typeof result.metadata.executedAt).toBe('string')
    expect(result.metadata.executedAt.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// validate()
// ---------------------------------------------------------------------------

describe('conversationPlugin.validate', () => {
  function makeValidResult(message = 'hello'): WorkflowResult {
    return {
      type: 'conversation',
      status: 'success',
      payload: { message },
      metadata: { pluginId: 'conversation', executedAt: new Date().toISOString() },
    }
  }

  it('accepts a well-formed conversation result', () => {
    expect(validate(makeValidResult())).toBe(true)
  })

  it('rejects a result with status error', () => {
    expect(validate({ ...makeValidResult(), status: 'error' })).toBe(false)
  })

  it('rejects a result with wrong type', () => {
    expect(validate({ ...makeValidResult(), type: 'image-generation' })).toBe(false)
  })

  it('rejects a result with an empty message', () => {
    expect(validate(makeValidResult(''))).toBe(false)
  })

  it('rejects a result whose payload is not an object', () => {
    expect(validate({ ...makeValidResult(), payload: 'just a string' })).toBe(false)
  })

  it('rejects a result whose payload has no message field', () => {
    expect(validate({ ...makeValidResult(), payload: { other: 'data' } })).toBe(false)
  })

  it('rejects a result whose payload message is not a string', () => {
    expect(validate({ ...makeValidResult(), payload: { message: 42 } })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Self-registration
// ---------------------------------------------------------------------------

describe('conversationPlugin registration', () => {
  it('registers itself in the plugin registry on import', () => {
    expect(getRegisteredPluginIds()).toContain('conversation')
  })
})

// ---------------------------------------------------------------------------
// End-to-end routing proof
// ---------------------------------------------------------------------------

describe('end-to-end routing through conversation plugin', () => {
  it('routes a conversation intent to the conversation plugin and returns success', async () => {
    const intent = makeConversationIntent('Tell me about yourself')
    const context = makeContext(intent)

    const result = await route(intent, context)

    expect(result.type).toBe('conversation')
    expect(result.status).toBe('success')
    expect(result.metadata.pluginId).toBe('conversation')
    expect((result.payload as { message: string }).message).toBe('Tell me about yourself')
  })

  it('returns a fallback result for an unhandled intent type', async () => {
    const intent: Extract<Intent, { type: 'image-generation' }> = {
      type: 'image-generation',
      description: 'a sunset',
      confidence: 0.9,
    }
    const context = makeContext(intent)

    const result = await route(intent, context)

    expect(result.type).toBe('fallback')
    expect(result.status).toBe('error')
  })
})
