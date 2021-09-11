import {} from "@effect-ts/fluent/Extensions"
import {} from "@effect-ts/fluent/Prelude"
import {} from "@effect-ts/fluent-node/Extensions"

declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
      equals(b: unknown): void
    }
  }
}
