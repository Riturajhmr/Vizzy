import { describe, it, expect } from 'vitest'
import { sanitizeUserInput } from '@/utils/sanitize'

describe('sanitizeUserInput', () => {
  it('passes clean input through unchanged', () => {
    expect(sanitizeUserInput('Hello, world!')).toBe('Hello, world!')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeUserInput('')).toBe('')
  })

  it('strips HTML tag markers, leaving inner text', () => {
    // The regex removes <tag> markers; inner content between tags is preserved.
    // This prevents HTML injection while keeping readable text.
    expect(sanitizeUserInput('<script>alert(1)</script>text')).toBe('alert(1)text')
  })

  it('strips nested HTML tags', () => {
    expect(sanitizeUserInput('<b><i>text</i></b>')).toBe('text')
  })

  it('strips self-closing tags', () => {
    expect(sanitizeUserInput('image<br/>here')).toBe('imagehere')
  })

  it('removes null character (\\x00)', () => {
    expect(sanitizeUserInput('\x00hello')).toBe('hello')
  })

  it('removes unit separator control character (\\x1F)', () => {
    expect(sanitizeUserInput('hello\x1Fworld')).toBe('helloworld')
  })

  it('removes DEL character (\\x7F)', () => {
    expect(sanitizeUserInput('hello\x7Fworld')).toBe('helloworld')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeUserInput('  hello  ')).toBe('hello')
  })

  it('truncates input at 4000 characters', () => {
    const long = 'a'.repeat(4001)
    const result = sanitizeUserInput(long)
    expect(result.length).toBe(4000)
  })

  it('does not truncate input at exactly 4000 characters', () => {
    const exact = 'a'.repeat(4000)
    expect(sanitizeUserInput(exact).length).toBe(4000)
  })
})
