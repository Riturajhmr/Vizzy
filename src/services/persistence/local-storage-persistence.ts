import type { ConversationPersistencePort, ConversationStore } from './types'

const STORAGE_KEY = 'vizzy:conversations'

export class LocalStoragePersistence implements ConversationPersistencePort {
  load(): Promise<ConversationStore | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return Promise.resolve(null)
      return Promise.resolve(JSON.parse(raw) as ConversationStore)
    } catch (err) {
      console.error('[LocalStoragePersistence] Failed to load conversations:', err)
      return Promise.resolve(null)
    }
  }

  save(store: ConversationStore): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch (err) {
      console.error('[LocalStoragePersistence] Failed to save conversations:', err)
    }
    return Promise.resolve()
  }

  clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error('[LocalStoragePersistence] Failed to clear conversations:', err)
    }
    return Promise.resolve()
  }
}
