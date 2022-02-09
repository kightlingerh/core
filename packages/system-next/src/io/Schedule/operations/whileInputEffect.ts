import type { RIO } from "../../Effect"
import type { Schedule } from "../definition"

/**
 * Returns a new schedule that continues for as long the specified effectful
 * predicate on the input evaluates to true.
 *
 * @tsplus fluent ets/Schedule whileInputEffect
 * @tsplus fluent ets/ScheduleWithState whileInputEffect
 */
export function whileInputEffect_<State, Env, In, Out, Env1>(
  self: Schedule.WithState<State, Env, In, Out>,
  f: (input: In) => RIO<Env1, boolean>
): Schedule.WithState<State, Env & Env1, In, Out> {
  return self.checkEffect((input, _) => f(input))
}

/**
 * Returns a new schedule that continues for as long the specified effectful
 * predicate on the input evaluates to true.
 *
 * @ets_data_first whileInputEffect_
 */
export function whileInputEffect<Env1, In>(f: (input: In) => RIO<Env1, boolean>) {
  return <State, Env, Out>(
    self: Schedule.WithState<State, Env, In, Out>
  ): Schedule.WithState<State, Env & Env1, In, Out> => self.whileInputEffect(f)
}
