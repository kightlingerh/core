import * as M from "@effect-ts/system/Collections/Immutable/Map"
import * as Tp from "@effect-ts/system/Collections/Immutable/Tuple"
import { flow, identity, pipe } from "@effect-ts/system/Function"

import * as E from "../../src/Either/index.js"
import * as EitherT from "../../src/EitherT/index.js"
import * as DSL from "../../src/Prelude/DSL/index.js"
import type * as H from "../../src/Prelude/HKT/index.js"
import * as P from "../../src/Prelude/index.js"
import * as T from "../../src/XPure/index.js"
import * as R from "../../src/XPure/XReader/index.js"
import * as ReaderT from "../../src/XPure/XReaderT/index.js"

type State<K, V> = M.Map<K, V>

export interface Store<K, V, A>
  extends T.XPure<unknown, State<K, V>, State<K, V>, unknown, never, A> {}

export const KeyValueStoreURI = "KeyValueStore"
export interface KeyValueStoreURI<K, V>
  extends H.URI<typeof KeyValueStoreURI, Params<K, V>> {}

type StoreKey = "StoreKey"
type StoreValue = "StoreValue"
type Params<K, V> = H.CustomType<StoreKey, K> & H.CustomType<StoreValue, V>

declare module "../../src/Prelude/HKT" {
  export interface URItoKind<FC, TC, K, Q, W, X, I, S, R, E, A> {
    [KeyValueStoreURI]: Store<
      H.AccessCustom<FC, StoreKey>,
      H.AccessCustom<FC, StoreValue>,
      A
    >
  }
}

export const getStoreMonad = <K, V>() =>
  P.instance<P.Monad<[KeyValueStoreURI<K, V>]>>({
    any: () => T.Any.any(),
    flatten: (ffa) => T.chain_(ffa, identity),
    map: T.map
  })

export const K = pipe(getStoreMonad<string, number>(), EitherT.monad, ReaderT.monad)

export const chain = DSL.chainF(K)

export const succeed = DSL.succeedF(K)

test("17", () => {
  const result = pipe(
    succeed("hello"),
    R.map(
      T.chain(
        E.fold(
          (e) => T.succeed(E.left(e)),
          (v) =>
            T.modify(
              flow(
                M.toMutable,
                (s) => s.set(v, v.length),
                M.fromMutable,
                (s) => Tp.tuple(s, E.right(v.length))
              )
            )
        )
      )
    ),
    chain((x) => T.accessM((y: number) => succeed(x * y))),
    R.runEnv(2),
    T.runState(M.empty)
  )

  expect(result).toEqual(Tp.tuple(M.singleton("hello", 5), E.right(10)))
})
