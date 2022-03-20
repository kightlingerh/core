// ets_tracing: off

import type * as HKT from "../HKT/index.js"

export interface ReduceWithIndex<K, F extends HKT.HKT> extends HKT.Typeclass<F> {
  readonly reduceWithIndex: ReduceWithIndexFn<K, F>
}

export interface ReduceWithIndexFn<K, F extends HKT.HKT> {
  <A, B>(b: B, f: (k: K, b: B, a: A) => B): <X, I, R, E>(
    fa: HKT.Kind<F, X, I, R, E, A>
  ) => B
}
