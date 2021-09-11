import * as FS from "fs"
import * as P from "path"

export function readFile(path: string) {
  return Effect.async<unknown, never, string>((cb) => {
    FS.readFile(path, (err, data) => {
      if (err) {
        cb(Effect.die(() => err))
      } else {
        cb(Effect.succeed(() => data.toString("utf-8")))
      }
    })
  })
}

export function readDir(path: string) {
  return Effect.async<unknown, never, Chunk<string>>((cb) => {
    FS.readdir(path, (err, data) => {
      if (err) {
        cb(Effect.die(() => err))
      } else {
        cb(Effect.succeed(() => Chunk.from(data)))
      }
    })
  })
}

function matchBuffer(source: string, target: string, start: number) {
  if (start + target.length > source.length) {
    return false
  }
  for (let i = 0; i < target.length; i++) {
    if (source[start + i] !== target[i]) {
      return false
    }
  }
  return true
}

export class SourceFile extends Data.Tagged("SourceFile")<{
  readonly path: string
  readonly text: string
  readonly dependencies: Chunk<SourceFile>
}> {}

export class Program extends Data.Tagged("Program")<{
  readonly sources: Chunk<SourceFile>
}> {}

export class Def extends Data.Tagged("Def")<{
  readonly line: number
  readonly col: number
}> {}

// TOKENS

export const T_DEF = "def"
export const T_NL = "\n"

class Cursor {
  constructor(readonly text: string, public pos = 0, public line = 0, public col = 0) {}

  forward(n: number) {
    const target = this.pos + n
    while (this.pos < this.text.length && this.pos < target) {
      if (matchBuffer(this.text, T_NL, this.pos)) {
        this.col = 0
        this.line += 1
      } else {
        this.col += 1
      }
      this.pos += 1
    }
  }

  match(target: string) {
    return matchBuffer(this.text, target, this.pos)
  }

  hasNext() {
    return this.pos < this.text.length
  }
}

export function parseSourceFile(path: string) {
  return Effect.gen(function* (_) {
    const text = new Cursor(yield* _(readFile(path)))

    while (text.hasNext()) {
      if (text.match(T_DEF)) {
        console.log(new Def({ col: text.col, line: text.line }))
        text.forward(1)
      } else {
        text.forward(1)
      }
    }

    return yield* _(
      Effect.succeed(
        () => new SourceFile({ dependencies: Chunk.empty(), path, text: text.text })
      )
    )
  })
}

export function isSourceFile(path: string) {
  return path.match(/^.*\.efs$/) !== null
}

export function parseRoot(path: string) {
  return Effect.gen(function* (_) {
    const files = (yield* _(readDir(path))).map((p) => P.join(path, p))
    const sources = yield* _(files.filter(isSourceFile).mapM(parseSourceFile))

    return yield* _(Effect.succeed(() => new Program({ sources })))
  })
}
