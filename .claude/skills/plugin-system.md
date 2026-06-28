# Plugin System

## Purpose
Define and enforce the WorkflowPlugin architecture — the structural backbone of every creative capability in Vizzy Chat. This skill governs how plugins are built, registered, discovered, and executed.

---

## Core Types

```ts
interface WorkflowPlugin {
  id: string
  name: string
  detect: (intent: Intent) => boolean
  execute: (context: WorkflowContext) => Promise<WorkflowResult>
  validate: (result: WorkflowResult) => boolean
}

interface Intent {
  type: string           // Discriminated union — e.g. 'image-generation' | 'story-creation'
  description: string    // User's raw creative description (sanitized)
  parameters: Record<string, unknown>  // Extracted structured parameters
  confidence: number     // 0–1 from intent detector
}

interface WorkflowContext {
  intent: Intent
  conversationHistory: Message[]
  activeOutput?: WorkflowResult      // Current output available for refinement
  selectedAssets?: Asset[]           // User-provided reference images or files
  userPreferences?: Record<string, unknown>
}

interface WorkflowResult {
  type: string           // Discriminated union of output types
  status: 'success' | 'error'
  payload: unknown       // Plugin-specific output — must be serializable
  metadata: {
    pluginId: string
    executedAt: string
    model?: string
  }
}
```

---

## Execution Pipeline

```
User Message
  → Chat Layer                           (src/features/chat/)
    → IntentDetector                     (src/ai/intent/)
      → WorkflowRouter.route(intent)     (src/ai/router/)
        → PluginRegistry.resolve(intent) (src/workflows/registry.ts)
          → plugin.execute(context)      (src/workflows/<capability>/)
            → plugin.validate(result)
              → ConversationEngine.append(result)
                → Streamed response to chat
```

---

## PluginRegistry

Location: `src/workflows/registry.ts`

The registry is the single source of truth for all plugins. It:
- Holds all registered plugins
- Provides `resolve(intent: Intent): WorkflowPlugin | null`
- Is populated by plugin self-registration at module load time

```ts
// registry.ts — simplified
const registry = new Map<string, WorkflowPlugin>()

export function register(plugin: WorkflowPlugin): void {
  registry.set(plugin.id, plugin)
}

export function resolve(intent: Intent): WorkflowPlugin | null {
  for (const plugin of registry.values()) {
    if (plugin.detect(intent)) return plugin
  }
  return null
}
```

---

## Self-Registration Pattern

Each plugin registers itself when imported:

```ts
// src/workflows/image-generation/index.ts
import { register } from '../registry'

const imageGenerationPlugin: WorkflowPlugin = { ... }
register(imageGenerationPlugin)
export default imageGenerationPlugin
```

The registry entry point imports all plugins to trigger registration:

```ts
// src/workflows/index.ts — import to register
import './image-generation'
import './story-generation'
import './poster-creation'
// Adding a new plugin = one new import line here
```

---

## WorkflowRouter

Location: `src/ai/router/`

The router's only job: call `PluginRegistry.resolve(intent)` and execute the matched plugin.

```ts
export async function route(intent: Intent, context: WorkflowContext): Promise<WorkflowResult> {
  const plugin = resolve(intent)
  if (!plugin) return buildFallbackResult(intent)

  const result = await plugin.execute(context)
  const isValid = plugin.validate(result)
  if (!isValid) return buildFallbackResult(intent)

  return result
}
```

The router NEVER:
- Imports individual plugins
- Checks `intent.type` with if/else or switch
- Contains workflow-specific logic

---

## Hard Rules

1. **Chat layer → WorkflowRouter only.** Never call a plugin from chat.
2. **WorkflowRouter → PluginRegistry only.** Never resolve plugins with conditionals.
3. **PluginRegistry → plugin.detect() only.** Discovery is the registry's job.
4. **New workflow = new folder + register in `src/workflows/index.ts`.** Zero other files change.
5. **Never modify an existing plugin to accommodate a new capability.**

---

## Plugin Lifecycle (Forward-Compatible)

The current interface is minimal and stable. Future plugins may add optional lifecycle methods without breaking the contract:

```ts
interface WorkflowPluginV2 extends WorkflowPlugin {
  prepare?: (context: WorkflowContext) => Promise<WorkflowContext>  // Pre-process context
  refine?: (prev: WorkflowResult, context: WorkflowContext) => Promise<WorkflowResult>
  export?: (result: WorkflowResult, format: string) => Promise<Blob>
}
```

The router checks for optional methods before calling them. Plugins that don't implement them continue to work unchanged.

---

## Adding a New Plugin: Checklist

1. `mkdir src/workflows/<capability>/`
2. Create `types.ts` — extend `WorkflowResult` with plugin-specific payload
3. Create `detect.ts` — narrow intent matching
4. Create `execute.ts` — stateless AI execution
5. Create `validate.ts` — output quality gate
6. Create `index.ts` — assemble plugin and call `register()`
7. Create `README.md` — purpose, input, output, AI strategy, examples
8. Add `import './< capability>'` to `src/workflows/index.ts`

**See also:** `workflow-design.md`, `ai-engine.md`, `conversation-engine.md`
