import { events, messageSchema } from "../shared/events"
import { pubSub } from "zod-pubsub"
import Axios from "axios"
import { z } from "zod"
import HowLongAgo from "@nwylynko/how-long-ago"

const { listen, publish, connect } = pubSub({
  events,
  validate: true
})

const axios = Axios.create({
  baseURL: 'http://localhost:4000'
})

const ws = new WebSocket('ws://localhost:4000')

connect({
  onSendMessage: (event, data) => {
    ws.send(JSON.stringify({ event, data }))
  },
  onReceiveMessage: (publish, validate) => {
    ws.onmessage = (message) => {
      const { event, data } = JSON.parse(message.data);
      publish(validate(event), data);
    };
  }
})

const messagesSchema = z.array(messageSchema)
const messagesDiv = document.getElementById('messages') as HTMLDivElement

if (!messagesDiv) {
  throw new Error('Could not find messages')
}

const createMessageItem = (message: z.infer<typeof messageSchema>) => {
  const container = document.createElement('div')
  container.className = 'item'

  const timestampSpan = document.createElement('span')
  timestampSpan.innerText = HowLongAgo(message.timestamp) + " | "
  container.appendChild(timestampSpan)

  const messageSpan = document.createElement('span')
  messageSpan.innerText = message.message
  container.appendChild(messageSpan)

  return container
}

if (window) {
  window.addEventListener('load', async () => {
    const result = await axios.get('/messages')
    const messages = await messagesSchema.parseAsync(result.data)
    const items = messages.map(message => {
      return createMessageItem(message)
    })
    messagesDiv.append(...items)
  })
}

listen("appendMessage", (newMessage) => {
  messagesDiv.appendChild(createMessageItem(newMessage))
})

const newMessageInput = document.getElementById('new-message') as HTMLInputElement
const newMessageButton = document.getElementById('new') as HTMLButtonElement

if (!newMessageButton || !newMessageInput) {
  throw new Error('Could not')
}

newMessageButton.addEventListener('click', () => {
  publish('newMessage', {
    message_id: crypto.randomUUID(),
    user_id: '456',
    message: newMessageInput.value,
    timestamp: Date.now()
  })
})

// updateMessageButton.addEventListener('click', () => {
//   publish('updateMessage', {
//     message_id: '123',
//     message: 'hello world!'
//   })
// })

// deleteMessageButton.addEventListener('click', () => {
//   publish('deleteMessage', {
//     message_id: '123'
//   })
// })