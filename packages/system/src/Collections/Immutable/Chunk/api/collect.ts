// ets_tracing: off

import * as O from "../../../../Option/index.js"
import * as Chunk from "../core.js"
import * as ChunkDef from "../definition.js"

/**
 * Returns a filtered, mapped subset of the elements of this chunk.
 */
export function collect_<A, B>(
  self: Chunk.Chunk<A>,
  f: (a: A) => O.Option<B>
): Chunk.Chunk<B> {
  ChunkDef.concrete(self)

  switch (self._typeId) {
    case ChunkDef.ArrTypeId: {
      const array = self.arrayLike()
      let dest = Chunk.empty<B>()
      for (let i = 0; i < array.length; i++) {
        const rhs = f(array[i]!)
        if (O.isSome(rhs)) {
          dest = Chunk.append_(dest, rhs.value)
        }
      }
      return dest
    }
    default: {
      return collect_(self.materialize(), f)
    }
  }
}

/**
 * Returns a filtered, mapped subset of the elements of this chunk.
 *
 * @ets_data_first collect_
 */
export function collect<A, B>(
  f: (a: A) => O.Option<B>
): (self: Chunk.Chunk<A>) => Chunk.Chunk<B> {
  return (self) => collect_(self, f)
}
