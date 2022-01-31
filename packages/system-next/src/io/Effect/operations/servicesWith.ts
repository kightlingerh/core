import * as A from "../../../collection/immutable/Array"
import * as D from "../../../collection/immutable/Dictionary"
import type { Has, Tag } from "../../../data/Has"
import type { UnionToIntersection } from "../../../data/Utils"
import { Effect } from "../definition"

// TODO(Mike/Max): improve naming

/**
 * Access a record of services with the required service entries.
 *
 * @ets static ets/EffectOps servicesWithS
 */
export function servicesWithS<SS extends Record<string, Tag<any>>>(s: SS) {
  return <B>(
    f: (a: {
      [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
    }) => B,
    __etsTrace?: string
  ) =>
    Effect.environmentWith(
      (
        r: UnionToIntersection<
          {
            [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : unknown
          }[keyof SS]
        >
      ) => f(D.map_(s, (v) => r[v.key]) as any)
    )
}

/**
 * Access a tuple of services with the required service entries.
 *
 * @ets static ets/EffectOps servicesWithT
 */
export function servicesWithT<SS extends Tag<any>[]>(...s: SS) {
  return <B = unknown>(
    f: (
      ...a: {
        [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
      }
    ) => B,
    __etsTrace?: string
  ) =>
    Effect.environmentWith(
      (
        r: UnionToIntersection<
          {
            [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : never
          }[keyof SS & number]
        >
      ) => f(...(A.map_(s, (v) => r[v.key]) as any))
    )
}
