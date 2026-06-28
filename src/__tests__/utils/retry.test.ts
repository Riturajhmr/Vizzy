import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withRetry } from '@/utils/retry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the value on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on a 429 transient error and succeeds on second attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValueOnce('ok')

    const promise = withRetry(fn)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on 503 and 504 errors', async () => {
    const fn503 = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce('ok')
    const promise503 = withRetry(fn503)
    await vi.runAllTimersAsync()
    await expect(promise503).resolves.toBe('ok')

    const fn504 = vi
      .fn()
      .mockRejectedValueOnce({ status: 504 })
      .mockResolvedValueOnce('ok')
    const promise504 = withRetry(fn504)
    await vi.runAllTimersAsync()
    await expect(promise504).resolves.toBe('ok')
  })

  it('does NOT retry on 400 (non-transient) and throws immediately', async () => {
    const err = { status: 400 }
    const fn = vi.fn().mockRejectedValue(err)

    await expect(withRetry(fn)).rejects.toEqual(err)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry on 403 (non-transient)', async () => {
    const err = { status: 403 }
    const fn = vi.fn().mockRejectedValue(err)

    await expect(withRetry(fn)).rejects.toEqual(err)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('exhausts max attempts with persistent 429 and throws', async () => {
    const err = { status: 429 }
    const fn = vi.fn().mockRejectedValue(err)

    // Attach .catch immediately to prevent unhandled rejection during timer runs
    const promise = withRetry(fn, 3)
    const caught = promise.catch((e: unknown) => e)

    await vi.runAllTimersAsync()

    const result = await caught
    expect(result).toEqual(err)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('uses exponential backoff delays (500ms, 1000ms)', async () => {
    const err = { status: 429 }
    const fn = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce('ok')

    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    const promise = withRetry(fn, 3)
    await vi.runAllTimersAsync()
    await promise

    const delays = setTimeoutSpy.mock.calls.map((call) => call[1])
    expect(delays).toContain(500)
    expect(delays).toContain(1000)
  })
})
