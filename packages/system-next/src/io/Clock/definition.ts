import { Tuple } from "../../collection/immutable/Tuple"
import { Either } from "../../data/Either"
import type { LazyArg } from "../../data/Function"
import { NoSuchElementException } from "../../data/GlobalExceptions"
import type { Has } from "../../data/Has"
import { tag } from "../../data/Has"
import { Option } from "../../data/Option"
import type { UIO } from "../Effect"
import { Effect } from "../Effect"
import * as Ref from "../Ref"
import type { Schedule } from "../Schedule"
import { Driver } from "../Schedule/Driver"

export const ClockId: unique symbol = Symbol.for("@effect-ts/system/io/Clock")
export type ClockId = typeof ClockId

export const HasClock = tag<Clock>(ClockId)
export type HasClock = Has<Clock>

/**
 * @tsplus type ets/Clock
 */
export interface Clock {
  readonly [ClockId]: ClockId

  readonly currentTime: UIO<number>

  readonly sleep: (ms: number, __etsTrace?: string) => UIO<void>

  readonly driver: <State, Env, In, Out>(
    schedule: Schedule.WithState<State, Env, In, Out>,
    __etsTrace?: string
  ) => UIO<Driver<State, Env, In, Out>>

  readonly repeat: <R, E, A, R1, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    __etsTrace?: string
  ) => Effect<R & R1, E, B>

  readonly repeatOrElse: <R, E, A, R1, B, R2, E2>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    orElse: (e: E, option: Option<B>) => Effect<R2, E2, B>,
    __etsTrace?: string
  ) => Effect<R & R1 & R2, E2, B>

  readonly repeatOrElseEither: <R, E, A, R1, B, R2, E2, C>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    orElse: (e: E, option: Option<B>) => Effect<R2, E2, C>,
    __etsTrace?: string
  ) => Effect<R & R1 & R2, E2, Either<C, B>>

  readonly retry: <R, E, A, R1, Out>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, E, Out>>,
    __etsTrace?: string
  ) => Effect<R & R1, E, A>

  readonly retryOrElse: <R, E, A, R1, Out, R2, E2, A1>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, E, Out>>,
    orElse: (e: E, out: Out) => Effect<R2, E2, A1>,
    __etsTrace?: string
  ) => Effect<R & R1 & R2, E2, A | A1>

  readonly retryOrElseEither: <R, E, A, R1, Out, R2, E2, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, E, Out>>,
    orElse: (e: E, out: Out) => Effect<R2, E2, B>,
    __etsTrace?: string
  ) => Effect<R & R1 & R2, E2, Either<B, A>>

  readonly schedule: <R, E, A, R1, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, unknown, B>>,
    __etsTrace?: string
  ) => Effect<R & R1, E, B>

  readonly scheduleFrom: <R, E, A, R1, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    a0: LazyArg<A>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    __etsTrace?: string
  ) => Effect<R & R1, E, B>
}

/**
 * @tsplus type ets/ClockOps
 */
export interface ClockOps {}
export const Clock: ClockOps = {}

export abstract class AbstractClock implements Clock {
  readonly [ClockId]: ClockId = ClockId

  /**
   * Get the current time in milliseconds since the Unix epoch.
   */
  abstract currentTime: UIO<number>

  /**
   * Sleeps for the provided number of milliseconds.
   */
  abstract sleep(ms: number, __etsTrace?: string | undefined): UIO<void>

  driver<State, Env, In, Out>(
    schedule: Schedule.WithState<State, Env, In, Out>,
    __etsTrace?: string
  ): UIO<Driver<State, Env, In, Out>> {
    return Ref.make<Tuple<[Option<Out>, State]>>(
      Tuple(Option.none, schedule._initial)
    ).map((ref) => {
      const next = (input: In): Effect<Env, Option<never>, Out> =>
        Effect.Do()
          .bind("state", () => Ref.get(ref).map((_) => _.get(1)))
          .bind("now", () => this.currentTime)
          .flatMap(({ now, state }) =>
            schedule
              ._step(now, input, state)
              .flatMap(({ tuple: [state, out, decision] }) =>
                decision._tag === "Done"
                  ? Ref.set_(ref, Tuple(Option.some(out), state)) >
                    Effect.fail(Option.none)
                  : Ref.set_(ref, Tuple(Option.some(out), state)) >
                    this.sleep(decision.interval.startMilliseconds - now).as(out)
              )
          )

      const last = Ref.get(ref).flatMap(({ tuple: [option] }) =>
        option.fold(
          () => Effect.fail(new NoSuchElementException()),
          (b) => Effect.succeed(b)
        )
      )
      const reset = Ref.set_(ref, Tuple(Option.none, schedule._initial))

      const state = Ref.get(ref).map((_) => _.get(1))

      const driver = Driver(next, last, reset, state)

      console.log(driver)
      return driver
    })
  }

  repeat<R, E, A, R1, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    __etsTrace?: string
  ): Effect<R & R1, E, B> {
    return this.repeatOrElse(effect0, schedule0, (e, _) => Effect.fail(e))
  }

  repeatOrElse<R, E, A, R1, B, R2, E2>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    orElse: (e: E, option: Option<B>) => Effect<R2, E2, B>,
    __etsTrace?: string
  ): Effect<R & R1 & R2, E2, B> {
    return this.repeatOrElseEither(effect0, schedule0, orElse).map((either) =>
      either.merge()
    )
  }

  repeatOrElseEither<R, E, A, R1, B, R2, E2, C>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    orElse: (e: E, option: Option<B>) => Effect<R2, E2, C>,
    __etsTrace?: string
  ): Effect<R & R1 & R2, E2, Either<C, B>> {
    return Effect.suspendSucceed(() => {
      const effect = effect0()
      const schedule = schedule0()

      return this.driver(schedule).flatMap((driver) => {
        function loop(a: A): Effect<R & R1 & R2, E2, Either<C, B>> {
          return driver.next(a).foldEffect(
            () => driver.last.orDie().map((b) => Either.right(b)),
            (b) =>
              effect.foldEffect(
                (e) => orElse(e, Option.some(b)).map((c) => Either.left(c)),
                (a) => loop(a)
              )
          )
        }

        return effect.foldEffect(
          (e) => orElse(e, Option.none).map((c) => Either.left(c)),
          (a) => loop(a)
        )
      })
    })
  }

  retry<R, E, A, R1, Out>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, E, Out>>,
    __etsTrace?: string
  ): Effect<R & R1, E, A> {
    return this.retryOrElse(effect0, schedule0, (e, _) => Effect.fail(e))
  }

  retryOrElse<R, E, A, R1, Out, R2, E2, A1>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, E, Out>>,
    orElse: (e: E, out: Out) => Effect<R2, E2, A1>,
    __etsTrace?: string
  ): Effect<R & R1 & R2, E2, A | A1> {
    return this.retryOrElseEither(effect0, schedule0, orElse).map((either) =>
      either.merge()
    )
  }

  retryOrElseEither<R, E, A, R1, Out, R2, E2, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, E, Out>>,
    orElse: (e: E, out: Out) => Effect<R2, E2, B>,
    __etsTrace?: string
  ): Effect<R & R1 & R2, E2, Either<B, A>> {
    return Effect.suspendSucceed(() => {
      const effect = effect0()
      const schedule = schedule0()

      function loop(
        driver: Driver<unknown, R1, E, Out>
      ): Effect<R & R1 & R2, E2, Either<B, A>> {
        return effect
          .map((a) => Either.right(a))
          .catchAll((e) =>
            driver.next(e).foldEffect(
              () =>
                driver.last
                  .orDie()
                  .flatMap((out) => orElse(e, out).map((b) => Either.left(b))),
              () => loop(driver)
            )
          )
      }

      return this.driver(schedule).flatMap(loop)
    })
  }

  schedule<R, E, A, R1, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    schedule0: LazyArg<Schedule<R1, unknown, B>>,
    __etsTrace?: string
  ): Effect<R & R1, E, B> {
    return this.scheduleFrom(effect0, undefined, schedule0)
  }

  scheduleFrom<R, E, A, R1, B>(
    effect0: LazyArg<Effect<R, E, A>>,
    a0: LazyArg<A>,
    schedule0: LazyArg<Schedule<R1, A, B>>,
    __etsTrace?: string
  ): Effect<R & R1, E, B> {
    return Effect.suspendSucceed(() => {
      const effect = effect0()
      const a = a0()
      const schedule = schedule0()

      return this.driver(schedule).flatMap((driver) => {
        function loop(a: A): Effect<R & R1, E, B> {
          return driver.next(a).foldEffect(
            () => driver.last.orDie(),
            () => effect.flatMap(loop)
          )
        }
        return loop(a)
      })
    })
  }
}

/**
 * Access clock from environment.
 *
 * @tsplus static ets/ClockOps withClockEffect
 */
export const withClockEffect = Effect.serviceWithEffect(HasClock)

/**
 * Access clock from environment.
 *
 * @tsplus static ets/ClockOps withClock
 */
export const withClock = Effect.serviceWith(HasClock)

/**
 * Returns the current time, relative to the Unix epoch.
 *
 * @tsplus static ets/ClockOps currentTime
 */
export const currentTime = Effect.serviceWithEffect(HasClock)(
  (clock) => clock.currentTime
)

/**
 * Sleeps for the provided number of milliseconds.
 *
 * @tsplus static ets/ClockOps sleep
 */
export function sleep(
  milliseconds: number,
  __etsTrace?: string
): Effect<HasClock, never, void> {
  return Effect.serviceWithEffect(HasClock)((clock) => clock.sleep(milliseconds))
}

/**
 * Returns a driver that can be used to step the schedule, appropriately
 * handling sleeping.
 *
 * @tsplus static ets/ClockOps driver
 */
export function driver<State, Env, In, Out>(
  schedule: Schedule.WithState<State, Env, In, Out>,
  __etsTrace?: string
): Effect<HasClock, never, Driver<State, Env, In, Out>> {
  return Effect.serviceWithEffect(HasClock)((clock) => clock.driver(schedule))
}

/**
 * Returns a new effect that repeats this effect according to the specified
 * schedule or until the first failure. Scheduled recurrences are in addition
 * to the first execution, so that `io.repeat(Schedule.once)` yields an effect
 * that executes `io`, and then if that succeeds, executes `io` an additional
 * time.
 *
 * @tsplus static ets/ClockOps repeat
 */
export function repeat<R, E, A, R1, B>(
  effect0: LazyArg<Effect<R, E, A>>,
  schedule0: LazyArg<Schedule<R1, A, B>>,
  __etsTrace?: string
): Effect<HasClock & R & R1, E, B> {
  return Effect.serviceWithEffect(HasClock)((clock) => clock.repeat(effect0, schedule0))
}

/**
 * Returns a new effect that repeats this effect according to the specified
 * schedule or until the first failure, at which point, the failure value and
 * schedule output are passed to the specified handler.
 *
 * Scheduled recurrences are in addition to the first execution, so that
 * `io.repeat(Schedule.once)` yields an effect that executes `io`, and then if
 * that succeeds, executes `io` an additional time.
 *
 * @tsplus static ets/ClockOps repeatOrElse
 */
export function repeatOrElse<R, E, A, R1, B, R2, E2>(
  effect0: LazyArg<Effect<R, E, A>>,
  schedule0: LazyArg<Schedule<R1, A, B>>,
  orElse: (e: E, option: Option<B>) => Effect<R2, E2, B>,
  __etsTrace?: string
): Effect<HasClock & R & R1 & R2, E2, B> {
  return Effect.serviceWithEffect(HasClock)((clock) =>
    clock.repeatOrElse(effect0, schedule0, orElse)
  )
}

/**
 * Returns a new effect that repeats this effect according to the specified
 * schedule or until the first failure, at which point, the failure value and
 * schedule output are passed to the specified handler.
 *
 * Scheduled recurrences are in addition to the first execution, so that
 * `io.repeat(Schedule.once)` yields an effect that executes `io`, and then if
 * that succeeds, executes `io` an additional time.
 *
 * @tsplus static ets/ClockOps repeatOrElseEither
 */
export function repeatOrElseEither<R, E, A, R1, B, R2, E2, C>(
  effect0: LazyArg<Effect<R, E, A>>,
  schedule0: LazyArg<Schedule<R1, A, B>>,
  orElse: (e: E, option: Option<B>) => Effect<R2, E2, C>,
  __etsTrace?: string
): Effect<HasClock & R & R1 & R2, E2, Either<C, B>> {
  return Effect.serviceWithEffect(HasClock)((clock) =>
    clock.repeatOrElseEither(effect0, schedule0, orElse)
  )
}

/**
 * Retries with the specified retry policy. Retries are done following the
 * failure of the original `io` (up to a fixed maximum with `once` or `recurs`
 * for example), so that that `io.retry(Schedule.once)` means "execute `io`
 * and in case of failure, try again once".
 *
 * @tsplus static ets/ClockOps retry
 */
export function retry<R, E, A, R1, Out>(
  effect0: LazyArg<Effect<R, E, A>>,
  schedule0: LazyArg<Schedule<R1, E, Out>>,
  __etsTrace?: string
): Effect<HasClock & R & R1, E, A> {
  return Effect.serviceWithEffect(HasClock)((clock) => clock.retry(effect0, schedule0))
}

/**
 * Retries with the specified schedule, until it fails, and then both the
 * value produced by the schedule together with the last error are passed to
 * the recovery function.
 *
 * @tsplus static ets/ClockOps retryOrElse
 */
export function retryOrElse<R, E, A, R1, Out, R2, E2, A1>(
  effect0: LazyArg<Effect<R, E, A>>,
  schedule0: LazyArg<Schedule<R1, E, Out>>,
  orElse: (e: E, out: Out) => Effect<R2, E2, A1>,
  __etsTrace?: string
): Effect<HasClock & R & R1 & R2, E2, A | A1> {
  return Effect.serviceWithEffect(HasClock)((clock) =>
    clock.retryOrElse(effect0, schedule0, orElse)
  )
}

/**
 * Returns an effect that retries this effect with the specified schedule when
 * it fails, until the schedule is done, then both the value produced by the
 * schedule together with the last error are passed to the specified recovery
 * function.
 *
 * @tsplus static ets/ClockOps retryOrElseEither
 */
export function retryOrElseEither<R, E, A, R1, Out, R2, E2, B>(
  effect0: LazyArg<Effect<R, E, A>>,
  schedule0: LazyArg<Schedule<R1, E, Out>>,
  orElse: (e: E, out: Out) => Effect<R2, E2, B>,
  __etsTrace?: string
): Effect<HasClock & R & R1 & R2, E2, Either<B, A>> {
  return Effect.serviceWithEffect(HasClock)((clock) =>
    clock.retryOrElseEither(effect0, schedule0, orElse)
  )
}

/**
 * Runs this effect according to the specified schedule.
 *
 * See `scheduleFrom` for a variant that allows the schedule's decision to
 * depend on the result of this effect.
 *
 * @tsplus static ets/ClockOps schedule
 */
export function schedule<R, E, A, R1, B>(
  effect0: LazyArg<Effect<R, E, A>>,
  schedule0: LazyArg<Schedule<R1, unknown, B>>,
  __etsTrace?: string
): Effect<HasClock & R & R1, E, B> {
  return Effect.serviceWithEffect(HasClock)((clock) =>
    clock.schedule(effect0, schedule0)
  )
}

/**
 * Runs this effect according to the specified schedule starting from the
 * specified input value.
 */
export function scheduleFrom<R, E, A, R1, B>(
  effect0: LazyArg<Effect<R, E, A>>,
  a0: LazyArg<A>,
  schedule0: LazyArg<Schedule<R1, A, B>>,
  __etsTrace?: string
): Effect<HasClock & R & R1, E, B> {
  return Effect.serviceWithEffect(HasClock)((clock) =>
    clock.scheduleFrom(effect0, a0, schedule0)
  )
}
