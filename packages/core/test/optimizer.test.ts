import * as C from "../src/Const/index.js"
import { pipe } from "../src/Function/index.js"

describe("Optimizer", () => {
  it("should not break Const", () => {
    expect(
      pipe(
        C.makeConst("ok")(),
        C.mapLeft((s) => `s: ${s}`)
      )
    ).toEqual(`s: ok`)
  })
})
