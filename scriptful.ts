import { command, parallel, scripts, sequential } from "scriptful"

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
  "new-version": "changeset",
  "benchmark": sequential([
    command({
      run: "tsc",
      cwd: "benchmark"
    }),
    runBench('add-remove'),
    runBench('context'),
    runBench('emit-multiple-listeners'),
    runBench('emit'),
    runBench('hundreds'),
    runBench('init'),
    runBench('once'),
  ])
})

function runBench(name: string) {
  return command({
    run: `node dist/${name}.js`,
    cwd: "benchmark"
  })
}