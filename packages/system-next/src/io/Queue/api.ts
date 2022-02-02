import { Chunk } from "../../collection/immutable/Chunk"
import { identity, pipe, tuple } from "../../data/Function"
import { Option } from "../../data/Option"
import { Bounded, Unbounded } from "../../support/MutableQueue"
import {
  BackPressureStrategy,
  createQueue,
  makeBoundedQueue as makeBounded,
  unsafeCreateQueue as unsafeCreate
} from "../Effect/operations/excl-forEach"
import * as exclForEach from "../Effect/operations/excl-forEach"
import { DroppingStrategy, SlidingStrategy } from "./core"
import * as T from "./effect"
import type { Queue, XQueue } from "./xqueue"
import { concreteQueue, XQueueInternal } from "./xqueue"

export { createQueue, makeBounded, unsafeCreate, BackPressureStrategy }

/**
 * Creates a sliding queue
 */
export function makeSliding<A>(capacity: number): T.UIO<Queue<A>> {
  return T.chain_(
    T.succeed(() => new Bounded<A>(capacity)),
    exclForEach.createQueue(new SlidingStrategy())
  )
}

/**
 * Creates a unbouded queue
 */
export function makeUnbounded<A>(): T.UIO<Queue<A>> {
  return T.chain_(
    T.succeed(() => new Unbounded<A>()),
    exclForEach.createQueue(new DroppingStrategy())
  )
}

/**
 * Creates a dropping queue
 */
export function makeDropping<A>(capacity: number): T.UIO<Queue<A>> {
  return T.chain_(
    T.succeed(() => new Bounded<A>(capacity)),
    exclForEach.createQueue(new DroppingStrategy())
  )
}

function takeRemainderLoop<RA, RB, EA, EB, A, B>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  n: number
): T.Effect<RB, EB, Chunk<B>> {
  concreteQueue(self)
  if (n <= 0) {
    return T.succeedNow(Chunk.empty())
  } else {
    return T.chain_(self.take, (a) =>
      T.map_(takeRemainderLoop(self, n - 1), (_) => _.append(a))
    )
  }
}

/**
 * Takes between min and max number of values from the queue. If there
 * is less than min items available, it'll block until the items are
 * collected.
 *
 * @ets_data_first takeBetween_
 */
export function takeBetween(min: number, max: number) {
  return <RA, RB, EA, EB, A, B>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): T.Effect<RB, EB, Chunk<B>> => takeBetween_(self, min, max)
}

/**
 * Takes between min and max number of values from the queue. If there
 * is less than min items available, it'll block until the items are
 * collected.
 */
export function takeBetween_<RA, RB, EA, EB, A, B>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  min: number,
  max: number
): T.Effect<RB, EB, Chunk<B>> {
  concreteQueue(self)
  if (max < min) {
    return T.succeedNow(Chunk.empty())
  } else {
    return pipe(
      self.takeUpTo(max),
      T.chain((bs) => {
        const remaining = min - bs.size

        if (remaining === 1) {
          return self.take.map((b) => bs.append(b))
        } else if (remaining > 1) {
          return takeRemainderLoop(self, remaining).map((list) => bs + list)
        } else {
          return T.succeedNow(bs)
        }
      })
    )
  }
}

/**
 * Creates a new queue from this queue and another. Offering to the composite queue
 * will broadcast the elements to both queues; taking from the composite queue
 * will dequeue elements from both queues and apply the function point-wise.
 *
 * Note that using queues with different strategies may result in surprising behavior.
 * For example, a dropping queue and a bounded queue composed together may apply `f`
 * to different elements.
 *
 * @ets_data_first bothWithEffect_
 */
export function bothWithEffect<RA1, RB1, EA1, EB1, A1 extends A, C, B, R3, E3, D, A>(
  that: XQueue<RA1, RB1, EA1, EB1, A1, C>,
  f: (b: B, c: C) => T.Effect<R3, E3, D>
) {
  return <RA, RB, EA, EB>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA & RA1, RB & RB1 & R3, EA | EA1, E3 | EB | EB1, A1, D> =>
    bothWithEffect_(self, that, f)
}

/**
 * Creates a new queue from this queue and another. Offering to the composite queue
 * will broadcast the elements to both queues; taking from the composite queue
 * will dequeue elements from both queues and apply the function point-wise.
 *
 * Note that using queues with different strategies may result in surprising behavior.
 * For example, a dropping queue and a bounded queue composed together may apply `f`
 * to different elements.
 */
export function bothWithEffect_<
  RA,
  RB,
  EA,
  EB,
  RA1,
  RB1,
  EA1,
  EB1,
  A1 extends A,
  C,
  B,
  R3,
  E3,
  D,
  A
>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  that: XQueue<RA1, RB1, EA1, EB1, A1, C>,
  f: (b: B, c: C) => T.Effect<R3, E3, D>
): XQueue<RA & RA1, RB & RB1 & R3, EA | EA1, E3 | EB | EB1, A1, D> {
  concreteQueue(self)
  concreteQueue(that)
  return new BothWithEffect(self, that, f)
}

class BothWithEffect<
  RA,
  RB,
  EA,
  EB,
  RA1,
  RB1,
  EA1,
  EB1,
  A1 extends A,
  C,
  B,
  R3,
  E3,
  D,
  A
> extends XQueueInternal<RA & RA1, RB & RB1 & R3, EA | EA1, E3 | EB | EB1, A1, D> {
  constructor(
    readonly self: XQueueInternal<RA, RB, EA, EB, A, B>,
    readonly that: XQueueInternal<RA1, RB1, EA1, EB1, A1, C>,
    readonly f: (b: B, c: C) => T.Effect<R3, E3, D>
  ) {
    super()
  }

  awaitShutdown: T.UIO<void> = T.chain_(
    this.self.awaitShutdown,
    () => this.that.awaitShutdown
  )

  capacity: number = Math.min(this.self.capacity, this.that.capacity)

  isShutdown: T.UIO<boolean> = this.self.isShutdown

  offer(a: A1): T.Effect<RA & RA1, EA1 | EA, boolean> {
    return T.zipWithPar_(this.self.offer(a), this.that.offer(a), (x, y) => x && y)
  }

  offerAll(as: Iterable<A1>): T.Effect<RA & RA1, EA1 | EA, boolean> {
    return T.zipWithPar_(
      this.self.offerAll(as),
      this.that.offerAll(as),
      (x, y) => x && y
    )
  }

  shutdown: T.UIO<void> = T.zipWithPar_(
    this.self.shutdown,
    this.that.shutdown,
    () => undefined
  )

  size: T.UIO<number> = T.zipWithPar_(this.self.size, this.that.size, (x, y) =>
    Math.max(x, y)
  )

  take: T.Effect<RB & RB1 & R3, E3 | EB | EB1, D> = T.chain_(
    T.zipPar_(this.self.take, this.that.take),
    ({ tuple: [b, c] }) => this.f(b, c)
  )

  takeAll: T.Effect<RB & RB1 & R3, E3 | EB | EB1, Chunk<D>> = T.chain_(
    T.zipPar_(this.self.takeAll, this.that.takeAll),
    ({ tuple: [bs, cs] }) => bs.zip(cs).mapEffect(({ tuple: [b, c] }) => this.f(b, c))
  )

  takeUpTo(max: number): T.Effect<RB & RB1 & R3, E3 | EB | EB1, Chunk<D>> {
    return T.chain_(
      T.zipPar_(this.self.takeUpTo(max), this.that.takeUpTo(max)),
      ({ tuple: [bs, cs] }) => bs.zip(cs).mapEffect(({ tuple: [b, c] }) => this.f(b, c))
    )
  }
}

/**
 * Like `bothWithEffect`, but uses a pure function.
 *
 * @ets_data_first bothWith_
 */
export function bothWith<RA1, RB1, EA1, EB1, A1 extends A, C, B, D, A>(
  that: XQueue<RA1, RB1, EA1, EB1, A1, C>,
  f: (b: B, c: C) => D
) {
  return <RA, RB, EA, EB>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA & RA1, RB & RB1, EA | EA1, EB | EB1, A1, D> =>
    bothWithEffect_(self, that, (b, c) => T.succeedNow(f(b, c)))
}

/**
 * Like `bothWithEffect`, but uses a pure function.
 */
export function bothWith_<RA, RB, EA, EB, RA1, RB1, EA1, EB1, A1 extends A, C, B, D, A>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  that: XQueue<RA1, RB1, EA1, EB1, A1, C>,
  f: (b: B, c: C) => D
): XQueue<RA & RA1, RB & RB1, EA | EA1, EB | EB1, A1, D> {
  return bothWithEffect_(self, that, (b, c) => T.succeedNow(f(b, c)))
}

/**
 * Like `bothWith`, but tuples the elements instead of applying a function.
 *
 * @ets_data_first both_
 */
export function both<RA1, RB1, EA1, EB1, A1 extends A, C, B, A>(
  that: XQueue<RA1, RB1, EA1, EB1, A1, C>
) {
  return <RA, RB, EA, EB>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA & RA1, RB & RB1, EA | EA1, EB | EB1, A1, readonly [B, C]> =>
    bothWith_(self, that, (b, c) => tuple(b, c))
}

/**
 * Like `bothWith`, but tuples the elements instead of applying a function.
 */
export function both_<RA, RB, EA, EB, RA1, RB1, EA1, EB1, A1 extends A, C, B, A>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  that: XQueue<RA1, RB1, EA1, EB1, A1, C>
): XQueue<RA & RA1, RB & RB1, EA | EA1, EB | EB1, A1, readonly [B, C]> {
  return bothWith_(self, that, (b, c) => tuple(b, c))
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 *
 * @ets_data_first dimap_
 */
export function dimap<A, B, C, D>(f: (c: C) => A, g: (b: B) => D) {
  return <RA, RB, EA, EB>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA, RB, EA, EB, C, D> => dimap_(self, f, g)
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 */
export function dimap_<RA, RB, EA, EB, A, B, C, D>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (c: C) => A,
  g: (b: B) => D
): XQueue<RA, RB, EA, EB, C, D> {
  return dimapEffect_(
    self,
    (c: C) => T.succeedNow(f(c)),
    (b) => T.succeedNow(g(b))
  )
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 *
 * @ets_data_first dimapEffect_
 */
export function dimapEffect<A, B, C, RC, EC, RD, ED, D>(
  f: (c: C) => T.Effect<RC, EC, A>,
  g: (b: B) => T.Effect<RD, ED, D>
) {
  return <RA, RB, EA, EB>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RC & RA, RD & RB, EC | EA, ED | EB, C, D> => dimapEffect_(self, f, g)
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 */
export function dimapEffect_<RA, RB, EA, EB, A, B, C, RC, EC, RD, ED, D>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (c: C) => T.Effect<RC, EC, A>,
  g: (b: B) => T.Effect<RD, ED, D>
): XQueue<RC & RA, RD & RB, EC | EA, ED | EB, C, D> {
  concreteQueue(self)
  return new DimapEffect(self, f, g)
}

class DimapEffect<RA, RB, EA, EB, A, B, C, RC, EC, RD, ED, D> extends XQueueInternal<
  RC & RA,
  RD & RB,
  EC | EA,
  ED | EB,
  C,
  D
> {
  constructor(
    readonly self: XQueueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (c: C) => T.Effect<RC, EC, A>,
    readonly g: (b: B) => T.Effect<RD, ED, D>
  ) {
    super()
  }

  awaitShutdown: T.UIO<void> = this.self.awaitShutdown

  capacity: number = this.self.capacity

  isShutdown: T.UIO<boolean> = this.self.isShutdown

  offer(a: C): T.Effect<RC & RA, EA | EC, boolean> {
    return T.chain_(this.f(a), (a) => this.self.offer(a))
  }

  offerAll(as: Iterable<C>): T.Effect<RC & RA, EC | EA, boolean> {
    return T.chain_(exclForEach.forEach_(as, this.f), (as) => this.self.offerAll(as))
  }

  shutdown: T.UIO<void> = this.self.shutdown

  size: T.UIO<number> = this.self.size

  take: T.Effect<RD & RB, ED | EB, D> = T.chain_(this.self.take, this.g)

  takeAll: T.Effect<RD & RB, ED | EB, Chunk<D>> = T.chain_(this.self.takeAll, (a) =>
    a.mapEffect(this.g)
  )

  takeUpTo(n: number): T.Effect<RD & RB, ED | EB, Chunk<D>> {
    return T.chain_(this.self.takeUpTo(n), (bs) => bs.mapEffect(this.g))
  }
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 */
export function contramapEffect_<RA, RB, EA, EB, B, C, RA2, EA2, A>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (c: C) => T.Effect<RA2, EA2, A>
): XQueue<RA & RA2, RB, EA | EA2, EB, C, B> {
  return dimapEffect_(self, f, T.succeedNow)
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 *
 * @ets_data_first contramapEffect_
 */
export function contramapEffect<C, RA2, EA2, A>(f: (c: C) => T.Effect<RA2, EA2, A>) {
  return <RA, RB, EA, EB, B>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA & RA2, RB, EA | EA2, EB, C, B> => contramapEffect_(self, f)
}

/**
 * Transforms elements enqueued into this queue with a pure function.
 */
export function contramap_<RA, RB, EA, EB, B, C, A>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (c: C) => A
): XQueue<RA, RB, EA, EB, C, B> {
  return dimapEffect_(self, (c: C) => T.succeedNow(f(c)), T.succeedNow)
}

/**
 * Transforms elements enqueued into this queue with a pure function.
 *
 * @ets_data_first contramap_
 */
export function contramap<C, A>(f: (c: C) => A) {
  return <RA, RB, EA, EB, B>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA, RB, EA, EB, C, B> => contramap_(self, f)
}

/**
 * Like `filterInput`, but uses an effectful function to filter the elements.
 *
 * @ets_data_first filterInputEffect_
 */
export function filterInputM<A, A1 extends A, R2, E2>(
  f: (_: A1) => T.Effect<R2, E2, boolean>
) {
  return <RA, RB, EA, EB, B>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA & R2, RB, EA | E2, EB, A1, B> => filterInputEffect_(self, f)
}

/**
 * Like `filterInput`, but uses an effectful function to filter the elements.
 */
export function filterInputEffect_<RA, RB, EA, EB, B, A, A1 extends A, R2, E2>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (_: A1) => T.Effect<R2, E2, boolean>
): XQueue<RA & R2, RB, EA | E2, EB, A1, B> {
  concreteQueue(self)
  return new FilterInputEffect(self, f)
}

class FilterInputEffect<
  RA,
  RB,
  EA,
  EB,
  B,
  A,
  A1 extends A,
  R2,
  E2
> extends XQueueInternal<RA & R2, RB, EA | E2, EB, A1, B> {
  constructor(
    readonly self: XQueueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (_: A1) => T.Effect<R2, E2, boolean>
  ) {
    super()
  }

  awaitShutdown: T.UIO<void> = this.self.awaitShutdown

  capacity: number = this.self.capacity

  isShutdown: T.UIO<boolean> = this.self.isShutdown

  offer(a: A1): T.Effect<RA & R2, EA | E2, boolean> {
    return T.chain_(this.f(a), (b) => (b ? this.self.offer(a) : T.succeedNow(false)))
  }

  offerAll(as: Iterable<A1>): T.Effect<RA & R2, EA | E2, boolean> {
    return pipe(
      exclForEach
        .forEach_(as, (a) =>
          pipe(
            this.f(a),
            T.map((b) => (b ? Option.some(a) : Option.none))
          )
        )
        .flatMap((maybeAs) => {
          const filtered = maybeAs.collect(identity)

          if (filtered.isEmpty()) {
            return T.succeedNow(false)
          } else {
            return this.self.offerAll(filtered)
          }
        })
    )
  }

  shutdown: T.UIO<void> = this.self.shutdown

  size: T.UIO<number> = this.self.size

  take: T.Effect<RB, EB, B> = this.self.take

  takeAll: T.Effect<RB, EB, Chunk<B>> = this.self.takeAll

  takeUpTo(n: number): T.Effect<RB, EB, Chunk<B>> {
    return this.self.takeUpTo(n)
  }
}

/**
 * Filters elements dequeued from the queue using the specified effectual
 * predicate.
 */
export function filterOutputEffect_<RA, RB, RB1, EB1, EA, EB, A, B>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (b: B) => T.Effect<RB1, EB1, boolean>
): XQueue<RA, RB & RB1, EA, EB | EB1, A, B> {
  concreteQueue(self)
  return new FilterOutputEffect(self, f)
}

class FilterOutputEffect<RA, RB, RB1, EB1, EA, EB, A, B> extends XQueueInternal<
  RA,
  RB & RB1,
  EA,
  EB | EB1,
  A,
  B
> {
  constructor(
    readonly self: XQueueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (b: B) => T.Effect<RB1, EB1, boolean>
  ) {
    super()
  }

  awaitShutdown: T.UIO<void> = this.self.awaitShutdown

  capacity: number = this.self.capacity

  isShutdown: T.UIO<boolean> = this.self.isShutdown

  offer(a: A): T.Effect<RA, EA, boolean> {
    return this.self.offer(a)
  }

  offerAll(as: Iterable<A>): T.Effect<RA, EA, boolean> {
    return this.self.offerAll(as)
  }

  shutdown: T.UIO<void> = this.self.shutdown

  size: T.UIO<number> = this.self.size

  take: T.Effect<RB & RB1, EB1 | EB, B> = T.chain_(this.self.take, (b) => {
    return T.chain_(this.f(b), (p) => {
      return p ? T.succeedNow(b) : this.take
    })
  })

  takeAll: T.Effect<RB & RB1, EB | EB1, Chunk<B>> = T.chain_(this.self.takeAll, (bs) =>
    bs.filterEffect(this.f)
  )

  loop(max: number, acc: Chunk<B>): T.Effect<RB & RB1, EB | EB1, Chunk<B>> {
    return T.chain_(this.self.takeUpTo(max), (bs) => {
      if (bs.isEmpty()) {
        return T.succeedNow(acc)
      }

      return T.chain_(bs.filterEffect(this.f), (filtered) => {
        const length = filtered.size

        if (length === max) {
          return T.succeedNow(acc + filtered)
        } else {
          return this.loop(max - length, acc + filtered)
        }
      })
    })
  }

  takeUpTo(n: number): T.Effect<RB & RB1, EB | EB1, Chunk<B>> {
    return T.suspendSucceed(() => {
      return this.loop(n, Chunk.empty())
    })
  }
}

/**
 * Filters elements dequeued from the queue using the specified effectual
 * predicate.
 *
 * @ets_data_first filterOutputEffect_
 */
export function filterOutputEffect<RB1, EB1, B>(
  f: (b: B) => T.Effect<RB1, EB1, boolean>
) {
  return <RA, RB, EA, EB, A>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA, RB & RB1, EA, EB | EB1, A, B> => filterOutputEffect_(self, f)
}

/**
 * Filters elements dequeued from the queue using the specified predicate.
 */
export function filterOutput_<RA, RB, EA, EB, A, B>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (b: B) => boolean
): XQueue<RA, RB, EA, EB, A, B> {
  return filterOutputEffect_(self, (b) => T.succeedNow(f(b)))
}

/**
 * Filters elements dequeued from the queue using the specified predicate.
 *
 * @ets_data_first filterOutput_
 */
export function filterOutput<B>(f: (b: B) => boolean) {
  return <RA, RB, EA, EB, A>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA, RB, EA, EB, A, B> => filterOutput_(self, f)
}

/**
 * Applies a filter to elements enqueued into this queue. Elements that do not
 * pass the filter will be immediately dropped.
 *
 * @ets_data_first filterInput_
 */
export function filterInput<A, A1 extends A>(f: (_: A1) => boolean) {
  return <RA, RB, EA, EB, B>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA, RB, EA, EB, A1, B> => filterInput_(self, f)
}

/**
 * Applies a filter to elements enqueued into this queue. Elements that do not
 * pass the filter will be immediately dropped.
 */
export function filterInput_<RA, RB, EA, EB, B, A, A1 extends A>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (_: A1) => boolean
): XQueue<RA, RB, EA, EB, A1, B> {
  return filterInputEffect_(self, (a) => T.succeedNow(f(a)))
}

/**
 * Transforms elements dequeued from this queue with a function.
 */
export function map_<RA, RB, EA, EB, A, B, C>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (b: B) => C
): XQueue<RA, RB, EA, EB, A, C> {
  return mapEffect_(self, (_) => T.succeedNow(f(_)))
}

/**
 * Transforms elements dequeued from this queue with a function.
 *
 * @ets_data_first map_
 */
export function map<RA, RB, EA, EB, A, B, C>(f: (b: B) => C) {
  return (self: XQueue<RA, RB, EA, EB, A, B>): XQueue<RA, RB, EA, EB, A, C> =>
    map_(self, f)
}

/**
 * Transforms elements dequeued from this queue with an effectful function.
 *
 * @ets_data_first mapEffect_
 */
export function mapEffect<B, R2, E2, C>(f: (b: B) => T.Effect<R2, E2, C>) {
  return <RA, RB, EA, EB, A>(
    self: XQueue<RA, RB, EA, EB, A, B>
  ): XQueue<RA, R2 & RB, EA, EB | E2, A, C> => mapEffect_(self, f)
}

/**
 * Transforms elements dequeued from this queue with an effectful function.
 */
export function mapEffect_<RA, RB, EA, EB, A, B, R2, E2, C>(
  self: XQueue<RA, RB, EA, EB, A, B>,
  f: (b: B) => T.Effect<R2, E2, C>
): XQueue<RA, R2 & RB, EA, EB | E2, A, C> {
  return dimapEffect_(self, (a: A) => T.succeedNow(a), f)
}

/**
 * Take the head option of values in the queue.
 */
export function poll<RA, RB, EA, EB, A, B>(
  self: XQueue<RA, RB, EA, EB, A, B>
): T.Effect<RB, EB, Option<B>> {
  concreteQueue(self)
  return T.map_(self.takeUpTo(1), (_) => _.head)
}
