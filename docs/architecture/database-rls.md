# Database Row Level Security (RLS) Policies

RLS is configured on every table before application code writes to it. It is the last line of
defense — it protects data even if the auth middleware has a bug.

Apply these policies in the Supabase SQL editor or as a migration before first use.

---

## Drizzle server-side writes and RLS

`DATABASE_URL` connects as the Postgres service role (bypasses RLS by design). This is
correct for trusted server-side operations (user upsert on OAuth callback, etc.). RLS
protects against direct Supabase client access using the anon/user JWT.

---

## `users` table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own row
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- INSERT is handled server-side via service role (OAuth callback upsert).
-- No client-side INSERT policy needed.
```

---

## `conversations` table

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_user_isolation"
  ON conversations FOR ALL
  USING (user_id = auth.uid());
```

---

## `messages` table

Messages do not carry a `user_id` directly — they are scoped through their conversation.

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_user_isolation"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

---

## `assets` table

```sql
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_user_isolation"
  ON assets FOR ALL
  USING (user_id = auth.uid());
```

---

## `workflow_executions` table

```sql
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_executions_user_isolation"
  ON workflow_executions FOR ALL
  USING (user_id = auth.uid());
```

---

## Verification

After applying:

```sql
-- Confirm RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All rows should show `rowsecurity = true`.
