import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

// Import after mocks are set up
const { getCurrentUser, requireCurrentUser } = await import('@/services/auth')
const { AppError, ErrorCode } = await import('@/types/errors')

const fakeUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the user when getUser succeeds', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null })

    const user = await getCurrentUser()
    expect(user).toEqual(fakeUser)
  })

  it('returns null when getUser returns a Supabase error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' },
    })

    const user = await getCurrentUser()
    expect(user).toBeNull()
  })

  it('returns null when getUser returns no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const user = await getCurrentUser()
    expect(user).toBeNull()
  })
})

describe('requireCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the user when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null })

    const user = await requireCurrentUser()
    expect(user).toEqual(fakeUser)
  })

  it('throws AppError with 401 and AUTHENTICATION_REQUIRED when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(requireCurrentUser()).rejects.toThrow(AppError)

    try {
      await requireCurrentUser()
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      const appErr = err as InstanceType<typeof AppError>
      expect(appErr.statusCode).toBe(401)
      expect(appErr.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED)
    }
  })
})
