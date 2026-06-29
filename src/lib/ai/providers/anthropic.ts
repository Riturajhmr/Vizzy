import 'server-only'
import { streamText, generateText, generateObject as sdkGenerateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { env } from '@/lib/env'
import { MODELS } from '../config'
import type {
  GenerateOptions,
  GenerateResult,
  ImageOptions,
  ImageResult,
  ChatStreamOptions,
  ObjectOptions,
  ProviderAdapter,
} from '../types'

const anthropicClient = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })

export const anthropicProvider: ProviderAdapter = {
  generate: async (options: GenerateOptions): Promise<GenerateResult> => {
    const model = options.model ?? MODELS.DEFAULT
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

  generateObject: async <T>(options: ObjectOptions<T>): Promise<T> => {
    const model = options.model ?? MODELS.DEFAULT
    const result = await sdkGenerateObject({
      model: anthropicClient(model),
      system: options.system,
      messages: options.messages,
      schema: options.schema,
    })
    return result.object
  },

  streamChat: (options: ChatStreamOptions): Response => {
    const result = streamText({
      model: anthropicClient(options.model ?? MODELS.DEFAULT),
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
