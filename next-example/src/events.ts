import { z } from "zod"

export const events = {
  newMessage: z.object({
    message_id: z.string(),
    user_id: z.string(),
    message: z.string(),
    timestamp: z.number(),
  }),
  updateMessage: z.object({
    message_id: z.string(),
    message: z.string()
  }),
  deleteMessage: z.object({
    message_id: z.string(),
  }),
}