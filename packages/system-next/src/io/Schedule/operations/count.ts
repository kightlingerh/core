import { Schedule } from "../definition"

/**
 * A schedule that always recurs, which counts the number of recurrences.
 *
 * @tsplus static ets/ScheduleOps count
 */
export const count: Schedule.WithState<number, unknown, unknown, number> =
  Schedule.unfold(0, (n) => n + 1)
