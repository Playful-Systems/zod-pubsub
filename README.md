# zod-pubsub
A Publisher -> Subscriber module using Zod schemas to add full typesafety

## Install
```bash
pnpm add zod-pubsub
```

## Use

Simple
```ts
import { z } from "zod"
import { pubSub } from "zod-pubsub"

const auth = pubSub({
  events: {
    LOG_IN: z.object({
      username: z.string(),
      password: z.string(),
    }),
    LOG_OUT: z.object({}),
  }
})

auth.listen("LOG_IN", (details) => {
  console.log("user is logging in")
  console.log(details)
})

auth.publish("LOG_IN", { username: "admin", password: "password" })
```

Advanced
```ts
// here we are wrapping a websocket server with the pubsub module
// this allows us to use the pubsub module to send and receive messages
// so we have a typesafe way to send and receive messages
// the events object could be in a separate file and imported into both the client and server
// but a separate .connect() function would be needed on the client to send & receive messages

import { z } from "zod"
import { pubSub } from "zod-pubsub";
import crypto from "crypto"
import { WebSocketServer, type WebSocket } from 'ws';

// Create a websocket server
const wss = new WebSocketServer({
  port: 8080,
});

// define the events that can be sent and received
const messages = pubSub({
  events: {
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
  },
  validate: true, // does runtime validation of the data, can be disabled for performance
  crypto // the module is crypto agnostic, you can use any module that has a randomUUID() function
});

// store the active connections
const connections = new Map<string, WebSocket>();

messages.connect({

  // called when a message is published on the server
  onSendMessage: (data, event) => {
    
    // send the message to all active connections
    connections.forEach((socket) => {

      if (!socket.OPEN) return;

      // send the event and data to the client
      // if you only want to send to specific clients, add a field to the data object
      // for example every event might store a user_id, and using a map that stores the user_id to connection id
      // you can then send to specific clients
      socket.send(JSON.stringify({ event, data }))
    })
  },
  onReceiveMessage: (publish, validate) => {

    // whenever a new connection is made
    wss.on('connection', (ws) => {
      ws.on('error', console.error);
    
      // generate a unique id for the connection
      const conn_id = crypto.randomUUID();
      console.log('New connection!', conn_id)
      // store the connection for later to send messages
      connections.set(conn_id, ws);
    
      // whenever a message is received
      ws.on('message', (message) => {

        // parse the message, don't worry about validating it as the pubsub module will do that for you
        const { event, data } = JSON.parse(message.toString());

        // publish the message to the pubsub module
        // validate() will ensure the event name is valid
        publish(validate(event), data);
      });

      // when the connection is closed, remove it from the active connections
      ws.on('close', () => {
        console.log('connection closed')
        connections.delete(conn_id);
      });
    });
  }
})

// Receive callbacks for new messages on the subscription
// for example update the database
messages.listen('newMessage', (newMessage) => {
  console.log({newMessage});
})
messages.listen('updateMessage', (updateMessage) => {
  console.log({updateMessage});
})
messages.listen('deleteMessage', (deleteMessage) => {
  console.log({deleteMessage});
})
```

### Inspired by
https://www.youtube.com/watch?v=aKTSC4D1GL8
https://twitter.com/mattpocockuk