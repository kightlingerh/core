import * as Cause from "../../Cause"
import * as Trace from "../../Trace"
import type { UIO } from "../definition"
import { failCauseWith } from "./failCauseWith"

// TODO(Mike/Max): fix name

/**
 * Returns an effect that dies with the specified `unknown`. This method can
 * be used for terminating a fiber because a defect has been detected in the
 * code.
 *
 * @ets static ets/EffectOps die
 */
export function dieWith(f: () => unknown, __trace?: string): UIO<never> {
  return failCauseWith(() => Cause.die(f(), Trace.none), __trace)
}
