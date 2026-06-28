# Database

## Purpose
Define schema design, migration discipline, query patterns, and Supabase RLS conventions for Vizzy Chat's PostgreSQL database managed through Drizzle ORM.

---

## Stack

- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle
- **Auth + Storage:** Supabase (shared with DB)

---

## Schema Organization

Schema files live in `src/db/schema/` — one file per logical domain group:

```
src/db/schema/
  users.ts          # users, user_preferences
  conversations.ts  # conversations, messages
  assets.ts         # assets, asset_metadata
  workflows.ts      # workflow_executions, workflow_results
```

Export every table definition. Import into `src/db/index.ts` to build the Drizzle DB instance.

---

## Schema Conventions

```ts
// src/db/schema/conversations.ts
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

Rules:
- Column names: `snake_case` in PostgreSQL, `camelCase` in TypeScript (Drizzle maps automatically)
- All tables: `id` as UUID primary key with `.defaultRandom()`
- All tables: `created_at` and `updated_at` timestamps
- Foreign keys: always specify `onDelete` behavior explicitly

---

## Drizzle Type Inference

Never manually write row types. Use Drizzle's inference:

```ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { conversations } from './schema/conversations'

type Conversation = InferSelectModel<typeof conversations>
type NewConversation = InferInsertModel<typeof conversations>
```

These types are always in sync with the schema. Manual interfaces diverge silently.

---

## Migration Discipline

**Rule: Never modify a schema file without creating a corresponding migration.**

```bash
# After editing schema files
npx drizzle-kit generate    # generate migration SQL
npx drizzle-kit migrate     # apply to database
```

Migrations live in `src/db/migrations/`. They are committed to git and applied in CI before deployment.

Never:
- Edit a migration file after it has been applied
- Delete a migration file
- Modify a schema and skip migration generation
- Apply schema changes directly in Supabase Studio without a migration file

---

## Query Helpers

All database access goes through typed query helpers in `src/db/queries/`. No inline Drizzle calls in routes or services.

```
src/db/queries/
  conversations.ts   # createConversation, getConversationById, listUserConversations
  messages.ts        # appendMessage, getMessagesByConversation
  assets.ts          # createAsset, getUserAssets
```

```ts
// src/db/queries/conversations.ts
import { db } from '@/db'
import { conversations } from '@/db/schema/conversations'
import { eq } from 'drizzle-orm'

export async function getConversationById(id: string): Promise<Conversation | null> {
  const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
  return row ?? null
}
```

---

## Supabase RLS

Row Level Security is configured in Supabase for **every table** before any data is written.

Standard RLS pattern for user-owned data:

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversations
CREATE POLICY "users_own_conversations"
ON conversations
USING (user_id = auth.uid());
```

Rules:
- Configure RLS in development, not only in production
- RLS is the last line of defense — it protects against bugs in auth middleware
- New tables get RLS before any application code uses them
- Document RLS policies in `docs/architecture/database-rls.md`

---

## Indexing

Add indexes for:
- All foreign key columns (Drizzle does not create these automatically)
- Columns used in `WHERE` clauses in frequent queries
- Columns used in `ORDER BY` for paginated queries

```ts
export const conversationsIndexes = index('conversations_user_id_idx').on(conversations.userId)
```

---

## Common Mistakes

- Writing inline `db.select()` calls in API routes — use query helpers
- Manually typing row interfaces instead of using Drizzle inference
- Skipping RLS on a new table because it "seems low risk"
- Modifying a migration file after it was applied
- Not specifying `onDelete` on foreign keys — causes silent orphan records

**See also:** `security.md`, `api-design.md`
