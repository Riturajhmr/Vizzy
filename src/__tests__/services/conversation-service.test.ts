import { describe, it, expect } from 'vitest'
import {
  createConversation,
  createMessage,
  createEmptySession,
  addMessageToSession,
  updateMessageInSession,
  clearSessionMessages,
  setSessionStreamingState,
  renameConversation,
} from '@/services/conversation-service'
import type { ConversationSession } from '@/types/conversation'

function makeSession(): ConversationSession {
  return createEmptySession('conv-1')
}

describe('createConversation', () => {
  it('returns an object with id, title, createdAt, updatedAt', () => {
    const c = createConversation()
    expect(typeof c.id).toBe('string')
    expect(typeof c.title).toBe('string')
    expect(typeof c.createdAt).toBe('string')
    expect(typeof c.updatedAt).toBe('string')
  })

  it('uses default title when none provided', () => {
    expect(createConversation().title).toBe('New conversation')
  })

  it('uses the provided title', () => {
    expect(createConversation('My chat').title).toBe('My chat')
  })

  it('sets createdAt and updatedAt to the same value', () => {
    const c = createConversation()
    expect(c.createdAt).toBe(c.updatedAt)
  })

  it('generates unique ids across calls', () => {
    const ids = Array.from({ length: 20 }, () => createConversation().id)
    expect(new Set(ids).size).toBe(20)
  })
})

describe('createMessage', () => {
  it('returns a message with id, role, content, createdAt', () => {
    const m = createMessage('user', 'hello')
    expect(typeof m.id).toBe('string')
    expect(m.role).toBe('user')
    expect(m.content).toBe('hello')
    expect(typeof m.createdAt).toBe('string')
  })

  it('accepts all three roles', () => {
    expect(createMessage('user', '').role).toBe('user')
    expect(createMessage('assistant', '').role).toBe('assistant')
    expect(createMessage('system', '').role).toBe('system')
  })

  it('generates unique ids across calls', () => {
    const ids = Array.from({ length: 20 }, () => createMessage('user', 'x').id)
    expect(new Set(ids).size).toBe(20)
  })
})

describe('createEmptySession', () => {
  it('sets conversationId from argument', () => {
    expect(createEmptySession('abc').conversationId).toBe('abc')
  })

  it('initializes messages as empty array', () => {
    expect(createEmptySession('x').messages).toEqual([])
  })

  it('initializes streamingState as idle', () => {
    expect(createEmptySession('x').streamingState).toBe('idle')
  })

  it('initializes nullable placeholders as null', () => {
    const s = createEmptySession('x')
    expect(s.activeWorkflow).toBeNull()
    expect(s.activeOutput).toBeNull()
    expect(s.refinementContext).toBeNull()
  })

  it('initializes selectedAssets as empty array', () => {
    expect(createEmptySession('x').selectedAssets).toEqual([])
  })
})

describe('addMessageToSession', () => {
  it('appends the message at the end of the messages array', () => {
    const session = makeSession()
    const msg = createMessage('user', 'hello')
    const result = addMessageToSession(session, msg)
    expect(result.messages).toHaveLength(1)
    expect(result.messages[0]).toBe(msg)
  })

  it('returns a new session object (immutable)', () => {
    const session = makeSession()
    const result = addMessageToSession(session, createMessage('user', 'hi'))
    expect(result).not.toBe(session)
  })

  it('does not mutate the original session', () => {
    const session = makeSession()
    addMessageToSession(session, createMessage('user', 'hi'))
    expect(session.messages).toHaveLength(0)
  })

  it('accumulates messages across chained calls', () => {
    let session = makeSession()
    session = addMessageToSession(session, createMessage('user', 'first'))
    session = addMessageToSession(session, createMessage('assistant', 'second'))
    expect(session.messages).toHaveLength(2)
    expect(session.messages[1]?.content).toBe('second')
  })
})

describe('updateMessageInSession', () => {
  it('updates the content of the matched message', () => {
    let session = makeSession()
    const msg = createMessage('user', 'original')
    session = addMessageToSession(session, msg)
    const updated = updateMessageInSession(session, msg.id, 'edited')
    expect(updated.messages[0]?.content).toBe('edited')
  })

  it('leaves other messages unchanged', () => {
    let session = makeSession()
    const m1 = createMessage('user', 'first')
    const m2 = createMessage('assistant', 'second')
    session = addMessageToSession(session, m1)
    session = addMessageToSession(session, m2)
    const updated = updateMessageInSession(session, m1.id, 'changed')
    expect(updated.messages[1]?.content).toBe('second')
  })

  it('returns unchanged messages when messageId not found', () => {
    let session = makeSession()
    session = addMessageToSession(session, createMessage('user', 'hi'))
    const result = updateMessageInSession(session, 'non-existent', 'new')
    expect(result.messages[0]?.content).toBe('hi')
  })

  it('returns a new session object (immutable)', () => {
    let session = makeSession()
    const msg = createMessage('user', 'hi')
    session = addMessageToSession(session, msg)
    expect(updateMessageInSession(session, msg.id, 'x')).not.toBe(session)
  })

  it('does not mutate the original session', () => {
    let session = makeSession()
    const msg = createMessage('user', 'original')
    session = addMessageToSession(session, msg)
    updateMessageInSession(session, msg.id, 'changed')
    expect(session.messages[0]?.content).toBe('original')
  })
})

describe('clearSessionMessages', () => {
  it('returns session with empty messages array', () => {
    let session = makeSession()
    session = addMessageToSession(session, createMessage('user', 'hi'))
    expect(clearSessionMessages(session).messages).toEqual([])
  })

  it('resets streamingState to idle', () => {
    let session = makeSession()
    session = setSessionStreamingState(session, 'pending')
    expect(clearSessionMessages(session).streamingState).toBe('idle')
  })

  it('preserves conversationId', () => {
    const session = makeSession()
    expect(clearSessionMessages(session).conversationId).toBe('conv-1')
  })

  it('does not mutate the original session', () => {
    let session = makeSession()
    session = addMessageToSession(session, createMessage('user', 'hi'))
    clearSessionMessages(session)
    expect(session.messages).toHaveLength(1)
  })
})

describe('renameConversation', () => {
  it('returns a new Conversation with the updated title', () => {
    const original = createConversation('Old title')
    const renamed = renameConversation(original, 'New title')
    expect(renamed.title).toBe('New title')
  })

  it('updates updatedAt to a new timestamp', () => {
    const original = createConversation('Old')
    const renamed = renameConversation(original, 'New')
    expect(renamed.updatedAt).toBeDefined()
    expect(typeof renamed.updatedAt).toBe('string')
  })

  it('preserves id and createdAt', () => {
    const original = createConversation('Old')
    const renamed = renameConversation(original, 'New')
    expect(renamed.id).toBe(original.id)
    expect(renamed.createdAt).toBe(original.createdAt)
  })

  it('returns a new object (immutable)', () => {
    const original = createConversation('Old')
    const renamed = renameConversation(original, 'New')
    expect(renamed).not.toBe(original)
  })

  it('does not mutate the original conversation', () => {
    const original = createConversation('Old')
    renameConversation(original, 'New')
    expect(original.title).toBe('Old')
  })
})

describe('setSessionStreamingState', () => {
  it('returns session with updated streamingState', () => {
    const session = makeSession()
    expect(setSessionStreamingState(session, 'pending').streamingState).toBe('pending')
    expect(setSessionStreamingState(session, 'streaming').streamingState).toBe('streaming')
    expect(setSessionStreamingState(session, 'complete').streamingState).toBe('complete')
    expect(setSessionStreamingState(session, 'error').streamingState).toBe('error')
    expect(setSessionStreamingState(session, 'idle').streamingState).toBe('idle')
  })

  it('returns a new session object (immutable)', () => {
    const session = makeSession()
    expect(setSessionStreamingState(session, 'pending')).not.toBe(session)
  })

  it('does not mutate the original session', () => {
    const session = makeSession()
    setSessionStreamingState(session, 'pending')
    expect(session.streamingState).toBe('idle')
  })
})
