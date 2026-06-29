// The only AI import path used by the rest of the application.
// Never import provider SDKs (@anthropic-ai/sdk, openai) outside of providers/.
import type { GenerateOptions, GenerateResult, ObjectOptions, ImageOptions, ImageResult, ChatStreamOptions } from './types'
import { anthropicProvider } from './providers/anthropic'

export interface AIClient {
  generate: (options: GenerateOptions) => Promise<GenerateResult>
  generateObject: <T>(options: ObjectOptions<T>) => Promise<T>
  generateImage: (options: ImageOptions) => Promise<ImageResult>
  streamChat: (options: ChatStreamOptions) => Response
}

function createClient(): AIClient {
  return {
    generate: (options) => anthropicProvider.generate(options),
    generateObject: <T>(options: ObjectOptions<T>): Promise<T> => anthropicProvider.generateObject(options),
    generateImage: (options) => anthropicProvider.generateImage(options),
    streamChat: (options) => anthropicProvider.streamChat(options),
  }
}

export const aiClient: AIClient = createClient()
