import * as HS from "../../src/Collections/Immutable/HashSet/index.js"
import { pipe } from "../../src/Function/index.js"

describe("HashSet", () => {
  it("maps", () => {
    const initial = pipe(HS.make<number>(), HS.add(1), HS.add(2), HS.add(3), HS.add(4))
    const mapped = HS.map_(initial, (x) => x * 2)

    expect([...mapped]).toEqual([2, 4, 6, 8])
  })
  it("from", () => {
    expect(HS.from([1, 2])).toEqual(pipe(HS.make<number>(), HS.add(1), HS.add(2)))
  })
})
