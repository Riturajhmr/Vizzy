import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStoragePersistence } from '@/services/persistence/local-storage-persistence'
import type { ConversationStore } from '@/services/persistence/types'

const STORAGE_KEY = 'vizzy:conversations'

function makeStore(): ConversationStore {
  return {
    conversations: [
      { id: 'c1', title: 'Hello', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    ],
    sessions: {
      c1: {
        conversationId: 'c1',
        messages: [],
        streamingState: 'idle',
        activeWorkflow: null,
        activeOutput: null,
        selectedAssets: [],
        refinementContext: null,
      },
    },
    activeConversationId: 'c1',
  }
}

describe('LocalStoragePersistence', () => {
  let persistence: LocalStoragePersistence

  beforeEach(() => {
    localStorage.clear()
    persistence = new LocalStoragePersistence()
  })

  describe('load', () => {
    it('returns null when key is absent', async () => {
      const result = await persistence.load()
      expect(result).toBeNull()
    })

    it('returns null on corrupt JSON without throwing', async () => {
      localStorage.setItem(STORAGE_KEY, '{not valid json}')
      const result = await persistence.load()
      expect(result).toBeNull()
    })

    it('returns the stored ConversationStore on valid data', async () => {
      const store = makeStore()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      const result = await persistence.load()
      expect(result).toEqual(store)
    })
  })

  describe('save', () => {
    it('writes serialized store to localStorage', async () => {
      const store = makeStore()
      await persistence.save(store)
      const raw = localStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw!)).toEqual(store)
    })

    it('does not throw when localStorage.setItem throws', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError')
      })
      await expect(persistence.save(makeStore())).resolves.toBeUndefined()
    })
  })

  describe('clear', () => {
    it('removes the key from localStorage', async () => {
      const store = makeStore()
      await persistence.save(store)
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
      await persistence.clear()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('does not throw when key does not exist', async () => {
      await expect(persistence.clear()).resolves.toBeUndefined()
    })
  })
})
