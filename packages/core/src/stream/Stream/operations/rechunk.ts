import { Chunk } from "../../../collection/immutable/Chunk"
import { List } from "../../../collection/immutable/List"
import { Channel } from "../../Channel"
import type { Stream } from "../definition"
import { concreteStream, StreamInternal } from "./_internal/StreamInternal"

/**
 * Re-chunks the elements of the stream into chunks of `n` elements each. The
 * last chunk might contain less than `n` elements.
 *
 * @tsplus fluent ets/Stream rechunk
 */
export function rechunk_<R, E, A>(
  self: Stream<R, E, A>,
  n: number,
  __tsplusTrace?: string
): Stream<R, E, A> {
  concreteStream(self)
  return new StreamInternal(self.channel >> process<R, E, A>(new Rechunker(n), n))
}

/**
 * Re-chunks the elements of the stream into chunks of `n` elements each. The
 * last chunk might contain less than `n` elements.
 *
 * @tsplus static ets/StreamOps rechunk
 */
export const rechunk = Pipeable(rechunk_)

function process<R, E, A>(
  rechunker: Rechunker<A>,
  target: number
): Channel<R, E, Chunk<A>, unknown, E, Chunk<A>, unknown> {
  return Channel.readWithCause(
    (chunk: Chunk<A>) => {
      if (chunk.size === target && rechunker.isEmpty()) {
        return Channel.write(chunk) > process<R, E, A>(rechunker, target)
      }
      if (chunk.size > 0) {
        let chunks = List.empty<Chunk<A>>()
        let result: Chunk<A> | undefined = undefined
        let i = 0

        while (i < chunk.size) {
          while (i < chunk.size && result == null) {
            result = rechunker.write(chunk.unsafeGet(i))
            i = i + 1
          }

          if (result != null) {
            chunks = chunks.prepend(result)
            result = undefined
          }
        }

        return (
          Channel.writeAll(...chunks.reverse()) > process<R, E, A>(rechunker, target)
        )
      }
      return process(rechunker, target)
    },
    (cause) => rechunker.emitIfNotEmpty() > Channel.failCause(cause),
    () => rechunker.emitIfNotEmpty()
  )
}

class Rechunker<A> {
  private builder = Chunk.builder<A>()
  private pos = 0

  constructor(readonly n: number) {}

  isEmpty(): boolean {
    return this.pos === 0
  }

  write(elem: A): Chunk<A> | undefined {
    this.builder.append(elem)
    this.pos += 1

    if (this.pos === this.n) {
      const result = this.builder.build()

      this.builder = Chunk.builder()
      this.pos = 0

      return result
    }

    return undefined
  }

  emitIfNotEmpty(
    __tsplusTrace?: string
  ): Channel<unknown, unknown, unknown, unknown, never, Chunk<A>, void> {
    if (this.pos !== 0) {
      return Channel.write(this.builder.build())
    } else {
      return Channel.unit
    }
  }
}
