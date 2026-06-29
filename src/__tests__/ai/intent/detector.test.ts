import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/ai/client', () => ({
  aiClient: { generateObject: vi.fn() },
}))

vi.mock('@/utils/retry', () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}))

import { aiClient } from '@/lib/ai/client'
import { detectIntent } from '@/ai/intent/detector'
import type { Intent } from '@/types/intent'

const mockGenerateObject = vi.mocked(aiClient.generateObject)

beforeEach(() => {
  vi.clearAllMocks()
})

function makeImageIntent(): Intent {
  return {
    type: 'image-generation',
    description: 'a sunset over mountains',
    style: 'photorealistic',
    confidence: 0.95,
  }
}

describe('detectIntent — successful classification', () => {
  it('returns the intent from generateObject', async () => {
    const expected = makeImageIntent()
    mockGenerateObject.mockResolvedValue(expected)

    const result = await detectIntent('make a sunset image', [])

    expect(result).toEqual(expected)
    expect(mockGenerateObject).toHaveBeenCalledOnce()
  })

  it('classifies a story generation request', async () => {
    const expected: Intent = {
      type: 'story-generation',
      description: 'a short horror story about a lighthouse',
      genre: 'horror',
      length: 'short',
      confidence: 0.9,
    }
    mockGenerateObject.mockResolvedValue(expected)

    const result = await detectIntent('write me a short horror story about a lighthouse', [])
    expect(result.type).toBe('story-generation')
    expect(result.confidence).toBe(0.9)
  })

  it('classifies a refinement request', async () => {
    const expected: Intent = {
      type: 'refinement',
      description: 'make the image darker',
      direction: 'darker, higher contrast',
      confidence: 0.91,
    }
    mockGenerateObject.mockResolvedValue(expected)

    const result = await detectIntent('make it darker', [
      { id: '1', role: 'user', content: 'generate a sunset', createdAt: '' },
      { id: '2', role: 'assistant', content: 'Here is your sunset image.', createdAt: '' },
    ])
    expect(result.type).toBe('refinement')
  })

  it('classifies a poster creation request', async () => {
    const expected: Intent = {
      type: 'poster-creation',
      description: 'jazz concert poster',
      headline: 'Jazz Night',
      confidence: 0.92,
    }
    mockGenerateObject.mockResolvedValue(expected)

    const result = await detectIntent('create a poster for a jazz concert', [])
    expect(result.type).toBe('poster-creation')
  })

  it('classifies a general conversation message', async () => {
    const expected: Intent = {
      type: 'conversation',
      description: 'user is asking what Vizzy can do',
      confidence: 0.97,
    }
    mockGenerateObject.mockResolvedValue(expected)

    const result = await detectIntent('what can you do?', [])
    expect(result.type).toBe('conversation')
  })
})

describe('detectIntent — history handling', () => {
  it('passes only user and assistant messages to the prompt builder', async () => {
    mockGenerateObject.mockResolvedValue(makeImageIntent())

    await detectIntent('make it darker', [
      { id: '1', role: 'system', content: 'System initialised', createdAt: '' },
      { id: '2', role: 'user', content: 'generate a sunset', createdAt: '' },
      { id: '3', role: 'assistant', content: 'Done.', createdAt: '' },
    ])

    const call = mockGenerateObject.mock.calls[0]?.[0]
    const messages = (call as { messages: Array<{ role: string }> }).messages
    const roles = messages.map((m) => m.role)
    expect(roles).not.toContain('system')
  })

  it('caps history to the 6 most recent non-system messages', async () => {
    mockGenerateObject.mockResolvedValue(makeImageIntent())

    const longHistory = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `message ${i}`,
      createdAt: '',
    }))

    await detectIntent('one more', longHistory)

    const call = mockGenerateObject.mock.calls[0]?.[0]
    const messages = (call as { messages: Array<{ role: string; content: string }> }).messages
    // 6 history messages + 1 current = 7
    expect(messages.length).toBeLessThanOrEqual(7)
  })
})

describe('detectIntent — input sanitization', () => {
  it('strips HTML tags from the message before classification', async () => {
    mockGenerateObject.mockResolvedValue(makeImageIntent())

    await detectIntent('<script>alert("xss")</script>make an image', [])

    const call = mockGenerateObject.mock.calls[0]?.[0]
    const messages = (call as { messages: Array<{ role: string; content: string }> }).messages
    const lastMessage = messages.at(-1)
    expect(lastMessage?.content).not.toContain('<script>')
    expect(lastMessage?.content).toContain('make an image')
  })
})

describe('detectIntent — error fallback', () => {
  it('returns unknown intent when generateObject throws', async () => {
    mockGenerateObject.mockRejectedValue(new Error('AI provider unavailable'))

    const result = await detectIntent('generate something', [])

    expect(result.type).toBe('unknown')
    expect(result.confidence).toBe(0)
  })

  it('does not throw when AI fails — returns graceful fallback', async () => {
    mockGenerateObject.mockRejectedValue(new Error('timeout'))

    await expect(detectIntent('hello', [])).resolves.not.toThrow()
  })
})
