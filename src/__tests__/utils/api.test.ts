import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { parseRequestBody } from '@/utils/api'

const TestSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
})

function makeRequest(body: unknown, contentType = 'application/json'): Request {
  return new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: JSON.stringify(body),
  })
}

function makeMalformedRequest(): Request {
  return new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid json',
  })
}

describe('parseRequestBody', () => {
  it('returns parsed data for valid JSON matching the schema', async () => {
    const req = makeRequest({ name: 'Alice', age: 30 })
    const result = await parseRequestBody(req, TestSchema)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ name: 'Alice', age: 30 })
  })

  it('returns a 400 Response for malformed JSON', async () => {
    const req = makeMalformedRequest()
    const result = await parseRequestBody(req, TestSchema)

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Response)
    expect(result.error?.status).toBe(400)
  })

  it('returns a 422 Response for valid JSON that fails schema validation', async () => {
    const req = makeRequest({ name: '', age: -1 })
    const result = await parseRequestBody(req, TestSchema)

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Response)
    expect(result.error?.status).toBe(422)
  })

  it('includes validation issues in the 422 response body', async () => {
    const req = makeRequest({ name: '', age: -1 })
    const result = await parseRequestBody(req, TestSchema)

    const body = await result.error?.json()
    expect(body.meta.issues).toBeDefined()
    expect(Array.isArray(body.meta.issues)).toBe(true)
    expect(body.meta.issues.length).toBeGreaterThan(0)
  })

  it('error field is a Response instance so callers can return it directly', async () => {
    const req = makeMalformedRequest()
    const result = await parseRequestBody(req, TestSchema)

    // Route handler pattern: if (result.error) return result.error
    expect(result.error).toBeInstanceOf(Response)
  })

  it('handles missing required fields', async () => {
    const req = makeRequest({ name: 'Alice' })
    const result = await parseRequestBody(req, TestSchema)

    expect(result.data).toBeNull()
    expect(result.error?.status).toBe(422)
  })
})
