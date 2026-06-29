import { describe, it, expect } from 'vitest'
import { register, resolve, getRegisteredPluginIds } from '@/workflows/registry'
import type { WorkflowPlugin, WorkflowContext, WorkflowResult, Intent } from '@/types'

function makePlugin(id: string, intentType: string): WorkflowPlugin {
  return {
    id,
    name: `Test plugin ${id}`,
    detect: (intent: Intent) => intent.type === intentType,
    execute: async (_context: WorkflowContext): Promise<WorkflowResult> => ({
      type: intentType,
      status: 'success',
      payload: { message: 'ok' },
      metadata: { pluginId: id, executedAt: new Date().toISOString() },
    }),
    validate: (result: WorkflowResult) => result.status === 'success',
  }
}

function makeConversationIntent(): Extract<Intent, { type: 'conversation' }> {
  return { type: 'conversation', description: 'hello', confidence: 0.95 }
}

function makeUnknownIntent(): Extract<Intent, { type: 'unknown' }> {
  return { type: 'unknown', description: 'unclear', confidence: 0.2 }
}

describe('register', () => {
  it('registers a plugin without throwing', () => {
    expect(() => register(makePlugin('reg-alpha', 'conversation'))).not.toThrow()
  })

  it('throws when registering a plugin with a duplicate id', () => {
    register(makePlugin('reg-dup-target', 'image-generation'))
    expect(() => register(makePlugin('reg-dup-target', 'image-generation'))).toThrow(
      'WorkflowPlugin with id "reg-dup-target" is already registered',
    )
  })
})

describe('resolve', () => {
  it('returns null when no registered plugin matches the intent', () => {
    // 'unknown' type — no plugin registered for it in this file
    const result = resolve(makeUnknownIntent())
    expect(result).toBeNull()
  })

  it('returns the plugin whose detect() returns true', () => {
    // 'reg-alpha' was registered above with detect for 'conversation'
    const result = resolve(makeConversationIntent())
    expect(result).not.toBeNull()
    expect(result?.id).toBe('reg-alpha')
  })

  it('returns the first matching plugin when multiple could match', () => {
    // Register a second 'conversation'-detecting plugin
    register(makePlugin('reg-beta', 'conversation'))

    const result = resolve(makeConversationIntent())
    // Registry iterates Map in insertion order; reg-alpha was first
    expect(result?.id).toBe('reg-alpha')
  })

  it('returns null for an intent type with no registered handler', () => {
    const posterIntent: Extract<Intent, { type: 'poster-creation' }> = {
      type: 'poster-creation',
      description: 'a jazz poster',
      confidence: 0.9,
    }
    expect(resolve(posterIntent)).toBeNull()
  })
})

describe('getRegisteredPluginIds', () => {
  it('includes all registered plugin ids', () => {
    register(makePlugin('reg-gamma', 'story-generation'))
    const ids = getRegisteredPluginIds()
    expect(ids).toContain('reg-alpha')
    expect(ids).toContain('reg-dup-target')
    expect(ids).toContain('reg-beta')
    expect(ids).toContain('reg-gamma')
  })

  it('does not contain ids that were never registered', () => {
    const ids = getRegisteredPluginIds()
    expect(ids).not.toContain('nonexistent-plugin')
  })
})
