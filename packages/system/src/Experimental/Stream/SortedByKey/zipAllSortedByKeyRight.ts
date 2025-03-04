// ets_tracing: off

import type * as Tp from "../../../Collections/Immutable/Tuple/index.js"
import { identity } from "../../../Function/index.js"
import type * as OD from "../../../Ord/index.js"
import type * as S from "../_internal/core.js"
import type * as C from "./core.js"
import * as ZipAllSortedByKeyWith from "./zipAllSortedByKeyWith.js"

/**
 * Zips this stream that is sorted by distinct keys and the specified
 * stream that is sorted by distinct keys to produce a new stream that is
 * sorted by distinct keys. Keeps only values from that stream, using the
 * specified value `default` to fill in missing values.
 *
 * This allows zipping potentially unbounded streams of data by key in
 * constant space but the caller is responsible for ensuring that the
 * streams are sorted by distinct keys.
 */
export function zipAllSortedByKeyRight_<R, R1, E, E1, K, A, B>(
  self: C.SortedByKey<R, E, K, A>,
  that: S.Stream<R1, E1, Tp.Tuple<[K, B]>>,
  default_: B,
  ord: OD.Ord<K>
): S.Stream<R & R1, E | E1, Tp.Tuple<[K, B]>> {
  return ZipAllSortedByKeyWith.zipAllSortedByKeyWith_(
    self,
    that,
    (_) => default_,
    identity,
    (_, b) => b,
    ord
  )
}

/**
 * Zips this stream that is sorted by distinct keys and the specified
 * stream that is sorted by distinct keys to produce a new stream that is
 * sorted by distinct keys. Keeps only values from that stream, using the
 * specified value `default` to fill in missing values.
 *
 * This allows zipping potentially unbounded streams of data by key in
 * constant space but the caller is responsible for ensuring that the
 * streams are sorted by distinct keys.
 *
 * @ets_data_first zipAllSortedByKeyRight_
 */
export function zipAllSortedByKeyRight<R1, E1, K, A, B>(
  that: S.Stream<R1, E1, Tp.Tuple<[K, B]>>,
  default_: B,
  ord: OD.Ord<K>
) {
  return <R, E>(self: C.SortedByKey<R, E, K, A>) =>
    zipAllSortedByKeyRight_(self, that, default_, ord)
}
