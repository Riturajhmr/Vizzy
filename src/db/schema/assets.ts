import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    type: text('type', { enum: ['image', 'video', 'document'] }).notNull(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (self) => [index('assets_user_id_idx').on(self.userId)],
)
