import 'server-only'
import { eq } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { db, schema } from '@/db'
import { AppError, ErrorCode } from '@/types/errors'

export type User = InferSelectModel<typeof schema.users>
export type NewUser = InferInsertModel<typeof schema.users>

export async function upsertUser(data: NewUser): Promise<User> {
  const rows = await db
    .insert(schema.users)
    .values(data)
    .onConflictDoUpdate({
      target: schema.users.email,
      set: {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        updatedAt: new Date(),
      },
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw new AppError('User upsert returned no row', ErrorCode.DATABASE_ERROR)
  }
  return row
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
  return rows[0] ?? null
}
