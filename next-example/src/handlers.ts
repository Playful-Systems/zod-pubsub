
import SQL from "sql-template-strings";
import { run } from "./database";
import { pubSub } from "zod-pubsub"
import { events } from "./events"
import { v4 as uuid } from "uuid"

export const eventsPubSub = pubSub({
  events,
  validate: true,
  crypto: {
    randomUUID: uuid
  }
})

export const registerListeners = () => {
  eventsPubSub.listen('newMessage', (newMessage, _, listenerId) => {
    console.log({newMessage});
    run(SQL`
      INSERT INTO messages (
        message_id, 
        user_id, 
        message, 
        timestamp
        )
      VALUES (
        ${newMessage.message_id},
        ${newMessage.user_id},
        ${newMessage.message}, 
        ${newMessage.timestamp}
      )
    `)
    eventsPubSub.publish("newMessage", newMessage, { listenerId })
  })
  
  eventsPubSub.listen('updateMessage', (updateMessage) => {
    console.log({updateMessage});
    run(SQL`
      UPDATE messages
      SET message = ${updateMessage.message}
      WHERE message_id = ${updateMessage.message_id}
    `)
  })
  
  eventsPubSub.listen('deleteMessage', (deleteMessage) => {
    console.log({deleteMessage});
    run(SQL`
      DELETE FROM messages
      WHERE message_id = ${deleteMessage.message_id}
    `)
  })
}

