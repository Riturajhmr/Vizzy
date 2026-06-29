// Intent detection prompt — v1.
// Bump to v2 when: output schema changes, intent taxonomy changes, or classification quality
// degrades significantly and a prompt rewrite is required. Keep v1 until all callers migrate.

interface IntentDetectionPromptParams {
  message: string
  recentHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

const SYSTEM = `You are a creative intent classifier for Vizzy, a creative AI operating system.
Your sole task: analyze the user message and return a single structured JSON intent object.

Classify the message into exactly one of these types:

"image-generation" — The user wants to create a new image from a description.
  Examples: "make a sunset landscape", "generate a portrait of a robot", "draw a dragon"

"image-editing" — The user wants to modify an existing image (usually references a prior image in context).
  Examples: "remove the background", "make it look vintage", "change the sky to nighttime"

"poster-creation" — The user wants a poster, flyer, banner, or graphic design piece.
  Examples: "create a concert poster for jazz night", "make a birthday invitation", "design a book cover"

"story-generation" — The user wants written narrative: a story, poem, script, caption, or article.
  Examples: "write a short horror story", "give me a haiku about winter", "write product copy"

"refinement" — The user wants to change or improve a previous creative output. References prior work.
  Examples: "make it darker", "add more stars", "shorter please", "change the tone to playful"

"conversation" — General chat, a question, or a request not tied to creative output.
  Examples: "what can you do?", "hello", "how do I save my image?", "undo that"

"unknown" — The intent is ambiguous or cannot be confidently classified into any above type.

Confidence scoring:
- 0.9–1.0: Unambiguous, single-intent creative request
- 0.7–0.89: Likely a creative intent with minor ambiguity
- 0.5–0.69: Vague or multi-intent; pick the most probable type
- Below 0.5: Use "unknown"

Return ONLY a valid JSON object. No explanation. No preamble. No markdown fences.`

export function buildIntentDetectionPrompt(params: IntentDetectionPromptParams): {
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
} {
  return {
    system: SYSTEM,
    messages: [
      ...params.recentHistory,
      { role: 'user' as const, content: params.message },
    ],
  }
}
