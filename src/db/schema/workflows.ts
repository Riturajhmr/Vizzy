import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { conversations } from './conversations'

export const workflowExecutions = pgTable(
  'workflow_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, {
      onDelete: 'set null',
    }),
    pluginId: text('plugin_id').notNull(),
    status: text('status', { enum: ['success', 'error', 'pending'] }).notNull(),
    result: jsonb('result'),
    executedAt: timestamp('executed_at').defaultNow().notNull(),
  },
  (self) => [
    index('workflow_executions_user_id_idx').on(self.userId),
    index('workflow_executions_conversation_id_idx').on(self.conversationId),
  ],
)
