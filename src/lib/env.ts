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

type Env = z.infer<typeof envSchema>

const parsed = envSchema.safeParse(process.env)

// During the Next.js build phase, routes are analyzed but never executed.
// Skip the throw so the build can complete; missing vars will still cause
// runtime failures in actual server invocations.
if (!parsed.success && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error(
    `[env] Missing or invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
  )
}

export const env = (parsed.data ?? {}) as Env
