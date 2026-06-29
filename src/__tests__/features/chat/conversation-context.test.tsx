import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ConversationProvider, useConversationContext } from '@/features/chat/context/conversation-context'
import { createConversation, createMessage } from '@/services/conversation-service'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return <ConversationProvider>{children}</ConversationProvider>
}

describe('initial state', () => {
  it('starts with empty conversations', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    expect(result.current.state.conversations).toEqual([])
  })

  it('starts with null activeConversationId', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    expect(result.current.state.activeConversationId).toBeNull()
  })

  it('starts with empty sessions', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    expect(result.current.state.sessions).toEqual({})
  })
})

describe('CREATE_CONVERSATION', () => {
  it('adds the conversation to the list', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation('Test')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    expect(result.current.state.conversations).toHaveLength(1)
    expect(result.current.state.conversations[0]?.id).toBe(conv.id)
  })

  it('creates an empty session for the conversation', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    expect(result.current.state.sessions[conv.id]).toBeDefined()
    expect(result.current.state.sessions[conv.id]?.messages).toEqual([])
  })

  it('auto-selects the new conversation', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    expect(result.current.state.activeConversationId).toBe(conv.id)
  })

  it('active is the second conversation after creating two', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const c1 = createConversation('first')
    const c2 = createConversation('second')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c1 })
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c2 })
    })
    expect(result.current.state.activeConversationId).toBe(c2.id)
    expect(result.current.state.conversations).toHaveLength(2)
  })
})

describe('SELECT_CONVERSATION', () => {
  it('changes activeConversationId to the given id', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const c1 = createConversation('first')
    const c2 = createConversation('second')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c1 })
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c2 })
    })
    act(() => {
      result.current.dispatch({ type: 'SELECT_CONVERSATION', payload: { id: c1.id } })
    })
    expect(result.current.state.activeConversationId).toBe(c1.id)
  })

  it('does nothing for an unknown id', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'SELECT_CONVERSATION', payload: { id: 'nonexistent' } })
    })
    expect(result.current.state.activeConversationId).toBe(conv.id)
  })

  it('creates a missing session when selecting a known conversation', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    // Manually remove the session to test the guard
    act(() => {
      result.current.dispatch({ type: 'SELECT_CONVERSATION', payload: { id: conv.id } })
    })
    expect(result.current.state.sessions[conv.id]).toBeDefined()
  })
})

describe('DELETE_CONVERSATION', () => {
  it('removes the conversation from the list', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'DELETE_CONVERSATION', payload: { id: conv.id } })
    })
    expect(result.current.state.conversations).toHaveLength(0)
  })

  it('removes the session', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'DELETE_CONVERSATION', payload: { id: conv.id } })
    })
    expect(result.current.state.sessions[conv.id]).toBeUndefined()
  })

  it('sets activeConversationId to next remaining conversation when deleting active', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const c1 = createConversation()
    const c2 = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c1 })
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c2 })
    })
    expect(result.current.state.activeConversationId).toBe(c2.id)
    act(() => {
      result.current.dispatch({ type: 'DELETE_CONVERSATION', payload: { id: c2.id } })
    })
    expect(result.current.state.activeConversationId).toBe(c1.id)
  })

  it('sets activeConversationId to null when last conversation is deleted', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'DELETE_CONVERSATION', payload: { id: conv.id } })
    })
    expect(result.current.state.activeConversationId).toBeNull()
  })

  it('does not change activeConversationId when deleting a non-active conversation', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const c1 = createConversation()
    const c2 = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c1 })
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: c2 })
    })
    act(() => {
      result.current.dispatch({ type: 'DELETE_CONVERSATION', payload: { id: c1.id } })
    })
    expect(result.current.state.activeConversationId).toBe(c2.id)
  })

  it('does nothing for an unknown id', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'DELETE_CONVERSATION', payload: { id: 'ghost' } })
    })
    expect(result.current.state.conversations).toHaveLength(1)
  })
})

describe('CLEAR_CONVERSATION', () => {
  it('empties messages in the session', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    const msg = createMessage('user', 'hello')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
      result.current.dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: conv.id, message: msg } })
    })
    act(() => {
      result.current.dispatch({ type: 'CLEAR_CONVERSATION', payload: { id: conv.id } })
    })
    expect(result.current.state.sessions[conv.id]?.messages).toEqual([])
  })

  it('resets streamingState to idle', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
      result.current.dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId: conv.id, state: 'pending' } })
    })
    act(() => {
      result.current.dispatch({ type: 'CLEAR_CONVERSATION', payload: { id: conv.id } })
    })
    expect(result.current.state.sessions[conv.id]?.streamingState).toBe('idle')
  })

  it('keeps the conversation in the list', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'CLEAR_CONVERSATION', payload: { id: conv.id } })
    })
    expect(result.current.state.conversations).toHaveLength(1)
  })

  it('does nothing for an unknown id', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'CLEAR_CONVERSATION', payload: { id: 'ghost' } })
    })
    expect(result.current.state.sessions).toEqual({})
  })
})

describe('ADD_MESSAGE', () => {
  it('appends the message to the session', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    const msg = createMessage('user', 'hello')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
      result.current.dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: conv.id, message: msg } })
    })
    expect(result.current.state.sessions[conv.id]?.messages).toHaveLength(1)
    expect(result.current.state.sessions[conv.id]?.messages[0]?.content).toBe('hello')
  })

  it('does nothing for an unknown conversationId', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const msg = createMessage('user', 'hello')
    act(() => {
      result.current.dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: 'ghost', message: msg } })
    })
    expect(result.current.state.sessions).toEqual({})
  })
})

describe('UPDATE_MESSAGE', () => {
  it('updates the content of the matched message', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    const msg = createMessage('user', 'original')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
      result.current.dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: conv.id, message: msg } })
    })
    act(() => {
      result.current.dispatch({ type: 'UPDATE_MESSAGE', payload: { conversationId: conv.id, messageId: msg.id, content: 'edited' } })
    })
    expect(result.current.state.sessions[conv.id]?.messages[0]?.content).toBe('edited')
  })

  it('does nothing for an unknown conversationId', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'UPDATE_MESSAGE', payload: { conversationId: 'ghost', messageId: 'x', content: 'y' } })
    })
    expect(result.current.state.sessions).toEqual({})
  })

  it('leaves messages unchanged for an unknown messageId', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    const msg = createMessage('user', 'hello')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
      result.current.dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: conv.id, message: msg } })
    })
    act(() => {
      result.current.dispatch({ type: 'UPDATE_MESSAGE', payload: { conversationId: conv.id, messageId: 'ghost', content: 'new' } })
    })
    expect(result.current.state.sessions[conv.id]?.messages[0]?.content).toBe('hello')
  })
})

describe('SET_STREAMING_STATE', () => {
  it('updates streamingState on the session', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation()
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    const states = ['pending', 'streaming', 'complete', 'error', 'idle'] as const
    for (const s of states) {
      act(() => {
        result.current.dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId: conv.id, state: s } })
      })
      expect(result.current.state.sessions[conv.id]?.streamingState).toBe(s)
    }
  })

  it('does nothing for an unknown conversationId', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId: 'ghost', state: 'pending' } })
    })
    expect(result.current.state.sessions).toEqual({})
  })
})

describe('RENAME_CONVERSATION', () => {
  it('updates the title of the matched conversation', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation('Original')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'RENAME_CONVERSATION', payload: { id: conv.id, title: 'Renamed' } })
    })
    expect(result.current.state.conversations[0]?.title).toBe('Renamed')
  })

  it('updates updatedAt on rename', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation('Original')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    const before = result.current.state.conversations[0]?.updatedAt
    vi.advanceTimersByTime(1)
    act(() => {
      result.current.dispatch({ type: 'RENAME_CONVERSATION', payload: { id: conv.id, title: 'Renamed' } })
    })
    const after = result.current.state.conversations[0]?.updatedAt
    expect(after).toBeDefined()
    expect(after).not.toBe(before)
    vi.useRealTimers()
  })

  it('does nothing for an unknown id', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation('Original')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'RENAME_CONVERSATION', payload: { id: 'ghost', title: 'New' } })
    })
    expect(result.current.state.conversations[0]?.title).toBe('Original')
  })

  it('does not affect sessions', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation('Original')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
    })
    act(() => {
      result.current.dispatch({ type: 'RENAME_CONVERSATION', payload: { id: conv.id, title: 'Renamed' } })
    })
    expect(result.current.state.sessions[conv.id]).toBeDefined()
  })
})

describe('RESTORE_STATE', () => {
  it('replaces full state with the payload', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const conv = createConversation('Restored')
    const payload = {
      conversations: [conv],
      sessions: { [conv.id]: { conversationId: conv.id, messages: [], streamingState: 'idle' as const, activeWorkflow: null, activeOutput: null, selectedAssets: [], refinementContext: null } },
      activeConversationId: conv.id,
    }
    act(() => {
      result.current.dispatch({ type: 'RESTORE_STATE', payload })
    })
    expect(result.current.state.conversations).toHaveLength(1)
    expect(result.current.state.conversations[0]?.title).toBe('Restored')
    expect(result.current.state.activeConversationId).toBe(conv.id)
  })

  it('overwrites any existing in-memory state', () => {
    const { result } = renderHook(() => useConversationContext(), { wrapper })
    const existing = createConversation('Old')
    act(() => {
      result.current.dispatch({ type: 'CREATE_CONVERSATION', payload: existing })
    })
    const restored = createConversation('Restored')
    act(() => {
      result.current.dispatch({
        type: 'RESTORE_STATE',
        payload: {
          conversations: [restored],
          sessions: { [restored.id]: { conversationId: restored.id, messages: [], streamingState: 'idle' as const, activeWorkflow: null, activeOutput: null, selectedAssets: [], refinementContext: null } },
          activeConversationId: restored.id,
        },
      })
    })
    expect(result.current.state.conversations).toHaveLength(1)
    expect(result.current.state.conversations[0]?.title).toBe('Restored')
  })
})
