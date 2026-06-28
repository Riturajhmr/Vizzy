import type { Intent, Message } from '@/types'

// Intent detection module — stub for Phase 1A.
// Full implementation in Phase 2 using aiClient.generateObject() + intent detection prompt.
// This module has NO knowledge of plugins or workflow IDs.
export async function detectIntent(
  _message: string,
  _history: Message[]
): Promise<Intent> {
  throw new Error('Intent detection not implemented — Phase 1A stub')
}
