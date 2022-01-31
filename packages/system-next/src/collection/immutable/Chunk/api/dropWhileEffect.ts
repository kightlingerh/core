import { Effect } from "../../../../io/Effect/definition"
import { concreteId } from "../_definition"
import * as Chunk from "../core"

/**
 * Drops all elements so long as the predicate returns true.
 */
export function dropWhileEffect_<R, E, A>(
  self: Chunk.Chunk<A>,
  f: (a: A) => Effect<R, E, boolean>,
  __etsTrace?: string
): Effect<R, E, Chunk.Chunk<A>> {
  return Effect.suspendSucceed(() => {
    const iterator = concreteId(self).arrayLikeIterator()
    let next
    let dropping: Effect<R, E, boolean> = Effect.succeedNow(true)
    let builder = Chunk.empty<A>()

    while ((next = iterator.next()) && !next.done) {
      const array = next.value
      const len = array.length
      let i = 0
      while (i < len) {
        const a = array[i]!
        dropping = dropping.flatMap((d) =>
          (d ? f(a) : Effect.succeedNow(false)).map((b) => {
            if (!b) {
              builder = Chunk.append_(builder, a)
            }
            return b
          })
        )
        i++
      }
    }
    return dropping.map(() => builder)
  })
}

/**
 * Drops all elements so long as the predicate returns true.
 *
 * @ets_data_first dropWhileEffect_
 */
export function dropWhileEffect<R, E, A>(
  f: (a: A) => Effect<R, E, boolean>,
  __etsTrace?: string
): (self: Chunk.Chunk<A>) => Effect<R, E, Chunk.Chunk<A>> {
  return (self) => dropWhileEffect_(self, f)
}
