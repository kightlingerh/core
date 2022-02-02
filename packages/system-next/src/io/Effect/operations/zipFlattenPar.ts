import type { MergeTuple } from "../../../collection/immutable/Tuple"
import { Tuple } from "../../../collection/immutable/Tuple"
import type { LazyArg } from "../../../data/Function"
import type { Effect } from "../definition"

/**
 * Sequentially zips this effect with the specified effect
 *
 * @tsplus operator ets/Effect &
 * @tsplus fluent ets/Effect zipFlattenPar
 */
export function zipFlattenPar_<R, E, A, R2, E2, A2>(
  self: Effect<R, E, A>,
  that: LazyArg<Effect<R2, E2, A2>>,
  __etsTrace?: string
): Effect<R & R2, E | E2, MergeTuple<A, A2>> {
  return self.zipWithPar(that, Tuple.mergeTuple)
}

/**
 * Sequentially zips this effect with the specified effect
 *
 * @ets_data_first zipFlattenPar_
 */
export function zipFlattenPar<R2, E2, A2>(
  that: LazyArg<Effect<R2, E2, A2>>,
  __etsTrace?: string
) {
  return <R, E, A>(self: Effect<R, E, A>): Effect<R & R2, E | E2, MergeTuple<A, A2>> =>
    self.zipFlattenPar(that)
}
