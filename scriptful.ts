import { parallel, scripts, sequential } from "scriptful"

export default scripts({
  build: "microbundle",
  dev: parallel([
    "microbundle watch",
    "vitest"
  ]),
  typecheck: "tsc --noEmit",
  test: "vitest run",
  release: sequential([
    parallel([
      "pnpm run typecheck",
      "pnpm run test",
      "pnpm run build"
    ]),
    "changeset publish"
  ]),
  "new-version": "changeset"
})