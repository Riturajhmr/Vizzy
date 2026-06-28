import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

// Phase 1A: log errors but do not throw — dev server starts without real credentials.
// Remove this guard before Phase 2 when AI/DB access begins.
if (!parsed.success) {
  console.error('[env] Missing or invalid environment variables:', parsed.error.flatten().fieldErrors)
}

export const env = (parsed.success ? parsed.data : {}) as z.infer<typeof envSchema>
