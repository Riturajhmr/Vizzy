import type { Intent } from '@/types'

export function detect(intent: Intent): boolean {
  return intent.type === 'conversation'
}
