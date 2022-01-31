import { compact as chunkCompact } from "../../../collection/immutable/Chunk/api/compact"
import type { Chunk } from "../../../collection/immutable/Chunk/core"
import type { LazyArg } from "../../../data/Function"
import type { Option } from "../../../data/Option"
import { Managed } from "../definition"

/**
 * Evaluate each effect in the structure from left to right, collecting the
 * the successful values and discarding the empty cases. For a parallel version,
 * see `collectPar`.
 *
 * @ets static ets/ManagedOps collect
 */
export function collect<A, R, E, B>(
  as: LazyArg<Iterable<A>>,
  f: (a: A) => Managed<R, Option<E>, B>,
  __etsTrace?: string
): Managed<R, E, Chunk<B>> {
  return Managed.forEach(as, (a) => f(a).unsome()).map(chunkCompact)
}
