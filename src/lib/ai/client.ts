// The only AI import path used by the rest of the application.
// Never import provider SDKs (@anthropic-ai/sdk, openai) outside of providers/.
import type {
  GenerateOptions,
  GenerateResult,
  StreamOptions,
  ObjectOptions,
  ImageOptions,
  ImageResult,
} from './types'
import { anthropicProvider } from './providers/anthropic'

export interface AIClient {
  generate: (options: GenerateOptions) => Promise<GenerateResult>
  stream: (options: StreamOptions) => ReadableStream
  generateObject: <T>(options: ObjectOptions<T>) => Promise<T>
  generateImage: (options: ImageOptions) => Promise<ImageResult>
}

function createClient(): AIClient {
  return {
    generate: (options) => anthropicProvider.generate(options),
    stream: (_options): ReadableStream => {
      throw new Error('Streaming not configured — Phase 1A stub')
    },
    generateObject: <T>(_options: ObjectOptions<T>): Promise<T> => {
      throw new Error('Object generation not configured — Phase 1A stub')
    },
    generateImage: (options) => anthropicProvider.generateImage(options),
  }
}

export const aiClient: AIClient = createClient()
