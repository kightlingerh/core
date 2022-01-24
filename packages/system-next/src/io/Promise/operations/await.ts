import * as E from "../../../data/Either"
import type { IO } from "../../Effect"
import { asyncInterruptBlockingOn } from "../../Effect/operations/asyncInterrupt"
import type { Promise } from ".."
import { Pending } from "../_internal/state"
import { interruptJoiner_ } from "./interruptJoiner"

function wait<E, A>(self: Promise<E, A>, __trace?: string): IO<E, A> {
  return asyncInterruptBlockingOn(
    (k) => {
      const state = self.state.get

      switch (state._tag) {
        case "Done": {
          return E.right(state.value)
        }
        case "Pending": {
          self.state.set(new Pending([k, ...state.joiners]))
          return E.left(interruptJoiner_(self, k))
        }
      }
    },
    self.blockingOn,
    __trace
  )
}

export { wait as await }
