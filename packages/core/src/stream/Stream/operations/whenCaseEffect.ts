import type { LazyArg } from "../../../data/Function"
import type { Option } from "../../../data/Option"
import type { Effect } from "../../../io/Effect"
import { Stream } from "../definition"

/**
 * Returns the resulting stream when the given partial function is defined
 * for the given effectful value, otherwise returns an empty stream.
 *
 * @tsplus static ets/StreamOps whenCaseEffect
 */
export function whenCaseEffect<R, E, A, R1, E1, A1>(
  a: LazyArg<Effect<R, E, A>>,
  pf: (a: A) => Option<Stream<R1, E1, A1>>,
  __tsplusTrace?: string
): Stream<R & R1, E | E1, A1> {
  return Stream.fromEffect(a()).flatMap((a) => pf(a).getOrElse(Stream.empty))
}
