import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ConversationProvider } from '@/features/chat/context/conversation-context'
import { useConversations } from '@/features/chat/hooks/use-conversations'

const wrapper = ConversationProvider

describe('useConversations — initial state', () => {
  it('starts with empty conversations array', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    expect(result.current.conversations).toEqual([])
  })

  it('starts with null activeConversationId', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    expect(result.current.activeConversationId).toBeNull()
  })
})

describe('createConversation', () => {
  it('adds a conversation to the list', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    expect(result.current.conversations).toHaveLength(1)
  })

  it('sets the new conversation as active', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    const id = result.current.conversations[0]?.id
    expect(result.current.activeConversationId).toBe(id)
  })

  it('uses the provided title', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation('My design')
    })
    expect(result.current.conversations[0]?.title).toBe('My design')
  })

  it('uses default title when no title provided', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    expect(result.current.conversations[0]?.title).toBe('New conversation')
  })

  it('accumulates multiple conversations', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation('first')
      result.current.createConversation('second')
    })
    expect(result.current.conversations).toHaveLength(2)
  })
})

describe('selectConversation', () => {
  it('changes activeConversationId', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation('first')
      result.current.createConversation('second')
    })
    const firstId = result.current.conversations[0]?.id ?? ''
    act(() => {
      result.current.selectConversation(firstId)
    })
    expect(result.current.activeConversationId).toBe(firstId)
  })

  it('does nothing for an unknown id', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    const before = result.current.activeConversationId
    act(() => {
      result.current.selectConversation('nonexistent')
    })
    expect(result.current.activeConversationId).toBe(before)
  })
})

describe('deleteConversation', () => {
  it('removes the conversation from the list', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    const id = result.current.conversations[0]?.id ?? ''
    act(() => {
      result.current.deleteConversation(id)
    })
    expect(result.current.conversations).toHaveLength(0)
  })

  it('sets activeConversationId to null when last conversation is deleted', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    const id = result.current.activeConversationId ?? ''
    act(() => {
      result.current.deleteConversation(id)
    })
    expect(result.current.activeConversationId).toBeNull()
  })

  it('falls back to remaining conversation when active is deleted', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation('first')
      result.current.createConversation('second')
    })
    const secondId = result.current.activeConversationId ?? ''
    const firstId = result.current.conversations.find((c) => c.id !== secondId)?.id ?? ''
    act(() => {
      result.current.deleteConversation(secondId)
    })
    expect(result.current.activeConversationId).toBe(firstId)
  })
})

describe('clearConversation', () => {
  it('keeps the conversation in the list', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    const id = result.current.conversations[0]?.id ?? ''
    act(() => {
      result.current.clearConversation(id)
    })
    expect(result.current.conversations).toHaveLength(1)
  })

  it('activeConversationId is unchanged after clear', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation()
    })
    const id = result.current.activeConversationId ?? ''
    act(() => {
      result.current.clearConversation(id)
    })
    expect(result.current.activeConversationId).toBe(id)
  })
})

describe('renameConversation', () => {
  it('updates the conversation title', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation('Original')
    })
    const id = result.current.conversations[0]?.id ?? ''
    act(() => {
      result.current.renameConversation(id, 'Renamed')
    })
    expect(result.current.conversations[0]?.title).toBe('Renamed')
  })

  it('does nothing for an unknown id', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation('Original')
    })
    act(() => {
      result.current.renameConversation('nonexistent', 'New')
    })
    expect(result.current.conversations[0]?.title).toBe('Original')
  })

  it('does not change conversation count', () => {
    const { result } = renderHook(() => useConversations(), { wrapper })
    act(() => {
      result.current.createConversation('first')
      result.current.createConversation('second')
    })
    const id = result.current.conversations[0]?.id ?? ''
    act(() => {
      result.current.renameConversation(id, 'updated first')
    })
    expect(result.current.conversations).toHaveLength(2)
  })
})
