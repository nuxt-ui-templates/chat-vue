import { z } from 'zod'

// Users only send text, reasoning and tool parts come from the model
export const userMessageSchema = z.object({
  id: z.string().optional(),
  role: z.literal('user'),
  parts: z.array(z.object({ type: z.literal('text'), text: z.string() }))
})
