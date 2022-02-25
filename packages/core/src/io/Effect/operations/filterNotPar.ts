import type { Chunk } from "../../../collection/immutable/Chunk"
import { Effect } from "../definition"

/**
 * Filters the collection in parallel using the specified effectual predicate.
 * See `filterNot` for a sequential version of it.
 *
 * @tsplus static ets/EffectOps filterNotPar
 */
export function filterNotPar_<A, R, E>(
  as: Iterable<A>,
  f: (a: A) => Effect<R, E, boolean>,
  __tsplusTrace?: string
): Effect<R, E, Chunk<A>> {
  return Effect.filterPar(as, (x) => f(x).map((b) => !b))
}

/**
 * Filters the collection in parallel using the specified effectual predicate.
 * See `filterNot` for a sequential version of it.
 *
 * @ets_data_first filterNotPar_
 */
export function filterNotPar<A, R, E>(
  f: (a: A) => Effect<R, E, boolean>,
  __tsplusTrace?: string
) {
  return (as: Iterable<A>): Effect<R, E, Chunk<A>> => Effect.filterNotPar(as, f)
}
