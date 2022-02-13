// ets_tracing: off

import type * as HKT from "../HKT"

export interface Invariant<F extends HKT.HKT> {
  readonly invmap: <A, B>(fg: {
    f: (a: A) => B
    g: (b: B) => A
  }) => {
    f: <X, I, R, E>(ma: HKT.Kind<F, X, I, R, E, A>) => HKT.Kind<F, X, I, R, E, B>
    g: <X, I, R, E>(ma: HKT.Kind<F, X, I, R, E, B>) => HKT.Kind<F, X, I, R, E, A>
  }
}
