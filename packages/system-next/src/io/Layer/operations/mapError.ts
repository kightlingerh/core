import { Layer } from "../definition"

/**
 * Returns a layer with its error channel mapped using the specified function.
 *
 * @tsplus fluent ets/Layer mapError
 */
export function mapError_<R, E, E1, A>(
  self: Layer<R, E, A>,
  f: (e: E) => E1
): Layer<R, E1, A> {
  return self.catchAll((e) => Layer.fail(f(e)))
}

/**
 * Returns a layer with its error channel mapped using the specified function.
 *
 * @ets_data_first mapError_
 */
export function mapError<E, E1>(f: (e: E) => E1) {
  return <R, A>(self: Layer<R, E, A>): Layer<R, E1, A> => self.mapError(f)
}
