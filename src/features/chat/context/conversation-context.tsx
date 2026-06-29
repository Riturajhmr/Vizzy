'use client'

import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch } from 'react'
import type { Message } from '@/types/plugin'
import type { Conversation, ConversationSession, StreamingState } from '@/types/conversation'
import type { ConversationPersistencePort, ConversationStore } from '@/services/persistence'
import { NullPersistence } from '@/services/persistence'
import {
  createEmptySession,
  addMessageToSession,
  updateMessageInSession,
  clearSessionMessages,
  setSessionStreamingState,
  renameConversation as renameConversationService,
} from '@/services/conversation-service'

interface ConversationState {
  conversations: Conversation[]
  activeConversationId: string | null
  sessions: Record<string, ConversationSession>
}

type ConversationAction =
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'SELECT_CONVERSATION'; payload: { id: string } }
  | { type: 'DELETE_CONVERSATION'; payload: { id: string } }
  | { type: 'CLEAR_CONVERSATION'; payload: { id: string } }
  | { type: 'RENAME_CONVERSATION'; payload: { id: string; title: string } }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { conversationId: string; messageId: string; content: string } }
  | { type: 'SET_STREAMING_STATE'; payload: { conversationId: string; state: StreamingState } }
  | { type: 'RESTORE_STATE'; payload: ConversationStore }

const initialState: ConversationState = {
  conversations: [],
  activeConversationId: null,
  sessions: {},
}

function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'CREATE_CONVERSATION': {
      const conversation = action.payload
      return {
        ...state,
        conversations: [...state.conversations, conversation],
        activeConversationId: conversation.id,
        sessions: {
          ...state.sessions,
          [conversation.id]: createEmptySession(conversation.id),
        },
      }
    }

    case 'SELECT_CONVERSATION': {
      const { id } = action.payload
      const exists = state.conversations.some((c) => c.id === id)
      if (!exists) return state
      const session = state.sessions[id] ?? createEmptySession(id)
      return {
        ...state,
        activeConversationId: id,
        sessions: { ...state.sessions, [id]: session },
      }
    }

    case 'DELETE_CONVERSATION': {
      const { id } = action.payload
      const exists = state.conversations.some((c) => c.id === id)
      if (!exists) return state

      const remaining = state.conversations.filter((c) => c.id !== id)
      const { [id]: _removed, ...restSessions } = state.sessions

      let nextActiveId = state.activeConversationId
      if (state.activeConversationId === id) {
        nextActiveId = remaining[0]?.id ?? null
      }

      return {
        conversations: remaining,
        activeConversationId: nextActiveId,
        sessions: restSessions,
      }
    }

    case 'CLEAR_CONVERSATION': {
      const { id } = action.payload
      const session = state.sessions[id]
      if (session === undefined) return state
      return {
        ...state,
        sessions: { ...state.sessions, [id]: clearSessionMessages(session) },
      }
    }

    case 'RENAME_CONVERSATION': {
      const { id, title } = action.payload
      const conversation = state.conversations.find((c) => c.id === id)
      if (conversation === undefined) return state
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === id ? renameConversationService(c, title) : c,
        ),
      }
    }

    case 'ADD_MESSAGE': {
      const { conversationId, message } = action.payload
      const session = state.sessions[conversationId]
      if (session === undefined) return state
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [conversationId]: addMessageToSession(session, message),
        },
      }
    }

    case 'UPDATE_MESSAGE': {
      const { conversationId, messageId, content } = action.payload
      const session = state.sessions[conversationId]
      if (session === undefined) return state
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [conversationId]: updateMessageInSession(session, messageId, content),
        },
      }
    }

    case 'SET_STREAMING_STATE': {
      const { conversationId, state: streamingState } = action.payload
      const session = state.sessions[conversationId]
      if (session === undefined) return state
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [conversationId]: setSessionStreamingState(session, streamingState),
        },
      }
    }

    case 'RESTORE_STATE': {
      return action.payload
    }
  }
}

interface ConversationContextValue {
  state: ConversationState
  dispatch: Dispatch<ConversationAction>
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

const defaultPersistence = new NullPersistence()

interface ConversationProviderProps {
  children: React.ReactNode
  persistence?: ConversationPersistencePort
}

export function ConversationProvider({
  children,
  persistence = defaultPersistence,
}: ConversationProviderProps) {
  const [state, dispatch] = useReducer(conversationReducer, initialState)
  const hydrated = useRef(false)

  useEffect(() => {
    persistence
      .load()
      .then((store) => {
        if (store !== null) {
          dispatch({ type: 'RESTORE_STATE', payload: store })
        }
      })
      .catch((err: unknown) => {
        console.error('[ConversationProvider] Failed to load persisted state:', err)
      })
      .finally(() => {
        hydrated.current = true
      })
  }, [persistence])

  useEffect(() => {
    if (!hydrated.current) return
    persistence.save({
      conversations: state.conversations,
      sessions: state.sessions,
      activeConversationId: state.activeConversationId,
    })
  }, [state, persistence])

  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversationContext(): ConversationContextValue {
  const context = useContext(ConversationContext)
  if (context === null) {
    throw new Error('useConversationContext must be used within ConversationProvider')
  }
  return context
}

export type { ConversationState, ConversationAction }
