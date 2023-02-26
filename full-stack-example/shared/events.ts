import { z } from "zod"

export const messageSchema = z.object({
  message_id: z.string(),
  user_id: z.string(),
  message: z.string(),
  timestamp: z.number(),
})

export const events = {
  newMessage: messageSchema, // from client to server
  appendMessage: messageSchema, // from server to client
  updateMessage: z.object({
    message_id: z.string(),
    message: z.string()
  }),
  deleteMessage: z.object({
    message_id: z.string(),
  }),
}