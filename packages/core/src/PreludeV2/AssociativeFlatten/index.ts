import type * as HKT from "../HKT/index.js"

export interface AssociativeFlatten<F extends HKT.HKT> extends HKT.Typeclass<F> {
  readonly flatten: <X, I, R, E, A, I2, R2, E2>(
    ffa: HKT.Kind<F, X, I2, R2, E2, HKT.Kind<F, X, I, R, E, A>>
  ) => HKT.Kind<F, X, I & I2, R2 & R, E2 | E, A>
}
