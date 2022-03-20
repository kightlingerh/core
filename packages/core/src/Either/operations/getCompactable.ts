// ets_tracing: off

import type { EitherFixedLeftF } from "@effect-ts/core/Either"

import type { Identity } from "../../Identity/index.js"
import * as P from "../../PreludeV2/index.js"
import { getCompact } from "./compactOption.js"
import { getSeparate } from "./separate.js"

/**
 * Get `Compactable` instance given `Identity<E>`
 */
export function getCompactable<E>(M: Identity<E>) {
  const C = getCompact(M)
  const S = getSeparate(M)
  return P.instance<P.Compactable<EitherFixedLeftF<E>>>({
    ...C,
    ...S
  })
}
