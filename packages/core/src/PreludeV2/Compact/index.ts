// ets_tracing: off

import type { Option } from "@effect-ts/system/Option"

import type * as HKT from "../HKT/index.js"

export interface Compact<F extends HKT.HKT> extends HKT.Typeclass<F> {
  readonly compact: <X, I, R, E, A>(
    fa: HKT.Kind<F, X, I, R, E, Option<A>>
  ) => HKT.Kind<F, X, I, R, E, A>
}
