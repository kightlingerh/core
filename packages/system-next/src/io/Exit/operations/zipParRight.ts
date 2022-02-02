import { Cause } from "../../Cause"
import type { Exit } from "../definition"

/**
 * Parallelly zips the this result with the specified result discarding the
 * first element of the tuple or else returns the failed `Cause`.
 *
 *
 * @tsplus fluent ets/Exit zipParRight
 */
export function zipParRight_<E, E1, A, B>(
  self: Exit<E, A>,
  that: Exit<E1, B>
): Exit<E | E1, B> {
  return self.zipWith(that, (_, b) => b, Cause.both)
}

/**
 * Parallelly zips the this result with the specified result discarding the
 * first element of the tuple or else returns the failed `Cause`.
 *
 * @ets_data_first zipParRight_
 */
export function zipParRight<E1, B>(that: Exit<E1, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | E1, B> => self.zipParRight(that)
}
