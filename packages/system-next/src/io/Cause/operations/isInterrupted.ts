import { Option } from "../../../data/Option/core"
import type { Cause } from "../definition"

/**
 * Determines if the `Cause` contains an interruption.
 *
 * @ets fluent ets/Cause isInterrupted
 */
export function isInterrupted<E>(self: Cause<E>): boolean {
  return self
    .find((cause) => (cause.isInterruptType() ? Option.some(undefined) : Option.none))
    .isSome()
}
