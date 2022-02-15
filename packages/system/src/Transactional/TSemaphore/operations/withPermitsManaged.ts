// ets_tracing: off

import * as M from "../../../Managed/index.js"
import * as STM from "../../STM/index.js"
import type { TSemaphore } from "../definition.js"
import { acquireN_ } from "./acquireN.js"
import { releaseN_ } from "./releaseN.js"

/**
 * Returns a managed effect that describes acquiring the specified number of
 * permits as the `acquire` action and releasing them as the `release` action.
 */
export function withPermitsManaged_(
  self: TSemaphore,
  permits: number,
  __trace?: string
): M.Managed<unknown, never, void> {
  return M.makeInterruptible_(
    STM.commit(acquireN_(self, permits)),
    () => STM.commit(releaseN_(self, permits)),
    __trace
  )
}

/**
 * Returns a managed effect that describes acquiring the specified number of
 * permits as the `acquire` action and releasing them as the `release` action.
 *
 * @ets_data_first withPermitsManaged_
 */
export function withPermitsManaged(permits: number, __trace?: string) {
  return (self: TSemaphore): M.Managed<unknown, never, void> =>
    withPermitsManaged_(self, permits, __trace)
}
