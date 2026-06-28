// Sanitize user input before injecting into AI prompts.
// Call at API route entry point — not inside prompt builders.
const MAX_INPUT_LENGTH = 4000

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, MAX_INPUT_LENGTH)
}
