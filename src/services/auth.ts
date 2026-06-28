import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { AppError, ErrorCode } from '@/types/errors'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('[auth] getUser error:', error.message)
    return null
  }

  return data.user
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AppError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED, 401)
  }
  return user
}
