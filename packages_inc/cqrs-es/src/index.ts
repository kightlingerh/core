import {} from "@matechs/morphic/batteries/interpreter"
import {} from "@matechs/morphic/model/interpreter"
import {} from "@matechs/morphic/batteries/summoner"

import { sendEvent, eventStoreTcpConnection } from "./client"
import { adaptMeta } from "./meta"
import { ormOffsetStore } from "./offset"
import { readEvents } from "./read"

import * as T from "@matechs/core/Effect"
import { pipe } from "@matechs/core/Function"
import * as M from "@matechs/core/Managed"
import * as NEA from "@matechs/core/NonEmptyArray"
import * as O from "@matechs/core/Option"
import { Aggregate, ReadSideConfig, EventMetaHidden } from "@matechs/cqrs"
import { ElemType } from "@matechs/morphic/adt/utils"
import { InterpreterURI } from "@matechs/morphic/batteries/interpreter"
import { ProgramURI } from "@matechs/morphic/batteries/usage/program-type"
import { AOfTypes } from "@matechs/morphic/batteries/usage/tagged-union"

const aggregateRead = <
  Types extends {
    [k in keyof Types]: [any, any]
  },
  Tag extends string,
  ProgURI extends ProgramURI,
  InterpURI extends InterpreterURI,
  Keys extends NEA.NonEmptyArray<keyof Types>,
  Db extends symbol | string,
  Env
>(
  agg: Aggregate<Types, Tag, ProgURI, InterpURI, Keys, Db, Env>
) => (config: ReadSideConfig) =>
  M.use(eventStoreTcpConnection, (connection) =>
    agg.readAll(config)((_) => T.traverseArray(sendEvent(connection)))
  )

export const aggregate = <
  Types extends {
    [k in keyof Types]: [any, any]
  },
  Tag extends string,
  ProgURI extends ProgramURI,
  InterpURI extends InterpreterURI,
  Keys extends NEA.NonEmptyArray<keyof Types>,
  Db extends symbol | string,
  Env
>(
  agg: Aggregate<Types, Tag, ProgURI, InterpURI, Keys, Db, Env>
) => ({
  dispatcher: aggregateRead(agg),
  read: (readId: string) => <S2, R2, E2>(
    process: (
      a: AOfTypes<{ [k in Extract<keyof Types, ElemType<Keys>>]: Types[k] }> &
        EventMetaHidden
    ) => T.Effect<S2, R2, E2, void>
  ) =>
    readEvents(readId)(`$ce-${agg.aggregate}`)(
      T.liftEither((x) => agg.adt.decode(x))
    )((a) =>
      pipe(adaptMeta(a), (meta) =>
        O.isSome(meta)
          ? process({ ...a, ...meta.value })
          : T.raiseAbort(new Error("cannot decode metadata"))
      )
    )(ormOffsetStore(agg.db))((x) => agg.db.withTransaction(x))
})

export { EventStoreError, EventStoreConfig, eventStoreURI } from "./client"
export { offsetStore, OffsetStore, readEvents } from "./read"
export { TableOffset, ormOffsetStore } from "./offset"
