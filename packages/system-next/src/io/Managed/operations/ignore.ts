import { constVoid } from "../../../data/Function"
import type { Managed } from "../definition"

/**
 * Returns a new effect that ignores the success or failure of this effect.
 *
 * @ets fluent ets/Managed ignore
 */
export function ignore<R, E, A>(
  self: Managed<R, E, A>,
  __etsTrace?: string
): Managed<R, never, void> {
  return self.fold(constVoid, constVoid)
}
