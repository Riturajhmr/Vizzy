import 'server-only'
import { eq, asc } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db, schema } from '@/db'
import { AppError, ErrorCode } from '@/types/errors'

export type Message = InferSelectModel<typeof schema.messages>

export async function appendMessage(data: {
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
}): Promise<Message> {
  const rows = await db.insert(schema.messages).values(data).returning()

  const row = rows[0]
  if (!row) {
    throw new AppError('Message insert returned no row', ErrorCode.DATABASE_ERROR)
  }
  return row
}

export async function getMessagesByConversation(
  conversationId: string,
): Promise<Message[]> {
  return db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(asc(schema.messages.createdAt))
}
