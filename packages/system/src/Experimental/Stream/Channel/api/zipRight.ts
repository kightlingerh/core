// ets_tracing: off

import * as Tp from "../../../../Collections/Immutable/Tuple/index.js"
import type * as C from "../core.js"
import * as Map from "./map.js"
import * as Zip from "./zip.js"

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with the terminal value of the other channel.
 */
export function zipRight_<
  Env,
  Env1,
  InErr,
  InErr1,
  InElem,
  InElem1,
  InDone,
  InDone1,
  OutErr,
  OutErr1,
  OutElem,
  OutElem1,
  OutDone,
  OutDone1
>(
  self: C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  that: C.Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>
): C.Channel<
  Env & Env1,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr1 | OutErr,
  OutElem1 | OutElem,
  OutDone1
> {
  return Map.map_(Zip.zip_(self, that), Tp.get(1))
}

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with the terminal value of the other channel.
 *
 * @ets_data_first zipRight_
 */
export function zipRight<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: C.Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
  ) => zipRight_(self, that)
}
