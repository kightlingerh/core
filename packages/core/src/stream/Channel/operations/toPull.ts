import { Either } from "../../../data/Either"
import { identity } from "../../../data/Function"
import { Effect } from "../../../io/Effect"
import { Managed } from "../../../io/Managed"
import { ChannelExecutor, readUpstream } from "../ChannelExecutor"
import type { ChannelState } from "../ChannelState"
import {
  ChannelStateDoneTypeId,
  ChannelStateEffectTypeId,
  ChannelStateEmitTypeId,
  ChannelStateReadTypeId,
  concreteChannelState
} from "../ChannelState"
import type { Channel } from "../definition"

/**
 * Interpret a `Channel` to a managed pull.
 *
 * @tsplus fluent ets/Channel toPull
 */
export function toPull<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
): Managed<Env, never, Effect<Env, OutErr, Either<OutDone, OutElem>>> {
  return Managed.acquireReleaseExitWith(
    Effect.succeed(new ChannelExecutor(() => self, undefined, identity)),
    (exec, exit) => {
      const finalize = exec.close(exit)
      return finalize == null ? Effect.unit : finalize
    }
  ).map((exec) =>
    Effect.suspendSucceed(interpret(exec.run() as ChannelState<Env, OutErr>, exec))
  )
}

function interpret<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  channelState: ChannelState<Env, OutErr>,
  exec: ChannelExecutor<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
): Effect<Env, OutErr, Either<OutDone, OutElem>> {
  concreteChannelState(channelState)
  switch (channelState._typeId) {
    case ChannelStateDoneTypeId: {
      return exec.getDone().fold(
        (cause) => Effect.failCause(cause),
        (done): Effect<Env, OutErr, Either<OutDone, OutElem>> =>
          Effect.succeed(Either.left(done))
      )
    }
    case ChannelStateEmitTypeId: {
      return Effect.succeed(Either.right(exec.getEmit()))
    }
    case ChannelStateEffectTypeId: {
      return (
        channelState.effect > interpret(exec.run() as ChannelState<Env, OutErr>, exec)
      )
    }
    case ChannelStateReadTypeId: {
      return readUpstream(channelState, () =>
        interpret(exec.run() as ChannelState<Env, OutErr>, exec)
      )
    }
  }
}
