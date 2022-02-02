import type { Chunk } from "../definition"
import { concreteId } from "../definition"

/**
 * Determines if the chunk is empty.
 *
 * @tsplus fluent ets/Chunk isEmpty
 */
export function isEmpty<A>(self: Chunk<A>): boolean {
  return concreteId(self).length === 0
}
