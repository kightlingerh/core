import { Chunk } from "../../../collection/immutable/Chunk"
import { Tuple } from "../../../collection/immutable/Tuple"
import type { LazyArg } from "../../../data/Function"
import { Ref } from "../../../io/Ref"
import type { Exit } from "../../Exit"
import * as Fiber from "../../Fiber"
import { Promise } from "../../Promise"
import type { RIO } from "../definition"
import { Effect } from "../definition"

/**
 * Returns an effect that races this effect with all the specified effects,
 * yielding the value of the first effect to succeed with a value. Losers of
 * the race will be interrupted immediately
 *
 * @tsplus fluent ets/Effect raceAll
 */
export function raceAll_<R, E, A, R1, E1, A1>(
  self: Effect<R, E, A>,
  effects: LazyArg<Iterable<Effect<R1, E1, A1>>>,
  __tsplusTrace?: string
): Effect<R & R1, E | E1, A | A1> {
  return Effect.Do()
    .bind("ios", () => Effect.succeed(Chunk.from(effects())))
    .bind("done", () =>
      Promise.make<E | E1, Tuple<[A | A1, Fiber.Fiber<E | E1, A | A1>]>>()
    )
    .bind("fails", ({ ios }) => Ref.make(ios.size))
    .flatMap(({ done, fails, ios }) =>
      Effect.uninterruptibleMask(({ restore }) =>
        Effect.Do()
          .bind("head", () => self.interruptible().fork())
          .bind("tail", () => Effect.forEach(ios, (io) => io.interruptible().fork()))
          .bindValue(
            "fs",
            ({ head, tail }) =>
              tail.prepend(head) as Chunk<Fiber.Runtime<E | E1, A | A1>>
          )
          .tap(({ fs }) =>
            fs.reduce(
              Effect.unit,
              (io, f) => io > Fiber.await(f).flatMap(arbiter(fs, f, done, fails)).fork()
            )
          )
          .bindValue(
            "inheritRefs",
            () =>
              (
                res: Tuple<[A | A1, Fiber.Fiber<E | E1, A | A1>]>
              ): Effect<unknown, never, A | A1> =>
                res.get(1).inheritRefs.as(res.get(0))
          )
          .flatMap(({ fs, inheritRefs }) =>
            restore(done.await().flatMap(inheritRefs)).onInterrupt(() =>
              fs.reduce(Effect.unit, (io, f) => io < Fiber.interrupt(f))
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
export function raceAll<R1, E1, A1>(
  as: Iterable<Effect<R1, E1, A1>>,
  __tsplusTrace?: string
) {
  return <R, E, A>(self: Effect<R, E, A>): Effect<R & R1, E | E1, A | A1> =>
    self.raceAll(as)
}

function arbiter<R, R1, E, E1, A, A1>(
  fibers: Chunk<Fiber.Fiber<E | E1, A | A1>>,
  winner: Fiber.Fiber<E | E1, A | A1>,
  promise: Promise<E | E1, Tuple<[A | A1, Fiber.Fiber<E | E1, A | A1>]>>,
  fails: Ref<number>
) {
  return (exit: Exit<E, A | A1>): RIO<R & R1, void> => {
    return exit.foldEffect(
      (e) =>
        fails
          .modify((c) =>
            Tuple(c === 0 ? promise.failCause(e).asUnit() : Effect.unit, c - 1)
          )
          .flatten(),
      (a) =>
        promise
          .succeed(Tuple(a, winner))
          .flatMap((set) =>
            set
              ? fibers.reduce(Effect.unit, (io, f) =>
                  f === winner ? io : io.zipLeft(Fiber.interrupt(f))
                )
              : Effect.unit
          )
    )
  }
}
