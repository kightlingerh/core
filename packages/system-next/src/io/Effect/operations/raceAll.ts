import { reduce_ } from "../../../collection/immutable/Chunk/api/reduce"
import * as Chunk from "../../../collection/immutable/Chunk/core"
import { Tuple } from "../../../collection/immutable/Tuple"
import * as Ref from "../../../io/Ref"
import * as Exit from "../../Exit"
import * as Fiber from "../../Fiber"
import * as P from "../../Promise"
import type { UIO } from "../definition"
import { Effect } from "../definition"

/**
 * Returns an effect that races this effect with all the specified effects,
 * yielding the value of the first effect to succeed with a value. Losers of
 * the race will be interrupted immediately
 *
 * @ets fluent ets/Effect raceAll
 */
export function raceAll_<R, E, A>(
  self: Effect<R, E, A>,
  effects: Iterable<Effect<R, E, A>>,
  __etsTrace?: string
): Effect<R, E, A> {
  const ios = Chunk.from(effects)
  return Effect.Do()
    .bind("done", () => P.make<E, Tuple<[A, Fiber.Fiber<E, A>]>>())
    .bind("fails", () => Ref.make(Chunk.size(ios)))
    .flatMap(({ done, fails }) =>
      Effect.uninterruptibleMask(({ restore }) =>
        Effect.Do()
          .bind("head", () => self.uninterruptible().fork())
          .bind("tail", () => Effect.forEach(ios, (io) => io.interruptible().fork()))
          .bindValue("fs", ({ head, tail }) => Chunk.prepend_(tail, head))
          .tap(({ fs }) =>
            reduce_(fs, Effect.unit, (io, f) =>
              io.flatMap(() => Fiber.await(f).flatMap(arbiter(fs, f, done, fails)))
            )
          )
          .bindValue(
            "inheritRefs",
            () =>
              (res: Tuple<[A, Fiber.Fiber<E, A>]>): UIO<A> =>
                res.get(1).inheritRefs.map(() => res.get(0))
          )
          .flatMap(({ fs, inheritRefs }) =>
            restore(P.await(done).flatMap(inheritRefs)).onInterrupt(() =>
              reduce_(fs, Effect.unit, (io, f) => io.zipLeft(Fiber.interrupt(f)))
            )
          )
      )
    )
}

/**
 * Returns an effect that races this effect with all the specified effects,
 * yielding the value of the first effect to succeed with a value. Losers of
 * the race will be interrupted immediately
 *
 * @ets_data_first raceAll_
 */
export function raceAll<R, E, A>(as: Iterable<Effect<R, E, A>>, __etsTrace?: string) {
  return (self: Effect<R, E, A>): Effect<R, E, A> => raceAll_(self, as, __etsTrace)
}

function arbiter<E, A>(
  fibers: Chunk.Chunk<Fiber.Fiber<E, A>>,
  winner: Fiber.Fiber<E, A>,
  promise: P.Promise<E, Tuple<[A, Fiber.Fiber<E, A>]>>,
  fails: Ref.Ref<number>
) {
  return (exit: Exit.Exit<E, A>): UIO<void> => {
    return Exit.foldEffect_(
      exit,
      (e) =>
        Ref.modify_(fails, (c) =>
          Tuple(c === 0 ? P.failCause_(promise, e).asUnit() : Effect.unit, c - 1)
        ).flatten(),
      (a) =>
        P.succeed_(promise, Tuple(a, winner)).flatMap((set) =>
          set
            ? reduce_(fibers, Effect.unit, (io, f) =>
                f === winner ? io : io.zipLeft(Fiber.interrupt(f))
              )
            : Effect.unit
        )
    )
  }
}
