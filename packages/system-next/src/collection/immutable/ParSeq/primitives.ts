import { IO } from "../../../io-light/IO"
import * as St from "../../../prelude/Structural"
import { _A } from "../../../support/Symbols"
import * as HS from "../HashSet"
import { List } from "../List"
import { Tuple } from "../Tuple"

export const _ParSeqBrand = Symbol()
export type _ParSeqBrand = typeof _ParSeqBrand

export function isParSeq(u: unknown): u is ParSeq<unknown> {
  return typeof u === "object" && u != null && _ParSeqBrand in u
}

/**
 * `ParSeq` is a data type that represents some notion of "events" that can
 * take place in parallel or in sequence. For example, a `ParSeq`
 * parameterized on some error type could be used to model the potentially
 * multiple ways that an application can fail. On the other hand, a ParSeq`
 * parameterized on some request type could be used to model a collection of
 * requests to external data sources, some of which could be executed in
 * parallel and some of which must be executed sequentially.
 */
export type ParSeq<A> = Empty | Single<A> | Then<A> | Both<A>

const _emptyHash = St.opt(St.randomInt())

export class Empty implements St.HasEquals, St.HasHash {
  readonly _tag = "Empty";
  readonly [_A]: () => never;
  readonly [_ParSeqBrand]: _ParSeqBrand = _ParSeqBrand;
  [St.equalsSym](that: unknown): boolean {
    return isParSeq(that) && this.equalsSafe(that).run()
  }
  get [St.hashSym](): number {
    return _emptyHash
  }
  equalsSafe(that: ParSeq<unknown>): IO<boolean> {
    return IO.succeed(that._tag === "Empty")
  }
}

export class Then<A> implements St.HasEquals, St.HasHash {
  readonly _tag = "Then";
  readonly [_A]: () => never;
  readonly [_ParSeqBrand]: _ParSeqBrand = _ParSeqBrand
  constructor(readonly left: ParSeq<A>, readonly right: ParSeq<A>) {}
  [St.equalsSym](that: unknown): boolean {
    return isParSeq(that) && this.equalsSafe(that).run()
  }
  get [St.hashSym](): number {
    return hashCode(this)
  }
  equalsSafe(that: ParSeq<unknown>): IO<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return IO.gen(function* (_) {
      return (
        (yield* _(self.eq(that))) ||
        (yield* _(symmetric(associateThen)(self, that))) ||
        (yield* _(symmetric(distributiveThen)(self, that))) ||
        (yield* _(symmetric(zero)(self, that)))
      )
    })
  }
  private eq(that: ParSeq<unknown>): IO<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    if (that._tag === "Then") {
      return IO.gen(function* (_) {
        return (
          (yield* _(self.left.equalsSafe(that.left))) &&
          (yield* _(self.right.equalsSafe(that.right)))
        )
      })
    }
    return IO.succeed(false)
  }
}

function associateThen<A>(self: ParSeq<A>, that: ParSeq<A>): IO<boolean> {
  return IO.gen(function* (_) {
    if (
      self._tag === "Then" &&
      self.left._tag === "Then" &&
      that._tag === "Then" &&
      that.right._tag === "Then"
    ) {
      const al = self.left.left
      const bl = self.left.right
      const cl = self.right
      const ar = that.left
      const br = that.right.left
      const cr = that.right.right
      return (
        (yield* _(al.equalsSafe(ar))) &&
        (yield* _(bl.equalsSafe(br))) &&
        (yield* _(cl.equalsSafe(cr)))
      )
    }
    return false
  })
}

function distributiveThen<A>(self: ParSeq<A>, that: ParSeq<A>): IO<boolean> {
  return IO.gen(function* (_) {
    if (
      self._tag === "Then" &&
      self.right._tag === "Both" &&
      that._tag === "Both" &&
      that.left._tag === "Then" &&
      that.right._tag === "Then"
    ) {
      const al = self.left
      const bl = self.right.left
      const cl = self.right.right
      const ar1 = that.left.left
      const br = that.left.right
      const ar2 = that.right.left
      const cr = that.right.right

      if (
        (yield* _(ar1.equalsSafe(ar2))) &&
        (yield* _(al.equalsSafe(ar1))) &&
        (yield* _(bl.equalsSafe(br))) &&
        (yield* _(cl.equalsSafe(cr)))
      ) {
        return true
      }
    }
    if (
      self._tag === "Then" &&
      self.left._tag === "Both" &&
      that._tag === "Both" &&
      that.left._tag === "Then" &&
      that.right._tag === "Then"
    ) {
      const al = self.left.left
      const bl = self.left.right
      const cl = self.right
      const ar = that.left.left
      const cr1 = that.left.right
      const br = that.right.left
      const cr2 = that.right.right

      if (
        (yield* _(cr1.equalsSafe(cr2))) &&
        (yield* _(al.equalsSafe(ar))) &&
        (yield* _(bl.equalsSafe(br))) &&
        (yield* _(cl.equalsSafe(cr1)))
      ) {
        return true
      }
    }
    return false
  })
}

export class Both<A> implements St.HasEquals, St.HasHash {
  readonly _tag = "Both";
  readonly [_A]: () => never;
  readonly [_ParSeqBrand]: _ParSeqBrand = _ParSeqBrand
  constructor(readonly left: ParSeq<A>, readonly right: ParSeq<A>) {}
  [St.equalsSym](that: unknown): boolean {
    return isParSeq(that) && this.equalsSafe(that).run()
  }
  get [St.hashSym](): number {
    return hashCode(this)
  }
  equalsSafe(that: ParSeq<unknown>): IO<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return IO.gen(function* (_) {
      return (
        (yield* _(self.eq(that))) ||
        (yield* _(symmetric(associativeBoth)(self, that))) ||
        (yield* _(symmetric(distributiveBoth)(self, that))) ||
        (yield* _(commutativeBoth(self, that))) ||
        (yield* _(symmetric(zero)(self, that)))
      )
    })
  }
  private eq(that: ParSeq<unknown>): IO<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    if (that._tag === "Both") {
      return IO.gen(function* (_) {
        return (
          (yield* _(self.left.equalsSafe(that.left))) &&
          (yield* _(self.right.equalsSafe(that.right)))
        )
      })
    }
    return IO.succeed(false)
  }
}

function associativeBoth<A>(self: ParSeq<A>, that: ParSeq<A>): IO<boolean> {
  return IO.gen(function* (_) {
    if (
      self._tag === "Both" &&
      self.left._tag === "Both" &&
      that._tag === "Both" &&
      that.right._tag === "Both"
    ) {
      const al = self.left.left
      const bl = self.left.right
      const cl = self.right
      const ar = that.left
      const br = that.right.left
      const cr = that.right.right
      return (
        (yield* _(al.equalsSafe(ar))) &&
        (yield* _(bl.equalsSafe(br))) &&
        (yield* _(cl.equalsSafe(cr)))
      )
    }
    return false
  })
}

function distributiveBoth<A>(self: ParSeq<A>, that: ParSeq<A>): IO<boolean> {
  return IO.gen(function* (_) {
    if (
      self._tag === "Both" &&
      self.left._tag === "Then" &&
      self.right._tag === "Then" &&
      that._tag === "Then" &&
      that.right._tag === "Both"
    ) {
      const al1 = self.left.left
      const bl = self.left.right
      const al2 = self.right.left
      const cl = self.right.right
      const ar = that.left
      const br = that.right.left
      const cr = that.right.right

      if (
        (yield* _(al1.equalsSafe(al2))) &&
        (yield* _(al1.equalsSafe(ar))) &&
        (yield* _(bl.equalsSafe(br))) &&
        (yield* _(cl.equalsSafe(cr)))
      ) {
        return true
      }
    }
    if (
      self._tag === "Both" &&
      self.left._tag === "Then" &&
      self.right._tag === "Then" &&
      that._tag === "Then" &&
      that.left._tag === "Both"
    ) {
      const al = self.left.left
      const cl1 = self.left.right
      const bl = self.right.left
      const cl2 = self.right.right
      const ar = that.left.left
      const br = that.left.right
      const cr = that.right

      if (
        (yield* _(cl1.equalsSafe(cl2))) &&
        (yield* _(al.equalsSafe(ar))) &&
        (yield* _(bl.equalsSafe(br))) &&
        (yield* _(cl1.equalsSafe(cr)))
      ) {
        return true
      }
    }
    return false
  })
}

function commutativeBoth(self: Both<unknown>, that: ParSeq<unknown>): IO<boolean> {
  return IO.gen(function* (_) {
    if (that._tag === "Both") {
      return (
        (yield* _(self.left.equalsSafe(that.right))) &&
        (yield* _(self.right.equalsSafe(that.left)))
      )
    }
    return false
  })
}

export class Single<A> implements St.HasEquals, St.HasHash {
  readonly _tag = "Single";
  readonly [_A]: () => never;
  readonly [_ParSeqBrand]: _ParSeqBrand = _ParSeqBrand
  constructor(readonly a: A) {}
  [St.equalsSym](that: unknown): boolean {
    return isParSeq(that) && this.equalsSafe(that).run()
  }
  get [St.hashSym](): number {
    return St.combineHash(St.hashString(this._tag), St.hash(this.a))
  }
  equalsSafe(that: ParSeq<unknown>): IO<boolean> {
    return IO.succeed(that._tag === "Single" && St.equals(this.a, that.a))
  }
}

function zero<A>(self: ParSeq<A>, that: ParSeq<A>) {
  if (self._tag === "Then" && self.right._tag === "Empty") {
    return self.left.equalsSafe(that)
  }
  if (self._tag === "Then" && self.left._tag === "Empty") {
    return self.right.equalsSafe(that)
  }
  if (self._tag === "Both" && self.right._tag === "Empty") {
    return self.left.equalsSafe(that)
  }
  if (self._tag === "Both" && self.left._tag === "Empty") {
    return self.right.equalsSafe(that)
  }
  return IO.succeed(false)
}

function symmetric<A>(f: (a: ParSeq<A>, b: ParSeq<A>) => IO<boolean>) {
  return (a: ParSeq<A>, b: ParSeq<A>) =>
    IO.gen(function* (_) {
      return (yield* _(f(a, b))) || (yield* _(f(b, a)))
    })
}

/**
 * Combines this collection of events with that collection of events to
 * return a new collection of events that represents this collection of
 * events in parallel with that collection of events.
 */
export function both_<A, A1>(left: ParSeq<A>, right: ParSeq<A1>): ParSeq<A | A1> {
  return isEmpty(left) ? right : isEmpty(right) ? left : new Both<A | A1>(left, right)
}

/**
 * Combines this collection of events with that collection of events to
 * return a new collection of events that represents this collection of
 * events in parallel with that collection of events.
 *
 * @ets_data_first both_
 */
export function both<A1>(right: ParSeq<A1>): <A>(left: ParSeq<A>) => ParSeq<A | A1> {
  return (left) => both_(left, right)
}

/**
 * Combines this collection of events with that collection of events to
 * return a new collection of events that represents this collection of
 * events followed by that collection of events.
 */
export function then_<A, A1>(left: ParSeq<A>, right: ParSeq<A1>): ParSeq<A | A1> {
  return isEmpty(left) ? right : isEmpty(right) ? left : new Then<A | A1>(left, right)
}

/**
 * Combines this collection of events with that collection of events to
 * return a new collection of events that represents this collection of
 * events followed by that collection of events.
 *
 * @ets_data_first then_
 */
export function then<A1>(right: ParSeq<A1>): <A>(left: ParSeq<A>) => ParSeq<A | A1> {
  return (left) => then_(left, right)
}

/**
 * Constructs a new collection of events that contains the specified event.
 */
export function single<A>(a: A): ParSeq<A> {
  return new Single(a)
}

/**
 * Empty collection of events
 */
export const empty: ParSeq<never> = new Empty()

function isEmptyLoop<A>(self: List<ParSeq<A>>): boolean {
  while (!self.isEmpty()) {
    const head = self.unsafeFirst()!
    const tail = self.tail()
    switch (head._tag) {
      case "Empty": {
        self = tail
        break
      }
      case "Single": {
        return false
      }
      case "Both": {
        self = tail.prepend(head.right).prepend(head.left)
        break
      }
      case "Then": {
        self = tail.prepend(head.right).prepend(head.left)
        break
      }
    }
  }
  return true
}

/**
 * Checks if the ParSeq is empty
 */
export function isEmpty<A>(self: ParSeq<A>): boolean {
  return isEmptyLoop(List.single(self))
}

function stepLoop<A>(
  cause: ParSeq<A>,
  stack: List<ParSeq<A>>,
  parallel: HS.HashSet<ParSeq<A>>,
  sequential: List<ParSeq<A>>
): Tuple<[HS.HashSet<ParSeq<A>>, List<ParSeq<A>>]> {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    switch (cause._tag) {
      case "Empty": {
        if (stack.isEmpty()) {
          return Tuple(parallel, sequential)
        } else {
          cause = stack.unsafeFirst()!
          stack = stack.tail()
        }
        break
      }
      case "Both": {
        stack = stack.prepend(cause.right)
        cause = cause.left
        break
      }
      case "Then": {
        const left = cause.left
        const right = cause.right
        switch (left._tag) {
          case "Empty": {
            cause = cause.right
            break
          }
          case "Then": {
            cause = then_(left.left, then_(left.right, right))
            break
          }
          case "Both": {
            cause = both_(then_(left.left, right), then_(left.right, right))
            break
          }
          default: {
            cause = left
            sequential = sequential.prepend(right)
          }
        }
        break
      }
      default: {
        if (stack.isEmpty()) {
          return Tuple(HS.add_(parallel, cause), sequential)
        } else {
          parallel = HS.add_(parallel, cause)
          cause = stack.unsafeFirst()!
          stack = stack.tail()
          break
        }
      }
    }
  }
  throw new Error("Bug")
}

function step<A>(self: ParSeq<A>): Tuple<[HS.HashSet<ParSeq<A>>, List<ParSeq<A>>]> {
  return stepLoop(self, List.empty(), HS.make(), List.empty())
}

function flattenLoop<A>(
  causes: List<ParSeq<A>>,
  flattened: List<HS.HashSet<ParSeq<A>>>
): List<HS.HashSet<ParSeq<A>>> {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    const {
      tuple: [parallel, sequential]
    } = causes.reduce(
      Tuple(HS.make<ParSeq<A>>(), List.empty<ParSeq<A>>()),
      ({ tuple: [parallel, sequential] }, cause) => {
        const [set, seq] = step(cause).tuple
        return Tuple(HS.union_(parallel, set), sequential + seq)
      }
    )
    const updated = HS.size(parallel) > 0 ? flattened.prepend(parallel) : flattened
    if (sequential.isEmpty()) {
      return updated.reverse()
    } else {
      causes = sequential
      flattened = updated
    }
  }
  throw new Error("Bug")
}

function flatten<A>(self: ParSeq<A>) {
  return flattenLoop(List.single(self), List.empty())
}

function hashCode(self: ParSeq<unknown>) {
  const flat = flatten(self)
  const size = flat.size
  let head
  if (size === 0) {
    return _emptyHash
  } else if (size === 1 && (head = flat.unsafeFirst()!) && HS.size(head) === 1) {
    return List.from(head).unsafeFirst()![St.hashSym]
  } else {
    return St.hashIterator(flat[Symbol.iterator]())
  }
}
