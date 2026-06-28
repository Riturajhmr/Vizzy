import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[api/auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    return NextResponse.redirect(`${origin}/app`)
  } catch (error) {
    console.error('[api/auth/callback] Unexpected error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }
}
