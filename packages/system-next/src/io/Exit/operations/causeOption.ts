import { Option } from "../../../data/Option"
import type { Cause } from "../../Cause"
import type { Exit } from "../definition"

/**
 * Returns an option of the cause of failure.
 */
export function causeOption<E, A>(self: Exit<E, A>): Option<Cause<E>> {
  switch (self._tag) {
    case "Failure":
      return Option.some(self.cause)
    case "Success":
      return Option.none
  }
}
