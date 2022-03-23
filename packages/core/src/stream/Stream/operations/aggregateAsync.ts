import type { LazyArg } from "../../../data/Function"
import type { HasClock } from "../../../io/Clock"
import { Schedule } from "../../../io/Schedule"
import type { Sink } from "../../Sink"
import type { Stream } from "../definition"

/**
 * Aggregates elements of this stream using the provided sink for as long as
 * the downstream operators on the stream are busy.
 *
 * This operator divides the stream into two asynchronous "islands". Operators
 * upstream of this operator run on one fiber, while downstream operators run
 * on another. Whenever the downstream fiber is busy processing elements, the
 * upstream fiber will feed elements into the sink until it signals
 * completion.
 *
 * Any sink can be used here, but see `Sink.foldWeightedEffect` and
 * `Sink.foldUntilEffect` for sinks that cover the common usecases.
 *
 * @param sink Used for the aggregation
 *
 * @tsplus fluent ets/Stream aggregateAsync
 */
export function aggregateAsync_<R, E, A, R2, E2, A2, B>(
  self: Stream<R, E, A>,
  sink: LazyArg<Sink<R2, E | E2, A | A2, A2, B>>,
  __tsplusTrace?: string
): Stream<R & R2 & HasClock, E | E2, B> {
  return self.aggregateAsyncWithin(sink, Schedule.recurs(0))
}

export const aggregateAsync = Pipeable(aggregateAsync_)
