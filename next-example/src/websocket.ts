import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { io } from "socket.io-client";
import { pubSub } from "zod-pubsub"
import { events } from "@/events"
import { v4 as uuid } from "uuid"
import { z } from "zod";
import json from "superjson"

const eventsPubSub = pubSub({
  events,
  validate: true,
  crypto: {
    randomUUID: uuid
  }
})

const messageSchema = eventsPubSub.schemas.newMessage
const messagesSchema = z.array(messageSchema)

type Store = {
  connected: boolean
  publish: typeof eventsPubSub["publish"]
  messages: Map<string, z.infer<typeof messageSchema>>
}

eventsPubSub.listenAll((data, event) => {
  console.log({event, data})
})

const useWebsocketStore = create<Store>()(
  (set, get) => {
    (async () => {
      await fetch('http://localhost:3000/api/ws')
      const socket = io();

      socket.on("connect", () => {
        console.log("connected");
        set({ connected: true })
      })

      socket.on("disconnect", () => {
        console.log("disconnected");
        set({ connected: false })
      })

      eventsPubSub.connect({
        onSendMessage: (data, event) => {
          console.log('onSendMessage', event)
          socket.emit("message", json.stringify({ event, data }))
        },
        onReceiveMessage: (publish, validate) => {
          socket.on('message', (eventName, msg) => {
            console.log('onReceiveMessage', eventName, msg)
            const { event, data } = json.parse<{ event: string, data: any }>(msg)
            publish(validate(event), data)
          })
        }
      })
    })();
    (async () => {
      const response = await fetch("http://localhost:3000/api/messages")
      const messages = await messagesSchema.parseAsync(await response.json())
      set({ messages: new Map(messages.map(message => [message.message_id, message])) })
    })();
    (() => {
      eventsPubSub.listen("newMessage", (message) => {
        set(state => {
          const existing = state.messages.has(message.message_id)
          console.log({ existing })
          if (existing) return state
          const newSet = new Map(state.messages)
          newSet.set(message.message_id, message)
          console.log({ newSet })
          return { messages: newSet }
        })
      })
    })();
    return {
      connected: false,
      publish: eventsPubSub.publish,
      messages: new Map()
    }
  }
)

export const useOnline = () => useWebsocketStore(state => state.connected)
export const useActions = () => useWebsocketStore(state => ({ publish: state.publish }), shallow)
export const useMessages = () => {
  const messages = useWebsocketStore(state => state.messages)
  return Array.from(messages).map(([_, message]) => message).sort((a, b) => a.timestamp - b.timestamp)
}


// issues
// - [ ] maybe add a publishId, generated any time .publish is called
// use the publishId to dedupe publish requests 
// - [ ] use a queue system to make sure messages are sent in order
// alternatively some kind of async & await stuff
// - [x] convert messages array to a map