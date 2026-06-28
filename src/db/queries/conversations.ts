import 'server-only'
import { eq, desc } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db, schema } from '@/db'
import { AppError, ErrorCode } from '@/types/errors'

export type Conversation = InferSelectModel<typeof schema.conversations>

export async function createConversation(
  userId: string,
  title?: string,
): Promise<Conversation> {
  const rows = await db
    .insert(schema.conversations)
    .values({ userId, title })
    .returning()

  const row = rows[0]
  if (!row) {
    throw new AppError('Conversation creation returned no row', ErrorCode.DATABASE_ERROR)
  }
  return row
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const rows = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function listUserConversations(userId: string): Promise<Conversation[]> {
  return db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.userId, userId))
    .orderBy(desc(schema.conversations.createdAt))
}

export async function updateConversationTitle(
  id: string,
  title: string,
): Promise<Conversation | null> {
  const rows = await db
    .update(schema.conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(schema.conversations.id, id))
    .returning()
  return rows[0] ?? null
}

export async function deleteConversation(id: string): Promise<void> {
  await db.delete(schema.conversations).where(eq(schema.conversations.id, id))
}
