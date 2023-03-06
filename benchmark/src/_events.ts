import { z } from "zod";


export const events = {
  foo: z.object({
    bar: z.string(),
  }),
  empty: z.object({}),
  oneArg: z.object({
    foo: z.string(),
  }),
  twoArgs: z.object({
    foo: z.string(),
    bar: z.string(),
  }),
  threeArgs: z.object({
    foo: z.string(),
    bar: z.string(),
    baz: z.string(),
  }),
  multi: z.object({
    foo: z.string().optional(),
    bar: z.string().optional(),
    baz: z.string().optional(),
  }).optional(),
  [`event:1`]: z.object({}),
  [`event:2`]: z.object({}),
  [`event:3`]: z.object({}),
  [`event:4`]: z.object({}),
  [`event:5`]: z.object({}),
  [`event:6`]: z.object({}),
  [`event:7`]: z.object({}),
  [`event:8`]: z.object({}),
  [`event:9`]: z.object({}),
  [`event:10`]: z.object({}),
}