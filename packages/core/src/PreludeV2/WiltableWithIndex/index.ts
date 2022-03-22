// ets_tracing: off

import type { Either } from "@effect-ts/system/Either"

import type * as Tp from "../../Collections/Immutable/Tuple/index.js"
import type { Applicative } from "../Applicative/index.js"
import type * as HKT from "../HKT/index.js"

export interface WiltWithIndex<K, F extends HKT.HKT> extends HKT.Typeclass<F> {
  <G extends HKT.HKT>(F: Applicative<G>): <GX, GI, GR, GE, A, B, B2>(
    f: (k: K, a: A) => HKT.Kind<G, GX, GI, GR, GE, Either<B, B2>>
  ) => <FX, FI, FR, FE>(
    ta: HKT.Kind<F, FX, FI, FR, FE, A>
  ) => HKT.Kind<
    G,
    GX,
    GI,
    GR,
    GE,
    Tp.Tuple<[HKT.Kind<F, FX, FI, FR, FE, B>, HKT.Kind<F, FX, FI, FR, FE, B2>]>
  >
}

export interface WiltableWithIndex<K, F extends HKT.HKT> {
  readonly separateWithIndexF: WiltWithIndex<K, F>
}

export function implementSeparateWithIndexF<K, F extends HKT.HKT>(): (
  i: <X, I, R, E, A, B, B2, G extends HKT.HKT>(_: {
    A: A
    B: B
    G: G
    X: X
    I: I
    R: R
    E: E
  }) => (
    G: Applicative<G>
  ) => (
    f: (k: K, a: A) => HKT.Kind<G, X, I, R, E, Either<B, B2>>
  ) => (
    ta: HKT.Kind<F, X, I, R, E, A>
  ) => HKT.Kind<
    G,
    X,
    I,
    R,
    E,
    Tp.Tuple<[HKT.Kind<F, X, I, R, E, B>, HKT.Kind<F, X, I, R, E, B2>]>
  >
) => WiltWithIndex<K, F>
export function implementSeparateWithIndexF() {
  return (i: any) => i()
}
