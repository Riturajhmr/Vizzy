'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useConversationContext } from '../context/conversation-context'
import {
  createConversation as makeConversation,
  createMessage,
} from '@/services/conversation-service'
import type { Message } from '@/types/plugin'
import type { ConversationState } from '../context/conversation-context'
import type { StreamingState } from '@/types/conversation'

export interface UseMessagesReturn {
  messages: Message[]
  streamingState: StreamingState
  sendMessage: (content: string) => Promise<void>
  updateMessage: (messageId: string, content: string) => void
  cancelStreaming: () => void
  retryLastMessage: () => Promise<void>
}

export function useMessages(): UseMessagesReturn {
  const { state, dispatch } = useConversationContext()

  // Updated after each render so async callbacks always read latest state
  const stateRef = useRef<ConversationState>(state)
  useEffect(() => {
    stateRef.current = state
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const activeSession =
    state.activeConversationId !== null
      ? state.sessions[state.activeConversationId]
      : undefined

  const messages = activeSession?.messages ?? []
  const streamingState = activeSession?.streamingState ?? 'idle'

  const executeStream = useCallback(
    async (
      conversationId: string,
      messagesToSend: Array<{ role: 'user' | 'assistant'; content: string }>,
      assistantMessageId: string,
    ): Promise<void> => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId, state: 'pending' } })

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messagesToSend }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`API error: ${response.status}`)
        }

        dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId, state: 'streaming' } })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        // Cancel the reader when the abort signal fires mid-stream
        const abortHandler = () => { void reader.cancel() }
        controller.signal.addEventListener('abort', abortHandler, { once: true })

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            accumulated += decoder.decode(value, { stream: true })
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: { conversationId, messageId: assistantMessageId, content: accumulated },
            })
          }
        } finally {
          controller.signal.removeEventListener('abort', abortHandler)
        }

        if (controller.signal.aborted) {
          dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId, state: 'idle' } })
          return
        }

        dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId, state: 'complete' } })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId, state: 'idle' } })
        } else {
          console.error('[useMessages] Stream error:', err)
          dispatch({ type: 'SET_STREAMING_STATE', payload: { conversationId, state: 'error' } })
        }
      }
    },
    [dispatch],
  )

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const trimmed = content.trim()
      if (!trimmed) return

      const currentState = stateRef.current
      const activeId = currentState.activeConversationId
      const activeSessionState = activeId !== null ? currentState.sessions[activeId] : undefined
      const isStreaming =
        activeSessionState?.streamingState === 'streaming' ||
        activeSessionState?.streamingState === 'pending'

      if (isStreaming) return

      let conversationId = activeId

      if (conversationId === null) {
        const conversation = makeConversation()
        dispatch({ type: 'CREATE_CONVERSATION', payload: conversation })
        conversationId = conversation.id
      }

      const userMessage = createMessage('user', trimmed)
      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message: userMessage } })

      const assistantMessage = createMessage('assistant', '')
      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message: assistantMessage } })

      const existingMessages = activeSessionState?.messages ?? []
      const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...existingMessages
          .filter((m) => m.role !== 'system' && m.content !== '')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: trimmed },
      ]

      await executeStream(conversationId, historyMessages, assistantMessage.id)
    },
    [dispatch, executeStream],
  )

  const cancelStreaming = useCallback((): void => {
    abortControllerRef.current?.abort()
  }, [])

  const retryLastMessage = useCallback(async (): Promise<void> => {
    const currentState = stateRef.current
    const convId = currentState.activeConversationId
    if (convId === null) return

    const session = currentState.sessions[convId]
    if (!session) return

    const msgs = session.messages
    const lastAssistantEntry = [...msgs]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find(({ m }) => m.role === 'assistant')

    if (!lastAssistantEntry) return

    const { m: lastAssistant, i: lastAssistantIdx } = lastAssistantEntry

    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { conversationId: convId, messageId: lastAssistant.id, content: '' },
    })

    const historyMessages = msgs
      .slice(0, lastAssistantIdx)
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    await executeStream(convId, historyMessages, lastAssistant.id)
  }, [dispatch, executeStream])

  const updateMessage = useCallback(
    (messageId: string, content: string): void => {
      const currentState = stateRef.current
      if (currentState.activeConversationId === null) return
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: { conversationId: currentState.activeConversationId, messageId, content },
      })
    },
    [dispatch],
  )

  return { messages, streamingState, sendMessage, updateMessage, cancelStreaming, retryLastMessage }
}
