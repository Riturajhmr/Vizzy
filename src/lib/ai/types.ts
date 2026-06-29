import type { ZodType } from 'zod'
import type { ModelId } from './config'

export interface GenerateOptions {
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: ModelId | string
  temperature?: number
  maxTokens?: number
}

export interface GenerateResult {
  text: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ObjectOptions<T> {
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  schema: ZodType<T>
  model?: ModelId | string
}

export interface ImageOptions {
  prompt: string
  model?: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
}

export interface ImageResult {
  url: string
  model: string
}

export interface ChatStreamOptions {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  model?: ModelId | string
  abortSignal?: AbortSignal
}

export interface ProviderAdapter {
  generate: (options: GenerateOptions) => Promise<GenerateResult>
  generateObject: <T>(options: ObjectOptions<T>) => Promise<T>
  generateImage: (options: ImageOptions) => Promise<ImageResult>
  streamChat: (options: ChatStreamOptions) => Response
}
