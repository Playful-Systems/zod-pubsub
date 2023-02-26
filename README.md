# zod-pubsub
A Publisher -> Subscriber module using Zod schemas to add full typesafety

## Install
```bash
pnpm add zod-pubsub
```

## Use
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

### Inspired by
https://www.youtube.com/watch?v=aKTSC4D1GL8
https://twitter.com/mattpocockuk