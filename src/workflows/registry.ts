import type { WorkflowPlugin, Intent } from '@/types'

// Central plugin registry — the single source of truth for all registered workflows.
// Plugins self-register by calling register() at module load time.
// The router calls resolve() — it never imports plugins directly.
const registry = new Map<string, WorkflowPlugin>()

export function register(plugin: WorkflowPlugin): void {
  if (registry.has(plugin.id)) {
    throw new Error(`WorkflowPlugin with id "${plugin.id}" is already registered`)
  }
  registry.set(plugin.id, plugin)
}

export function resolve(intent: Intent): WorkflowPlugin | null {
  for (const plugin of registry.values()) {
    if (plugin.detect(intent)) return plugin
  }
  return null
}

export function getRegisteredPluginIds(): string[] {
  return Array.from(registry.keys())
}
