'use client'

import { useCallback } from 'react'
import { useConversationContext } from '../context/conversation-context'
import { createConversation as makeConversation } from '@/services/conversation-service'
import type { Conversation } from '@/types/conversation'

export interface UseConversationsReturn {
  conversations: Conversation[]
  activeConversationId: string | null
  createConversation: (title?: string) => void
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  clearConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
}

export function useConversations(): UseConversationsReturn {
  const { state, dispatch } = useConversationContext()

  const createConversation = useCallback(
    (title?: string) => {
      const conversation = makeConversation(title)
      dispatch({ type: 'CREATE_CONVERSATION', payload: conversation })
    },
    [dispatch],
  )

  const selectConversation = useCallback(
    (id: string) => {
      dispatch({ type: 'SELECT_CONVERSATION', payload: { id } })
    },
    [dispatch],
  )

  const deleteConversation = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_CONVERSATION', payload: { id } })
    },
    [dispatch],
  )

  const clearConversation = useCallback(
    (id: string) => {
      dispatch({ type: 'CLEAR_CONVERSATION', payload: { id } })
    },
    [dispatch],
  )

  const renameConversation = useCallback(
    (id: string, title: string) => {
      dispatch({ type: 'RENAME_CONVERSATION', payload: { id, title } })
    },
    [dispatch],
  )

  return {
    conversations: state.conversations,
    activeConversationId: state.activeConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    clearConversation,
    renameConversation,
  }
}
