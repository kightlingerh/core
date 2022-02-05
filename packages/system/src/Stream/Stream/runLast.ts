// ets_tracing: off

import * as SK from "../Sink/index.js"
import type { Stream } from "./definitions.js"
import { run_ } from "./run.js"

/**
 * Runs the stream to completion and yields the last value emitted by it,
 * discarding the rest of the elements.
 */
export function runLast<R, E, O>(self: Stream<R, E, O>) {
  return run_(self, SK.last<O>())
}
