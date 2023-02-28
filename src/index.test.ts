import { it, vitest, expect } from "vitest";
import { z } from "zod";
import { pubSub } from ".";
import { EventEmitter } from "node:events"
import crypto from "node:crypto"

it("should listen to event", () => {
  const { listen, publish } = pubSub({
    events: {
      birthday: z.object({
        name: z.string(),
        age: z.number(),
      })
    },
    crypto
  })
  
  const listener = vitest.fn()

  listen("birthday", (data) => listener(data))

  publish("birthday", { name: "John", age: 20 })

  expect(listener).toHaveBeenCalledWith({ name: "John", age: 20 })
})

it("should wrap non typesafe event-emitters", () => {
  const { listen, publish, connect } = pubSub({
    events: {
      birthday: z.object({
        name: z.string(),
        age: z.number(),
      })
    },
    validate: true,
    crypto
  })

  const events = new EventEmitter()

  connect({
    onSendMessage: (payload, event) => {
      events.emit("message", { event, payload })
    },
    onReceiveMessage: (publish, validate) => {
      events.on("message", ({ event, payload }) => {
        publish(validate(event), payload)
      })
    }
  })
  
  // publishing from inside to out
  const message1 = vitest.fn()
  events.on("message", (message) => message1(message))
  publish("birthday", { name: "Bob", age: 25 })
  expect(message1).toHaveBeenCalledWith({ event: "birthday", payload: { name: "Bob", age: 25 }})
  events.off("message", message1)

  // listening inside from out
  const message2 = vitest.fn()
  const unSub = listen("birthday", (message) => message2(message))
  events.emit("message", { event: "birthday", payload: { name: "John", age: 20 }})
  expect(message2).toHaveBeenCalledWith({ name: "John", age: 20 })
  unSub()
  
})