import * as O from "../../../data/Option"
import { Effect } from "../definition"

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * continue with the returned value.
 *
 * @tsplus fluent ets/Effect continueOrFailEffect
 */
export function continueOrFailEffect_<R, E, A, E1, R2, E2, A2>(
  self: Effect<R, E, A>,
  e: () => E1,
  pf: (a: A) => O.Option<Effect<R2, E2, A2>>,
  __etsTrace?: string
): Effect<R & R2, E | E1 | E2, A2> {
  return self.flatMap(
    (v): Effect<R2, E1 | E2, A2> => O.getOrElse_(pf(v), () => Effect.fail(e))
  )
}

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * continue with the returned value.
 *
 * @ets_data_first continueOrFailEffect_
 */
export function continueOrFailEffect<E1, A, R2, E2, A2>(
  e: () => E1,
  pf: (a: A) => O.Option<Effect<R2, E2, A2>>,
  __etsTrace?: string
) {
  return <R, E>(self: Effect<R, E, A>): Effect<R & R2, E | E1 | E2, A2> =>
    continueOrFailEffect_(self, e, pf)
}
