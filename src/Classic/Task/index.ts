import { pipe, tuple } from "../../Function"
import type { TaskURI } from "../../Modules"
import * as P from "../../Prelude"
import { bindF, chainF, doF, structF } from "../../Prelude/DSL"

export interface Task<A> {
  (): Promise<A>
}

export const Any = P.instance<P.Any<[TaskURI]>>({
  any
})

export const AssociativeFlatten = P.instance<P.AssociativeFlatten<[TaskURI]>>({
  flatten
})

export const IdentityFlatten = P.instance<P.IdentityFlatten<[TaskURI]>>({
  ...Any,
  flatten
})

export const Covariant = P.instance<P.Covariant<[TaskURI]>>({
  map
})

export const Monad = P.instance<P.Monad<[TaskURI]>>({
  ...Covariant,
  ...IdentityFlatten
})

export const AssociativeBoth = P.instance<P.AssociativeBoth<[TaskURI]>>({
  both: zip
})

export const Applicative = P.instance<P.Applicative<[TaskURI]>>({
  ...Any,
  ...Covariant,
  ...AssociativeBoth
})

export const ApplicativePar = P.instance<P.Applicative<[TaskURI]>>({
  ...Any,
  ...Covariant,
  both: zipPar
})

export function zip<B>(fb: Task<B>): <A>(fa: Task<A>) => Task<readonly [A, B]> {
  return (fa) => () => fa().then((a) => fb().then((b) => tuple(a, b)))
}

export function zipPar<B>(fb: Task<B>): <A>(fa: Task<A>) => Task<readonly [A, B]> {
  return (fa) => () => Promise.all([fa(), fb()])
}

export function flatten<A>(ffa: Task<Task<A>>): Task<A> {
  return () => ffa().then((x) => x())
}

export function map<A, B>(f: (a: A) => B): (fa: Task<A>) => Task<B> {
  return (fa) => () => fa().then(f)
}

export function sync<A>(f: () => A): Task<A> {
  return () => Promise.resolve(f())
}

export function async<A>(f: () => Promise<A>): Task<A> {
  return f
}

export function delay(millis: number): <A>(ma: Task<A>) => Task<A> {
  return (ma) => () =>
    new Promise((resolve) => {
      setTimeout(() => {
        ma().then(resolve)
      }, millis)
    })
}

export function any(): Task<unknown> {
  return () => Promise.resolve({})
}

export const of = doF(Monad)

export const bind = bindF(Monad)

export const struct = structF(Applicative)

export const structPar = structF(ApplicativePar)

export const chain = chainF(Monad)

export function tap<A, B>(f: (a: A) => Task<B>) {
  return (fa: Task<A>) =>
    pipe(
      fa,
      chain((a) =>
        pipe(
          f(a),
          map(() => a)
        )
      )
    )
}
