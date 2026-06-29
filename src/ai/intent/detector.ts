import 'server-only'
import { aiClient } from '@/lib/ai/client'
import { intentSchema } from '@/types/intent'
import type { Intent } from '@/types/intent'
import type { Message } from '@/types'
import { buildIntentDetectionPrompt } from '@/ai/prompts/intent-detection.v1'
import { sanitizeUserInput } from '@/utils/sanitize'
import { withRetry } from '@/utils/retry'

const HISTORY_WINDOW = 6

const FALLBACK_INTENT: Extract<Intent, { type: 'unknown' }> = {
  type: 'unknown',
  description: 'Intent classification failed — routing to fallback',
  confidence: 0,
}

function toPromptMessages(
  messages: Message[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((m): m is Message & { role: 'user' | 'assistant' } => m.role !== 'system')
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }))
}

export async function detectIntent(message: string, history: Message[]): Promise<Intent> {
  const sanitized = sanitizeUserInput(message)
  const recentHistory = toPromptMessages(history)
  const { system, messages } = buildIntentDetectionPrompt({ message: sanitized, recentHistory })

  try {
    return await withRetry(() =>
      aiClient.generateObject({ system, messages, schema: intentSchema }),
    )
  } catch (err) {
    console.error('[detectIntent] Classification failed:', err)
    return FALLBACK_INTENT
  }
}
