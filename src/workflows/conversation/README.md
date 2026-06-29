# Conversation Workflow Plugin

## Purpose

Handles `conversation` intents — general chat exchanges that do not require a creative workflow.
When the intent detector classifies a user message as conversational (questions, greetings,
capability queries, navigation), this plugin produces a structured `WorkflowResult` that
the chat layer can use to continue the conversation via the streaming response.

## Intent Type

`conversation` — detected when the user's message is general chat with no creative output request.

## Input

```ts
WorkflowContext {
  intent: { type: 'conversation', description: string, confidence: number }
  conversationHistory: Message[]
}
```

## Output

```ts
WorkflowResult {
  type: 'conversation'
  status: 'success'
  payload: { message: string }   // echoes intent.description; chat layer generates the actual reply
  metadata: { pluginId: 'conversation', executedAt: string }
}
```

## AI Strategy

This plugin does not make AI calls. The conversational AI response is produced by the
streaming chat layer (`streamChat`) independently of the workflow result. The plugin
exists to satisfy the routing contract and signal to the chat layer that no creative
workflow was triggered.

## Adding Real Conversational Logic

If conversational intents need structured handling in the future (e.g., memory retrieval,
tool calls, multi-turn planning), implement it in `execute.ts`. The `detect`, `validate`,
and registration code remain unchanged.
