import * as O from "../../../data/Option"
import type { Scope } from "../../Scope"
import type { Effect } from "../definition"
import { IOverrideForkScope } from "../definition"
import { forkScopeWith } from "./forkScopeWith"

export class ForkScopeRestore {
  constructor(private scope: Scope) {}

  readonly restore = <R, E, A>(
    fa: Effect<R, E, A>,
    __etsTrace?: string
  ): Effect<R, E, A> => new IOverrideForkScope(fa, O.some(this.scope), __etsTrace)
}

/**
 * Captures the fork scope, before overriding it with the specified new
 * scope, passing a function that allows restoring the fork scope to
 * what it was originally.
 *
 * @tsplus static ets/EffectOps forkScopeMask
 */
export function forkScopeMask_<R, E, A>(
  newScope: Scope,
  f: (restore: ForkScopeRestore) => Effect<R, E, A>,
  __etsTrace?: string
) {
  return forkScopeWith(
    (scope) =>
      new IOverrideForkScope(
        f(new ForkScopeRestore(scope)),
        O.some(newScope),
        __etsTrace
      )
  )
}

/**
 * Captures the fork scope, before overriding it with the specified new
 * scope, passing a function that allows restoring the fork scope to
 * what it was originally.
 *
 * @ets_data_first forkScopeMask_
 */
export function forkScopeMask<R, E, A>(
  f: (restore: ForkScopeRestore) => Effect<R, E, A>,
  __etsTrace?: string
) {
  return (newScope: Scope) => forkScopeMask_(newScope, f)
}
