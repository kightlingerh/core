import type { Exit } from "../../Exit"
import { Effect } from "../definition"

/**
 * Ensures that a cleanup functions runs, whether this effect succeeds, fails,
 * or is interrupted.
 *
 * @tsplus fluent ets/Effect onExit
 */
export function onExit_<R, E, A, R2, E2, X>(
  self: Effect<R, E, A>,
  cleanup: (exit: Exit<E, A>) => Effect<R2, E2, X>,
  __tsplusTrace?: string
): Effect<R & R2, E | E2, A> {
  return Effect.unit.acquireReleaseExitWith(
    () => self,
    (_, exit) => cleanup(exit)
  )
}

/**
 * Ensures that a cleanup functions runs, whether this effect succeeds, fails,
 * or is interrupted.
 *
 * @ets_data_first onExit_
 */
export function onExit<E, A, R2, E2, X>(
  cleanup: (exit: Exit<E, A>) => Effect<R2, E2, X>,
  __tsplusTrace?: string
) {
  ;<R>(self: Effect<R, E, A>): Effect<R & R2, E | E2, A> => self.onExit(cleanup)
}
