export const MODELS = {
  DEFAULT: 'claude-sonnet-4-6',
  REASONING: 'claude-opus-4-8',
} as const

export type ModelId = (typeof MODELS)[keyof typeof MODELS]

export type ProviderName = 'anthropic'

export const DEFAULT_PROVIDER: ProviderName = 'anthropic'
