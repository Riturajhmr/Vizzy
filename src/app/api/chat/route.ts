import { z } from 'zod'
import { aiClient } from '@/lib/ai/client'
import { errorResponse } from '@/types/api'
import { CHAT_SYSTEM_PROMPT_V1 } from '@/ai/prompts/chat.v1'

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
})

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(errorResponse('Invalid JSON body'), { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      errorResponse(`Invalid request body: ${parsed.error.message}`),
      { status: 400 },
    )
  }

  try {
    return aiClient.streamChat({
      messages: parsed.data.messages,
      system: CHAT_SYSTEM_PROMPT_V1,
      abortSignal: request.signal,
    })
  } catch (err) {
    console.error('[api/chat] streamChat error:', err)
    return Response.json(errorResponse('AI provider error'), { status: 500 })
  }
}
