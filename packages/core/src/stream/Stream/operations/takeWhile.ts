import type { Chunk } from "../../../collection/immutable/Chunk"
import type { Predicate } from "../../../data/Function"
import { Channel } from "../../Channel"
import type { Stream } from "../definition"
import { concreteStream, StreamInternal } from "./_internal/StreamInternal"

/**
 * Creates a pipeline that takes elements while the specified predicate
 * evaluates to `true`.
 *
 * @tsplus fluent ets/Stream takeWhile
 */
export function takeWhile_<R, E, A>(
  self: Stream<R, E, A>,
  f: Predicate<A>,
  __tsplusTrace?: string
): Stream<R, E, A> {
  const loop: Channel<R, E, Chunk<A>, unknown, E, Chunk<A>, unknown> = Channel.readWith(
    (chunk: Chunk<A>) => {
      const taken = chunk.takeWhile(f)
      const more = taken.length === chunk.length
      return more ? Channel.write(taken) > loop : Channel.write(taken)
    },
    (err) => Channel.fail(err),
    (done) => Channel.succeed(done)
  )
  concreteStream(self)
  return new StreamInternal(self.channel >> loop)
}

/**
 * Creates a pipeline that takes elements while the specified predicate
 * evaluates to `true`.
 *
 * @tsplus static ets/StreamOps takeWhile
 */
export const takeWhile = Pipeable(takeWhile_)
