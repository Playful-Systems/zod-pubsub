"use client"
import { Inter } from '@next/font/google'
import { useActions, useMessages, useOnline } from '../websocket'
import { useForm } from "react-hook-form"
import { v4 as uuid } from "uuid"
import HowLongAgo from "@nwylynko/how-long-ago"

const inter = Inter({ subsets: ['latin'] })

type FormData = {
  message: string;
};

export default function Home() {

  const connected = useOnline();
  const { publish } = useActions();
  const messages = useMessages();
  const { register, handleSubmit, setValue } = useForm<FormData>();

  const onSubmit = handleSubmit((form) => {
    publish("newMessage", {
      message_id: uuid(),
      user_id: uuid(),
      message: form.message,
      timestamp: Date.now()
    });
    setValue("message", "")
  })

  return (
    <main className={inter.className}>
      <h1 className="text-2xl m-2">Next.js Example</h1>
      <p>Connected: {connected ? 'True' : 'False'}</p>
      <div>
        {messages.map((message) => (
          <div key={message.message_id} className="grid grid-cols-[125px_auto] gap-2">
            <span className="text-sm text-zinc-400">{HowLongAgo(message.timestamp)}</span>
            <span>{message.message}</span>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit}>
        <input type="text" {...register("message")}  className="border-2 border-black m-2 p-2 rounded-xl" />
        <button type="submit" className="border-2 border-black m-2 p-2 rounded-xl">Submit</button>
      </form>
    </main>
  )
}
