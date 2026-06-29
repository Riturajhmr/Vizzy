export interface GenerateOptions {
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: string
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

export interface StreamOptions extends GenerateOptions {
  onChunk?: (chunk: string) => void
}

export interface ObjectOptions<T> {
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  schema: T
  model?: string
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
  model?: string
  abortSignal?: AbortSignal
}
