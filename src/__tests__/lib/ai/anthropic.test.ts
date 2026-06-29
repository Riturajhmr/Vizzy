import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('ai', () => ({
  generateText: vi.fn(),
  generateObject: vi.fn(),
  streamText: vi.fn(),
}))

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => (model: string) => ({ _tag: 'AnthropicModel', model })),
}))

vi.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'sk-ant-test-key' },
}))

import { generateText, generateObject, streamText } from 'ai'
import { anthropicProvider } from '@/lib/ai/providers/anthropic'
import { MODELS } from '@/lib/ai/config'
import { z } from 'zod'

const mockGenerateText = vi.mocked(generateText)
const mockGenerateObject = vi.mocked(generateObject)
const mockStreamText = vi.mocked(streamText)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('anthropicProvider.generate', () => {
  it('calls generateText and maps the result', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Hello world',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    } as unknown as Awaited<ReturnType<typeof generateText>>)

    const result = await anthropicProvider.generate({
      system: 'You are helpful',
      messages: [{ role: 'user', content: 'Hi' }],
    })

    expect(mockGenerateText).toHaveBeenCalledOnce()
    expect(result.text).toBe('Hello world')
    expect(result.model).toBe(MODELS.DEFAULT)
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 })
  })

  it('uses the specified model when provided', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Response',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    } as unknown as Awaited<ReturnType<typeof generateText>>)

    const result = await anthropicProvider.generate({
      system: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
      model: MODELS.REASONING,
    })

    expect(result.model).toBe(MODELS.REASONING)
  })

  it('passes temperature and maxTokens when provided', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'ok',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    } as unknown as Awaited<ReturnType<typeof generateText>>)

    await anthropicProvider.generate({
      system: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
      temperature: 0.5,
      maxTokens: 256,
    })

    const call = mockGenerateText.mock.calls[0]?.[0]
    expect(call).toMatchObject({ temperature: 0.5, maxTokens: 256 })
  })

  it('omits temperature and maxTokens when not provided', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'ok',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    } as unknown as Awaited<ReturnType<typeof generateText>>)

    await anthropicProvider.generate({
      system: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
    })

    const call = mockGenerateText.mock.calls[0]?.[0]
    expect(call).not.toHaveProperty('temperature')
    expect(call).not.toHaveProperty('maxTokens')
  })
})

describe('anthropicProvider.generateObject', () => {
  it('calls generateObject and returns the parsed object', async () => {
    const expected = { intent: 'image_generation', confidence: 0.95 }
    mockGenerateObject.mockResolvedValue({
      object: expected,
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const schema = z.object({ intent: z.string(), confidence: z.number() })
    const result = await anthropicProvider.generateObject({
      system: 'sys',
      messages: [{ role: 'user', content: 'make an image' }],
      schema,
    })

    expect(mockGenerateObject).toHaveBeenCalledOnce()
    expect(result).toEqual(expected)
  })

  it('uses the default model when none is specified', async () => {
    mockGenerateObject.mockResolvedValue({
      object: {},
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    await anthropicProvider.generateObject({
      system: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
      schema: z.object({}),
    })

    const call = mockGenerateObject.mock.calls[0]?.[0] as unknown as { model: { model: string } }
    expect(call.model.model).toBe(MODELS.DEFAULT)
  })

  it('passes the Zod schema to the SDK', async () => {
    const schema = z.object({ name: z.string() })
    mockGenerateObject.mockResolvedValue({
      object: { name: 'Vizzy' },
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    await anthropicProvider.generateObject({
      system: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
      schema,
    })

    const call = mockGenerateObject.mock.calls[0]?.[0] as unknown as { schema: unknown }
    expect(call.schema).toBe(schema)
  })
})

describe('anthropicProvider.streamChat', () => {
  it('calls streamText and returns a Response', () => {
    const fakeResponse = new Response('stream')
    const mockResult = { toTextStreamResponse: vi.fn(() => fakeResponse) }
    mockStreamText.mockReturnValue(mockResult as unknown as ReturnType<typeof streamText>)

    const response = anthropicProvider.streamChat({
      messages: [{ role: 'user', content: 'hello' }],
      system: 'You are Vizzy',
    })

    expect(mockStreamText).toHaveBeenCalledOnce()
    expect(response).toBe(fakeResponse)
  })

  it('uses the default model when none specified', () => {
    const mockResult = { toTextStreamResponse: vi.fn(() => new Response()) }
    mockStreamText.mockReturnValue(mockResult as unknown as ReturnType<typeof streamText>)

    anthropicProvider.streamChat({
      messages: [{ role: 'user', content: 'hi' }],
    })

    const call = mockStreamText.mock.calls[0]?.[0] as unknown as { model: { model: string } }
    expect(call.model.model).toBe(MODELS.DEFAULT)
  })

  it('omits system prompt when not provided', () => {
    const mockResult = { toTextStreamResponse: vi.fn(() => new Response()) }
    mockStreamText.mockReturnValue(mockResult as unknown as ReturnType<typeof streamText>)

    anthropicProvider.streamChat({
      messages: [{ role: 'user', content: 'hi' }],
    })

    const call = mockStreamText.mock.calls[0]?.[0]
    expect(call).not.toHaveProperty('system')
  })
})

describe('anthropicProvider.generateImage', () => {
  it('throws because image generation is not yet implemented', async () => {
    await expect(
      anthropicProvider.generateImage({ prompt: 'a sunset over mountains' })
    ).rejects.toThrow('Image generation not implemented')
  })
})
