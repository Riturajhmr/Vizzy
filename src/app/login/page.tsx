import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6">
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg"
          aria-hidden="true"
        >
          <span className="text-2xl font-bold text-primary-foreground">V</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in to Vizzy</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            Your conversational creative operating system. Auth coming in Phase 2.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button disabled className="w-full">
          Continue with Google
        </Button>
        <Button variant="outline" disabled className="w-full">
          Continue with email
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Authentication is not yet available in this demo.
      </p>
    </div>
  )
}
