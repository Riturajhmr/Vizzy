import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as usersSchema from './schema/users'
import * as conversationsSchema from './schema/conversations'
import * as assetsSchema from './schema/assets'
import * as workflowsSchema from './schema/workflows'

export const schema = {
  ...usersSchema,
  ...conversationsSchema,
  ...assetsSchema,
  ...workflowsSchema,
}

export type DrizzleDb = PostgresJsDatabase<typeof schema>

export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

let _db: DrizzleDb | null = null

function getDb(): DrizzleDb {
  if (!_db) {
    const url = process.env['DATABASE_URL']
    if (!url) {
      throw new Error('[db] DATABASE_URL is required — add it to .env.local')
    }
    // prepare: false is required for Supabase PgBouncer (transaction mode pooling)
    const sql = postgres(url, { prepare: false })
    _db = drizzle(sql, { schema })
  }
  return _db
}

export const db = new Proxy({} as DrizzleDb, {
  get: (_target, prop: string) => {
    const instance = getDb()
    return (instance as unknown as Record<string, unknown>)[prop]
  },
})
