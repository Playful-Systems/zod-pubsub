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
    }
  })
  
  const listener = vitest.fn()

  listen("birthday", listener)

  publish("birthday", { name: "John", age: 20 })

  expect(listener).toHaveBeenCalledWith({ name: "John", age: 20 }, "birthday")
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
    onSendMessage: (event, payload) => {
      events.emit("message", { event, payload })
    },
    onReceiveMessage: (publish, validate) => {
      events.on("message", ({ event, payload }) => {
        publish(validate(event), payload)
      })
    }
  })
  
  // from typesafe to non typesafe
  const message1 = vitest.fn()
  events.on("message", message1)
  publish("birthday", { name: "Bob", age: 25 })
  expect(message1).toHaveBeenCalledWith({ event: "birthday", payload: { name: "Bob", age: 25 }})
  events.off("message", message1)

  // from non typesafe to typesafe (validating input)
  const message2 = vitest.fn()
  const unSub = listen("birthday", message2)
  events.emit("message", { event: "birthday", payload: { name: "John", age: 20 }})
  expect(message2).toHaveBeenCalledWith({ name: "John", age: 20 }, "birthday")
  unSub()
  
})