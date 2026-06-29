import type { ConversationPersistencePort, ConversationStore } from './types'

export class NullPersistence implements ConversationPersistencePort {
  load(): Promise<ConversationStore | null> {
    return Promise.resolve(null)
  }

  save(_store: ConversationStore): Promise<void> {
    return Promise.resolve()
  }

  clear(): Promise<void> {
    return Promise.resolve()
  }
}
