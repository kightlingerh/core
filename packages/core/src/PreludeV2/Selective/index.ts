// ets_tracing: off

import * as EI from "@effect-ts/system/Either"

import { constant, identity, pipe } from "../../Function"
import * as HKT from "../../PreludeV2/HKT"
import type { Any } from "../Any"
import type { Applicative } from "../Applicative"
import type { Covariant } from "../Covariant"
import { chainF, succeedF } from "../DSL"
import type { Monad } from "../Monad"

export interface Select<F extends HKT.HKT> {
  readonly select: <X, I2, R2, E2, A, B>(
    fab: HKT.Kind<F, X, I2, R2, E2, (a: A) => B>
  ) => <I, R, E, B2>(
    fa: HKT.Kind<F, X, I, R, E, EI.Either<A, B2>>
  ) => HKT.Kind<F, X, I2 & I, R2 & R, E2 | E, B | B2>
}

export type Selective<F extends HKT.HKT> = Select<F> & Covariant<F> & Any<F>

export type SelectiveMonad<F extends HKT.HKT> = Selective<F> & Monad<F>

export function monad<F extends HKT.HKT>(F_: Monad<F>): SelectiveMonad<F> {
  return HKT.instance<SelectiveMonad<F>>({
    ...F_,
    select:
      <X, I2, R2, E2, A, B>(fab: HKT.Kind<F, X, I2, R2, E2, (a: A) => B>) =>
      <I, R, E, B2>(
        fa: HKT.Kind<F, X, I, R, E, EI.Either<A, B2>>
      ): HKT.Kind<F, X, I2 & I, R2 & R, E2 | E, B | B2> =>
        pipe(
          fa,
          chainF(F_)(
            EI.fold(
              (a) =>
                pipe(
                  fab,
                  F_.map((g) => g(a))
                ),
              (b) => succeedF(F_)<B | B2, X, I & I2, R & R2, E | E2>(b)
            )
          )
        )
  })
}

export function applicative<F extends HKT.HKT>(F_: Applicative<F>): Selective<F> {
  return HKT.instance<Selective<F>>({
    ...F_,
    select: (fab) => (fa) =>
      pipe(
        fa,
        F_.both(fab),
        F_.map(({ tuple: [ea, f] }) => EI.fold_(ea, f, identity))
      )
  })
}

export const branchF =
  <F extends HKT.HKT>(F_: Selective<F>) =>
  <X, I2, R2, E2, A, D1, X3, I3, R3, E3, B, D2>(
    lhs: HKT.Kind<F, X, I2, R2, E2, (a: A) => D1>,
    rhs: HKT.Kind<F, X, I3, R3, E3, (a: B) => D2>
  ) =>
  <I, R, E>(
    fe: HKT.Kind<F, X, I, R, E, EI.Either<A, B>>
  ): HKT.Kind<F, X, I & I2 & I3, R & R2 & R3, E | E2 | E3, D1 | D2> => {
    return pipe(
      fe,
      F_.map(EI.map(EI.left)),
      F_.select(
        pipe(
          lhs,
          F_.map((fac) => (x) => pipe(x, fac, EI.right, EI.widenE<B>()))
        )
      ),
      F_.select(rhs)
    )
  }

export const ifF =
  <F extends HKT.HKT>(F_: Selective<F>) =>
  <X, I2, R2, E2, A, I3, R3, E3, B>(
    then_: HKT.Kind<F, X, I2, R2, E2, A>,
    else_: HKT.Kind<F, X, I3, R3, E3, B>
  ) =>
  <I, S, R, E>(
    if_: HKT.Kind<F, X, I, R, E, boolean>
  ): HKT.Kind<F, X, I & I2 & I3, R & R2 & R3, E | E2 | E3, A | B> =>
    pipe(
      if_,
      F_.map((x) => (x ? EI.left(undefined) : EI.right(undefined))),
      branchF(F_)(pipe(then_, F_.map(constant)), pipe(else_, F_.map(constant)))
    )

export const whenF =
  <F extends HKT.HKT>(F_: Selective<F>) =>
  <X, I2, R2, E2>(act: HKT.Kind<F, X, I2, R2, E2, void>) =>
  <I, R, E>(
    if_: HKT.Kind<F, X, I, R, E, boolean>
  ): HKT.Kind<F, X, I & I2, R & R2, E | E2, void> =>
    pipe(if_, ifF(F_)(act, succeedF(F_)(undefined)))
