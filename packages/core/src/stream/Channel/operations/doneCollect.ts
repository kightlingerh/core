import type { ChunkBuilder } from "../../../collection/immutable/Chunk"
import { Chunk } from "../../../collection/immutable/Chunk"
import { Tuple } from "../../../collection/immutable/Tuple"
import { Channel } from "../definition"

/**
 * Returns a new channel, which is the same as this one, except that all the
 * outputs are collected and bundled into a tuple together with the terminal
 * value of this channel.
 *
 * As the channel returned from this channel collects all of this channel's
 * output into an in- memory chunk, it is not safe to call this method on
 * channels that output a large or unbounded number of values.
 *
 * @tsplus fluent ets/Channel doneCollect
 */
export function doneCollect<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
): Channel<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  never,
  Tuple<[Chunk<OutElem>, OutDone]>
> {
  return Channel.suspend(() => {
    const builder = Chunk.builder<OutElem>()

    return (self >> doneCollectReader<Env, OutErr, OutElem, OutDone>(builder)).flatMap(
      (z) => Channel.succeed(Tuple(builder.build(), z))
    )
  })
}

function doneCollectReader<Env, OutErr, OutElem, OutDone>(
  builder: ChunkBuilder<OutElem>
): Channel<Env, OutErr, OutElem, OutDone, OutErr, never, OutDone> {
  return Channel.readWith(
    (outElem) =>
      Channel.succeed(() => {
        builder.append(outElem)
      }) > doneCollectReader<Env, OutErr, OutElem, OutDone>(builder),
    (outErr) => Channel.fail(outErr),
    (outDone) => Channel.succeedNow(outDone)
  )
}
