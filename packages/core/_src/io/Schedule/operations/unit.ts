/**
 * Returns a new schedule that maps the output of this schedule to unit.
 *
 * @tsplus getter ets/Schedule unit
 * @tsplus getter ets/Schedule/WithState unit
 */
export function unit<State, Env, In, Out>(
  self: Schedule<State, Env, In, Out>
): Schedule<State, Env, In, void> {
  return self.as(() => undefined)
}
