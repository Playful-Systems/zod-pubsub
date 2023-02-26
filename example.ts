import { z } from "zod"
import { pubSub, type inferEvents } from "./src"

const auth = pubSub({
  events: {
    LOG_IN: z.object({
      username: z.string(),
      password: z.string(),
    }),
    LOG_OUT: z.object({}),
    REFRESH: z.object({
      token: z.string()
    }),
  },
  validate: true,
})

auth.listen("LOG_IN", (details) => {
  console.log("user is logging in")
  console.log(details)
})

const unSubLogout = auth.listen("LOG_OUT", () => {
  console.log("user is logging out")
})

auth.listenAll((event, name) => {
  console.info(`[all] event ${name} was published`)
})

auth.listenMany(["LOG_IN", "LOG_OUT"], (event, name) => {
  console.info(`[many] event ${name} was published`)
})

auth.publish("LOG_IN", { username: "admin", password: "password" })
auth.publish("REFRESH", { token: "123" })
auth.publish("LOG_OUT", {})
unSubLogout();
auth.publish("LOG_OUT", {})


type events = inferEvents<typeof auth>