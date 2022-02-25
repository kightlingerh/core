import { Tuple } from "../../../collection/immutable/Tuple"
import { Effect } from "../../Effect"
import { ExecutionStrategy } from "../../ExecutionStrategy"
import { Exit } from "../../Exit"
import { currentReleaseMap } from "../../FiberRef/definition/data"
import { get as fiberRefGet } from "../../FiberRef/operations/get"
import { locally_ } from "../../FiberRef/operations/locally"
import { Managed } from "../definition"
import { ReleaseMap } from "../ReleaseMap"

/**
 * Preallocates the managed resource, resulting in a `Managed` that reserves
 * and acquires immediately and cannot fail. You should take care that you are
 * not interrupted between running preallocate and actually acquiring the
 * resource as you might leak otherwise.
 *
 * @tsplus fluent ets/Managed preallocate
 */
export function preallocate<R, E, A>(
  self: Managed<R, E, A>,
  __tsplusTrace?: string
): Effect<R, E, Managed<unknown, never, A>> {
  return Effect.uninterruptibleMask(({ restore }) =>
    Effect.Do()
      .bind("releaseMap", () => ReleaseMap.make)
      .bind("tp", ({ releaseMap }) =>
        restore(locally_(currentReleaseMap.value, releaseMap)(self.effect)).exit()
      )
      .flatMap(({ releaseMap, tp }) =>
        tp.foldEffect(
          (cause) =>
            releaseMap
              .releaseAll(Exit.fail(cause), ExecutionStrategy.Sequential)
              .flatMap(() => Effect.failCauseNow(cause)),
          ({ tuple: [release, a] }) =>
            Effect.succeed(
              Managed<unknown, never, A>(
                fiberRefGet(currentReleaseMap.value).flatMap((releaseMap) =>
                  releaseMap.add(release).map((_) => Tuple(_, a))
                )
              )
            )
        )
      )
  )
}
