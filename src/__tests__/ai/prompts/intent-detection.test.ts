import { describe, it, expect } from 'vitest'
import { buildIntentDetectionPrompt } from '@/ai/prompts/intent-detection.v1'

describe('buildIntentDetectionPrompt', () => {
  it('returns a system string and messages array', () => {
    const result = buildIntentDetectionPrompt({
      message: 'make a sunset image',
      recentHistory: [],
    })
    expect(typeof result.system).toBe('string')
    expect(result.system.length).toBeGreaterThan(0)
    expect(Array.isArray(result.messages)).toBe(true)
  })

  it('appends the current message as the final user turn', () => {
    const result = buildIntentDetectionPrompt({
      message: 'make a sunset image',
      recentHistory: [],
    })
    const last = result.messages.at(-1)
    expect(last?.role).toBe('user')
    expect(last?.content).toBe('make a sunset image')
  })

  it('includes recent history before the current message', () => {
    const history = [
      { role: 'user' as const, content: 'hello' },
      { role: 'assistant' as const, content: 'Hi! I am Vizzy.' },
    ]
    const result = buildIntentDetectionPrompt({
      message: 'now generate an image',
      recentHistory: history,
    })
    expect(result.messages).toHaveLength(3)
    expect(result.messages[0]?.content).toBe('hello')
    expect(result.messages[1]?.content).toBe('Hi! I am Vizzy.')
    expect(result.messages[2]?.content).toBe('now generate an image')
  })

  it('produces a stable system prompt — snapshot', () => {
    const result = buildIntentDetectionPrompt({
      message: 'draw a dragon',
      recentHistory: [],
    })
    expect(result.system).toMatchSnapshot()
  })

  it('produces stable messages output — snapshot', () => {
    const result = buildIntentDetectionPrompt({
      message: 'create a poster',
      recentHistory: [{ role: 'user', content: 'hello' }],
    })
    expect(result.messages).toMatchSnapshot()
  })

  it('includes all intent types in the system prompt', () => {
    const result = buildIntentDetectionPrompt({ message: 'x', recentHistory: [] })
    expect(result.system).toContain('image-generation')
    expect(result.system).toContain('image-editing')
    expect(result.system).toContain('poster-creation')
    expect(result.system).toContain('story-generation')
    expect(result.system).toContain('refinement')
    expect(result.system).toContain('conversation')
    expect(result.system).toContain('unknown')
  })
})
