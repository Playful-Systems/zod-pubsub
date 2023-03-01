import { z } from "zod"

// this gets imported in the client and server
// to ensure that the events are the same
// so don't import or put anything here that won't work in both environments

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