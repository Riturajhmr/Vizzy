import { describe, it, expect } from 'vitest'
import { MODELS, DEFAULT_PROVIDER } from '@/lib/ai/config'

describe('MODELS', () => {
  it('defines DEFAULT as claude-sonnet-4-6', () => {
    expect(MODELS.DEFAULT).toBe('claude-sonnet-4-6')
  })

  it('defines REASONING as claude-opus-4-8', () => {
    expect(MODELS.REASONING).toBe('claude-opus-4-8')
  })

  it('DEFAULT and REASONING are different models', () => {
    expect(MODELS.DEFAULT).not.toBe(MODELS.REASONING)
  })
})

describe('DEFAULT_PROVIDER', () => {
  it('is anthropic', () => {
    expect(DEFAULT_PROVIDER).toBe('anthropic')
  })
})
