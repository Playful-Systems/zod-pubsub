import { z } from "zod"

const schema = z.union([
  z.literal("all"),
  z.literal("important"),
  z.literal("zod")
]).default("all")

export const run = schema.parse(process.argv[2])

