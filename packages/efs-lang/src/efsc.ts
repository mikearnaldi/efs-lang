import { parseRoot } from "efs-lang/parser"
import * as P from "path"

const makeConsole = Effect.succeed(() => ({
  log: (s: string) => Effect.succeed(() => console.log(s))
}))

export interface Console extends _AOf<typeof makeConsole> {}

export const Console = Data.tag<Console>()

export const LiveConsole = makeConsole.toLayer(Console)

const rootDir = Effect.succeed(() => P.join(process.cwd(), process.argv[2]))

const main = Effect.gen(function* (_) {
  const root = yield* _(rootDir)
  const program = yield* _(parseRoot(root))

  yield* _(Effect.succeed(() => console.log(JSON.stringify(program))))
})

main.runMain()
