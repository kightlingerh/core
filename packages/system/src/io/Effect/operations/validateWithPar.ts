import type { LazyArg } from "../../../data/Function"
import { Cause } from "../../Cause"
import { Effect } from "../definition"

/**
 * Returns an effect that executes both this effect and the specified effect,
 * in parallel, combining their results with the specified `f` function. If
 * both sides fail, then the cause will be combined.
 *
 * @tsplus fluent ets/Effect validateWithPar
 */
export function validateWithPar_<R, E, A, R1, E1, B, C>(
  self: Effect<R, E, A>,
  that: LazyArg<Effect<R1, E1, B>>,
  f: (a: A, b: B) => C,
  __etsTrace?: string
): Effect<R & R1, E | E1, C> {
  return self
    .exit()
    .zipWithPar(that().exit(), (ea, eb) =>
      ea.zipWith(eb, f, (ca, cb) => Cause.both(ca, cb))
    )
    .flatMap((exit) => Effect.done(exit))
}

/**
 * Returns an effect that executes both this effect and the specified effect,
 * in parallel, combining their results with the specified `f` function. If
 * both sides fail, then the cause will be combined.
 *
 * @ets_data_first validateWithPar_
 */
export function validateWithPar<R1, E1, A, B, C>(
  that: LazyArg<Effect<R1, E1, B>>,
  f: (a: A, b: B) => C,
  __etsTrace?: string
) {
  return <R, E>(self: Effect<R, E, A>): Effect<R & R1, E | E1, C> =>
    self.validateWithPar(that, f)
}
