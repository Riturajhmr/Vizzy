export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export interface Asset {
  id: string
  url: string
  type: 'image' | 'video' | 'document'
  name: string
  mimeType: string
  sizeBytes: number
}

export interface Intent {
  type: string
  description: string
  parameters: Record<string, unknown>
  confidence: number
}

export interface WorkflowContext {
  intent: Intent
  conversationHistory: Message[]
  activeOutput?: WorkflowResult
  selectedAssets?: Asset[]
  userPreferences?: Record<string, unknown>
}

export interface WorkflowResult {
  type: string
  status: 'success' | 'error'
  payload: unknown
  metadata: {
    pluginId: string
    executedAt: string
    model?: string
  }
}

export interface WorkflowPlugin {
  id: string
  name: string
  detect: (intent: Intent) => boolean
  execute: (context: WorkflowContext) => Promise<WorkflowResult>
  validate: (result: WorkflowResult) => boolean
}
