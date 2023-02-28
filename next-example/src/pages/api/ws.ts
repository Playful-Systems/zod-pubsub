import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'node:http';
import { Server as WSServer } from 'Socket.IO'
import { eventsPubSub, registerListeners } from '@/handlers';
import json from "superjson"

type CustomResponse = NextApiResponse & {
  socket: {
    server: Server & {
      io?: WSServer
    }
  }
}

registerListeners()

eventsPubSub.listenAll((data, event) => {
  console.log({event, data})
})

export default function handler(req: NextApiRequest, res: CustomResponse) {
  if (res.socket === null) {
    throw new Error('res.socket is null')
  }
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io')

    const io = new WSServer(res.socket.server)

    eventsPubSub.connect({
      onSendMessage: (data, event) => {
        console.log('onSendMessage', event)
        io.send("message", json.stringify({ event, data }))
      },
      onReceiveMessage: (publish, validate) => {
        io.on('connection', socket => {
          socket.on('message', msg => {
            console.log('onReceiveMessage', msg)
            const { event, data } = json.parse<{ event: string, data: any }>(msg)
            publish(validate(event), data)
          })
        })
      }
    })
    

    res.socket.server.io = io
  } else {
    console.log('socket.io already running')
  }
  res.end()
}

export const config = {
  api: {
    bodyParser: false
  }
}