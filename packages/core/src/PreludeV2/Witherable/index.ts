// ets_tracing: off

import type { Option } from "@effect-ts/system/Option"

import type { Applicative } from "../Applicative/index.js"
import type * as HKT from "../HKT/index.js"

export interface Wither<F extends HKT.HKT> extends HKT.Typeclass<F> {
  <G extends HKT.HKT>(F: Applicative<G>): <GX, GI, GR, GE, A, B>(
    f: (a: A) => HKT.Kind<G, GX, GI, GR, GE, Option<B>>
  ) => <FX, FI, FR, FE>(
    ta: HKT.Kind<F, FX, FI, FR, FE, A>
  ) => HKT.Kind<G, GX, GI, GR, GE, HKT.Kind<F, FX, FI, FR, FE, B>>
}

export interface Witherable<F extends HKT.HKT> {
  readonly compactF: Wither<F>
}
