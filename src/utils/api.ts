import type { ZodSchema } from 'zod'

type ParseResult<T> =
  | { data: T; error: null }
  | { data: null; error: Response }

export async function parseRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return {
      data: null,
      error: Response.json({ data: null, error: 'Invalid JSON' }, { status: 400 }),
    }
  }

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return {
      data: null,
      error: Response.json(
        { data: null, error: 'Invalid request', meta: { issues: parsed.error.issues } },
        { status: 422 },
      ),
    }
  }

  return { data: parsed.data, error: null }
}
