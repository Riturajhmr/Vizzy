// Anthropic provider stub — full implementation in Phase 2.
// Import only via @/lib/ai/client — never import this file directly.
import type { GenerateOptions, GenerateResult, ImageOptions, ImageResult } from '../types'

export const anthropicProvider = {
  generate: async (_options: GenerateOptions): Promise<GenerateResult> => {
    throw new Error('AI provider not configured — Phase 1A stub')
  },
  generateImage: async (_options: ImageOptions): Promise<ImageResult> => {
    throw new Error('AI provider not configured — Phase 1A stub')
  },
}
