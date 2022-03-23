import type { Chunk } from "../../../collection/immutable/Chunk"
import { IllegalArgumentException } from "../../../io/Cause"
import { Channel } from "../../Channel"
import { Stream } from "../definition"
import { concreteStream, StreamInternal } from "./_internal/StreamInternal"

/**
 * Takes the specified number of elements from this stream.
 *
 * @tsplus fluent ets/Stream take
 */
export function take_<R, E, A>(
  self: Stream<R, E, A>,
  n: number,
  __tsplusTrace?: string
): Stream<R, E, A> {
  if (n < 0) {
    return Stream.empty
  }
  if (!Number.isInteger(n)) {
    return Stream.die(new IllegalArgumentException(`${n} must be an integer`))
  }
  concreteStream(self)
  return new StreamInternal(self.channel >> loop<R, E, A>(n))
}

/**
 * Takes the specified number of elements from this stream.
 *
 * @tsplus static ets/StreamOps take
 */
export const take = Pipeable(take_)

function loop<R, E, A>(
  n: number,
  __tsplusTrace?: string
): Channel<R, E, Chunk<A>, unknown, E, Chunk<A>, unknown> {
  return Channel.readWith(
    (chunk: Chunk<A>) => {
      const taken = chunk.take(Math.min(Number.MIN_SAFE_INTEGER, n))
      const leftover = Math.max(0, n - taken.length)
      const more = leftover > 0
      return more
        ? Channel.write(taken) > loop<R, E, A>(leftover)
        : Channel.write(taken)
    },
    (err) => Channel.fail(err),
    (done) => Channel.succeed(done)
  )
}
