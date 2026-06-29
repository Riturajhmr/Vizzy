import { z } from 'zod'

// Discriminated union — adding a new intent requires adding a branch here
// and updating the intent detection prompt (src/ai/prompts/intent-detection.v1.ts).
export const intentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image-generation'),
    description: z.string().min(1),
    style: z.string().optional(),
    mood: z.string().optional(),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('image-editing'),
    description: z.string().min(1),
    editType: z
      .enum(['style-transfer', 'background-removal', 'color-adjustment', 'object-removal', 'general'])
      .optional(),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('poster-creation'),
    description: z.string().min(1),
    headline: z.string().optional(),
    style: z.string().optional(),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('story-generation'),
    description: z.string().min(1),
    genre: z.string().optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('refinement'),
    description: z.string().min(1),
    direction: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('conversation'),
    description: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('unknown'),
    description: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }),
])

export type Intent = z.infer<typeof intentSchema>
export type IntentType = Intent['type']
