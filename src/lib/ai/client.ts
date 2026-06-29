// The only AI import path used by the rest of the application.
// Never import provider SDKs (@anthropic-ai/sdk, openai) outside of providers/.
import type {
  GenerateOptions,
  GenerateResult,
  StreamOptions,
  ObjectOptions,
  ImageOptions,
  ImageResult,
  ChatStreamOptions,
} from './types'
import { anthropicProvider } from './providers/anthropic'

export interface AIClient {
  generate: (options: GenerateOptions) => Promise<GenerateResult>
  stream: (options: StreamOptions) => ReadableStream
  generateObject: <T>(options: ObjectOptions<T>) => Promise<T>
  generateImage: (options: ImageOptions) => Promise<ImageResult>
  streamChat: (options: ChatStreamOptions) => Response
}

function createClient(): AIClient {
  return {
    generate: (options) => anthropicProvider.generate(options),
    stream: (_options): ReadableStream => {
      throw new Error('Streaming not configured — use streamChat for conversational streaming')
    },
    generateObject: <T>(_options: ObjectOptions<T>): Promise<T> => {
      throw new Error('Object generation not configured — Phase 3 stub')
    },
    generateImage: (options) => anthropicProvider.generateImage(options),
    streamChat: (options) => anthropicProvider.streamChat(options),
  }
}

export const aiClient: AIClient = createClient()
