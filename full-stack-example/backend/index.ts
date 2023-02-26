import { SQL } from 'sql-template-strings';
import { events, messageSchema } from "../shared/events"
import { pubSub } from "zod-pubsub"
import crypto from "crypto"
import { WebSocketServer, type WebSocket } from "ws"
import { query, run } from "./database"
import { createServer } from 'http';
import { z } from 'zod';

const { listen, publish, connect } = pubSub({
  events,
  validate: true,
  crypto
})

const messagesSchema = z.array(messageSchema)

const server = createServer(async (req, res) => {
  if (req.url === '/messages') {

    const headers = {
      'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
      'Access-Control-Max-Age': 2592000, // 30 days
      'Content-Type': 'application/json'
    };
  

    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const result = await query(SQL`
        SELECT * FROM messages
      `);
      const messages = await messagesSchema.parseAsync(result);
      res.writeHead(200, headers);
      res.end(JSON.stringify(messages));
      return;
    }

    res.statusCode = 404;
    res.end();

  }
});

const wss = new WebSocketServer({
  server,
});

const connections = new Map<string, WebSocket>();

connect({
  onSendMessage: (event, data) => {
    connections.forEach((socket) => {
      console.log('onSendMessage', event)
      if (!socket.OPEN) return;
      socket.send(JSON.stringify({ event, data }))
    })
  },
  onReceiveMessage: (publish, validate) => {
    wss.on('connection', (ws) => {
      ws.on('error', console.error);
    
      const conn_id = crypto.randomUUID();
      console.log('New connection!', conn_id)
      connections.set(conn_id, ws);
    
      ws.on('message', (message) => {
        console.log('received: %s', message);
        const { event, data } = JSON.parse(message.toString());
        publish(validate(event), data);
      });

      ws.on('close', () => {
        console.log('connection closed')
        connections.delete(conn_id);
      });
    });
    return () => wss.close()
  }
})

server.listen(4000)
console.log(`Listening on port 4000`)

// Receive callbacks for new messages on the subscription
listen('newMessage', (newMessage) => {
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
  publish("appendMessage", newMessage)
})
listen('updateMessage', (updateMessage) => {
  console.log({updateMessage});
  run(SQL`
    UPDATE messages
    SET message = ${updateMessage.message}
    WHERE message_id = ${updateMessage.message_id}
  `)
})
listen('deleteMessage', (deleteMessage) => {
  console.log({deleteMessage});
  run(SQL`
    DELETE FROM messages
    WHERE message_id = ${deleteMessage.message_id}
  `)
})
