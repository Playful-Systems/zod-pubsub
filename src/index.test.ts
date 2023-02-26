import { it, vitest, expect } from "vitest";
import { z } from "zod";
import { pubSub } from ".";

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