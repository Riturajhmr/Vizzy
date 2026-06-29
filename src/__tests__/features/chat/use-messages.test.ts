import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ConversationProvider } from '@/features/chat/context/conversation-context'
import { useConversations } from '@/features/chat/hooks/use-conversations'
import { useMessages } from '@/features/chat/hooks/use-messages'

const wrapper = ConversationProvider

function useSetup() {
  const conversations = useConversations()
  const messages = useMessages()
  return { ...conversations, ...messages }
}

// ─── Stream helpers ───────────────────────────────────────────────────────────

function makeStreamResponse(chunks: string[], status = 200): Response {
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(enc.encode(chunk))
        await Promise.resolve()
      }
      controller.close()
    },
  })
  return new Response(stream, { status })
}

function makeErrorResponse(status = 500): Response {
  return new Response(null, { status })
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────
// Each call to fetch gets a fresh Response so ReadableStream is never shared.

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(makeStreamResponse([]))))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('useMessages — initial state', () => {
  it('messages is empty when no active conversation', () => {
    const { result } = renderHook(() => useMessages(), { wrapper })
    expect(result.current.messages).toEqual([])
  })

  it('streamingState is idle when no active conversation', () => {
    const { result } = renderHook(() => useMessages(), { wrapper })
    expect(result.current.streamingState).toBe('idle')
  })
})

// ─── sendMessage ──────────────────────────────────────────────────────────────

describe('sendMessage', () => {
  it('appends a user message with the given content', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hello world') })
    const userMsg = result.current.messages.find((m) => m.role === 'user')
    expect(userMsg?.content).toBe('hello world')
  })

  it('trims whitespace from content', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('  hello  ') })
    const userMsg = result.current.messages.find((m) => m.role === 'user')
    expect(userMsg?.content).toBe('hello')
  })

  it('does nothing when content is empty', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('') })
    expect(result.current.messages).toHaveLength(0)
  })

  it('does nothing when content is only whitespace', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('   ') })
    expect(result.current.messages).toHaveLength(0)
  })

  it('auto-creates a conversation when none is active', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    expect(result.current.activeConversationId).toBeNull()
    await act(async () => { await result.current.sendMessage('first message') })
    expect(result.current.activeConversationId).not.toBeNull()
    expect(result.current.messages.some((m) => m.content === 'first message')).toBe(true)
  })

  it('accumulates multiple messages across sends', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('first') })
    await act(async () => { await result.current.sendMessage('second') })
    const userMsgs = result.current.messages.filter((m) => m.role === 'user')
    expect(userMsgs).toHaveLength(2)
  })
})

// ─── updateMessage ────────────────────────────────────────────────────────────

describe('updateMessage', () => {
  it('updates message content by messageId', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('original') })
    const msgId = result.current.messages.find((m) => m.role === 'user')?.id ?? ''
    act(() => { result.current.updateMessage(msgId, 'edited') })
    expect(result.current.messages.find((m) => m.id === msgId)?.content).toBe('edited')
  })

  it('does not change messages for an unknown messageId', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hello') })
    act(() => { result.current.updateMessage('ghost-id', 'new value') })
    expect(result.current.messages.find((m) => m.role === 'user')?.content).toBe('hello')
  })

  it('does nothing when no active conversation', () => {
    const { result } = renderHook(() => useMessages(), { wrapper })
    expect(() => {
      act(() => { result.current.updateMessage('any-id', 'value') })
    }).not.toThrow()
  })
})

// ─── messages reactivity ──────────────────────────────────────────────────────

describe('messages reactivity', () => {
  it('messages is empty for a conversation with no messages', () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    expect(result.current.messages).toEqual([])
  })

  it('messages reflects the active conversation only', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation('first') })
    const firstId = result.current.activeConversationId ?? ''
    await act(async () => { await result.current.sendMessage('from first') })
    act(() => { result.current.createConversation('second') })
    expect(result.current.messages).toEqual([])
    act(() => { result.current.selectConversation(firstId) })
    expect(result.current.messages.some((m) => m.content === 'from first')).toBe(true)
  })
})

// ─── Streaming ────────────────────────────────────────────────────────────────

describe('streaming', () => {
  it('adds both user and assistant messages after send', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hi') })
    expect(result.current.messages.some((m) => m.role === 'user')).toBe(true)
    expect(result.current.messages.some((m) => m.role === 'assistant')).toBe(true)
  })

  it('accumulates streaming chunks into the assistant message', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(makeStreamResponse(['Hello', ', ', 'world']))
    )
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hi') })
    const assistantMsg = result.current.messages.find((m) => m.role === 'assistant')
    expect(assistantMsg?.content).toBe('Hello, world')
  })

  it('reaches complete state after stream finishes', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(makeStreamResponse(['done']))
    )
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hi') })
    expect(result.current.streamingState).toBe('complete')
  })

  it('sends the correct messages array to the API', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('test') })
    const [_url, init] = vi.mocked(fetch).mock.calls[0] ?? []
    const body = JSON.parse((init as RequestInit).body as string) as { messages: unknown[] }
    expect(body.messages).toEqual([{ role: 'user', content: 'test' }])
  })
})

// ─── Cancel ───────────────────────────────────────────────────────────────────

describe('cancelStreaming', () => {
  it('sets streamingState to idle when cancelled mid-stream', async () => {
    // Fetch hangs until the abort signal fires, then rejects with AbortError
    vi.mocked(fetch).mockImplementationOnce((_url, init) => {
      const signal = (init as RequestInit).signal as AbortSignal
      return new Promise<Response>((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('The user aborted a request.', 'AbortError'))
        }, { once: true })
      })
    })

    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })

    // Start send without awaiting
    const promise = result.current.sendMessage('hi')

    // Allow fetch to start
    await act(async () => { await Promise.resolve() })

    // Abort — causes fetch to reject with AbortError
    act(() => { result.current.cancelStreaming() })

    await act(async () => { await promise })
    expect(result.current.streamingState).toBe('idle')
  })

  it('is a no-op when nothing is streaming', () => {
    const { result } = renderHook(() => useMessages(), { wrapper })
    expect(() => {
      act(() => { result.current.cancelStreaming() })
    }).not.toThrow()
  })
})

// ─── Error ────────────────────────────────────────────────────────────────────

describe('streaming error', () => {
  it('sets streamingState to error on non-OK response', async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve(makeErrorResponse(500))
    )
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hi') })
    expect(result.current.streamingState).toBe('error')
  })

  it('sets streamingState to error when fetch rejects', async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    )
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hi') })
    expect(result.current.streamingState).toBe('error')
  })
})

// ─── Retry ────────────────────────────────────────────────────────────────────

describe('retryLastMessage', () => {
  it('re-streams after an error and reaches complete state', async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve(makeErrorResponse(500))
    )
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.sendMessage('hi') })
    expect(result.current.streamingState).toBe('error')

    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve(makeStreamResponse(['retried']))
    )
    await act(async () => { await result.current.retryLastMessage() })
    const assistantMsg = result.current.messages.find((m) => m.role === 'assistant')
    expect(assistantMsg?.content).toBe('retried')
    expect(result.current.streamingState).toBe('complete')
  })

  it('is a no-op when there are no messages', async () => {
    const { result } = renderHook(() => useSetup(), { wrapper })
    act(() => { result.current.createConversation() })
    await act(async () => { await result.current.retryLastMessage() })
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })
})
