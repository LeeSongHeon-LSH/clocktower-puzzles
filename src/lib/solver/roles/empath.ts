// 초공감자: 매일 밤, 생존한 양옆 이웃 중 악인 수를 배운다 (죽은 좌석은 건너뛴다).

import { aliveNeighbors, Ctx, view } from "../ctx";
import { canRegisterEvil, mustRegisterEvil } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "empath" }>;

export function empath(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  const alive = ctx.sched.aliveAfterNight(night);
  const neighbors = aliveNeighbors(alive, seat);
  if (neighbors === null) return data.count === 0;
  const v = view(ctx, night);
  const uniq = neighbors[0] === neighbors[1] ? [neighbors[0]] : neighbors;
  let min = 0;
  let max = 0;
  for (const t of uniq) {
    if (mustRegisterEvil(v, t)) { min++; max++; }
    else if (canRegisterEvil(v, t)) max++;
  }
  return data.count >= min && data.count <= max;
}
