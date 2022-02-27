import * as Iter from "../../../collection/immutable/Iterable"
import type { LazyArg } from "../../../data/Function"
import { Effect } from "../../Effect"
import { FiberRef } from "../../FiberRef"
import type { Managed } from "../definition"
import { ReleaseMap } from "../ReleaseMap"

/**
 * Merges an `Iterable<Managed<R, E, A>>` to a single `Managed<R, E, B>`,
 * working in parallel.
 *
 * Due to the parallel nature of this combinator, `f` must be both:
 *   - commutative: `f(a, b) == f(b, a)`
 *   - associative: `f(a, f(b, c)) == f(f(a, b), c)`
 *
 * @tsplus static ets/ManagedOps mergeAllPar
 */
export function mergeAllPar<R, E, A, B>(
  as: LazyArg<Iterable<Managed<R, E, A>>>,
  zero: LazyArg<B>,
  f: (b: B, a: A) => B,
  __tsplusTrace?: string
): Managed<R, E, B> {
  return ReleaseMap.makeManagedPar.mapEffect((parallelReleaseMap) =>
    Effect.mergeAllPar(
      Iter.map_(as(), (managed) => managed.effect.map((_) => _.get(1))),
      zero,
      f
    ).apply(FiberRef.currentReleaseMap.value.locally(parallelReleaseMap))
  )
}
