import type { UIO } from "../Effect/definition"
import { Clock } from "./definition"

export class ProxyClock extends Clock {
  constructor(
    readonly currentTime: UIO<number>,
    readonly sleep: (ms: number, __trace?: string) => UIO<void>
  ) {
    super()
  }
}
