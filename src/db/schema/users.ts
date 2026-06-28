import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    preferences: jsonb('preferences').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (self) => [index('users_email_idx').on(self.email)],
)
