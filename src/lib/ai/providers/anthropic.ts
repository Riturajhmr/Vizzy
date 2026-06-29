import 'server-only'
import { streamText, generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { env } from '@/lib/env'
import type { GenerateOptions, GenerateResult, ImageOptions, ImageResult, ChatStreamOptions } from '../types'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

const anthropicClient = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })

export const anthropicProvider = {
  generate: async (options: GenerateOptions): Promise<GenerateResult> => {
    const model = options.model ?? DEFAULT_MODEL
    const result = await generateText({
      model: anthropicClient(model),
      system: options.system,
      messages: options.messages,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxTokens !== undefined && { maxTokens: options.maxTokens }),
    })
    return {
      text: result.text,
      model,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
    }
  },

  streamChat: (options: ChatStreamOptions): Response => {
    const result = streamText({
      model: anthropicClient(options.model ?? DEFAULT_MODEL),
      ...(options.system !== undefined && { system: options.system }),
      messages: options.messages,
      ...(options.abortSignal !== undefined && { abortSignal: options.abortSignal }),
    })
    return result.toTextStreamResponse()
  },

  generateImage: async (_options: ImageOptions): Promise<ImageResult> => {
    throw new Error('Image generation not implemented — Phase 3')
  },
}
