import { describe, it, expect } from 'vitest'
import { intentSchema } from '@/types/intent'
import type { Intent, IntentType } from '@/types/intent'

// Verify the schema accepts valid payloads and rejects invalid ones.

describe('intentSchema — valid payloads', () => {
  it('accepts a valid image-generation intent', () => {
    const result = intentSchema.safeParse({
      type: 'image-generation',
      description: 'a sunset over mountains',
      style: 'photorealistic',
      confidence: 0.95,
    })
    expect(result.success).toBe(true)
  })

  it('accepts image-generation without optional fields', () => {
    const result = intentSchema.safeParse({
      type: 'image-generation',
      description: 'a cat',
      confidence: 0.9,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid image-editing intent', () => {
    const result = intentSchema.safeParse({
      type: 'image-editing',
      description: 'remove the background',
      editType: 'background-removal',
      confidence: 0.88,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid poster-creation intent', () => {
    const result = intentSchema.safeParse({
      type: 'poster-creation',
      description: 'jazz night concert poster',
      headline: 'Jazz Night',
      style: 'retro',
      confidence: 0.92,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid story-generation intent', () => {
    const result = intentSchema.safeParse({
      type: 'story-generation',
      description: 'a short horror story about a lighthouse',
      genre: 'horror',
      length: 'short',
      confidence: 0.9,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid refinement intent', () => {
    const result = intentSchema.safeParse({
      type: 'refinement',
      description: 'make the image darker',
      direction: 'darker, more contrast',
      confidence: 0.91,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid conversation intent', () => {
    const result = intentSchema.safeParse({
      type: 'conversation',
      description: 'user is asking what Vizzy can do',
      confidence: 0.97,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid unknown intent', () => {
    const result = intentSchema.safeParse({
      type: 'unknown',
      description: 'could not determine intent',
      confidence: 0.3,
    })
    expect(result.success).toBe(true)
  })
})

describe('intentSchema — invalid payloads', () => {
  it('rejects an unrecognised type', () => {
    const result = intentSchema.safeParse({
      type: 'video-generation',
      description: 'a video of a sunset',
      confidence: 0.9,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing description', () => {
    const result = intentSchema.safeParse({
      type: 'image-generation',
      confidence: 0.9,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty description', () => {
    const result = intentSchema.safeParse({
      type: 'image-generation',
      description: '',
      confidence: 0.9,
    })
    expect(result.success).toBe(false)
  })

  it('rejects confidence above 1', () => {
    const result = intentSchema.safeParse({
      type: 'conversation',
      description: 'hello',
      confidence: 1.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects confidence below 0', () => {
    const result = intentSchema.safeParse({
      type: 'conversation',
      description: 'hello',
      confidence: -0.1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid editType on image-editing', () => {
    const result = intentSchema.safeParse({
      type: 'image-editing',
      description: 'fix it',
      editType: 'magic-wand',
      confidence: 0.8,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid length on story-generation', () => {
    const result = intentSchema.safeParse({
      type: 'story-generation',
      description: 'a story',
      length: 'epic',
      confidence: 0.85,
    })
    expect(result.success).toBe(false)
  })

  it('rejects refinement missing the direction field', () => {
    const result = intentSchema.safeParse({
      type: 'refinement',
      description: 'change something',
      confidence: 0.8,
    })
    expect(result.success).toBe(false)
  })
})

describe('Intent TypeScript type', () => {
  it('parsed output is assignable to Intent', () => {
    const raw = intentSchema.parse({
      type: 'image-generation',
      description: 'a cat',
      confidence: 0.9,
    })
    const intent: Intent = raw
    expect(intent.type).toBe('image-generation')
  })

  it('IntentType union covers all seven values', () => {
    const types: IntentType[] = [
      'image-generation',
      'image-editing',
      'poster-creation',
      'story-generation',
      'refinement',
      'conversation',
      'unknown',
    ]
    expect(types).toHaveLength(7)
  })
})
