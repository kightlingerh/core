import type { LazyArg } from "../../../data/Function"
import type { Channel } from "../definition"
import { Suspend } from "../definition"

/**
 * @tsplus static ets/ChannelOps suspend
 */
export function suspend<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  effect: LazyArg<Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return new Suspend(effect)
}
