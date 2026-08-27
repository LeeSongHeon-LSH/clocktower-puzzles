// 예언자: 밤2부터 매일 밤, 죽은 플레이어 중 악인 수를 배운다.
// 죽은 은둔자는 악으로, 죽은 첩자는 선으로 오등록될 수 있다 (초공감자와 같은 min/max).

import { Ctx, view } from "../ctx";
import { canRegisterEvil, mustRegisterEvil } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "oracle" }>;

export function oracle(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const alive = ctx.sched.aliveAfterNight(night);
  const v = view(ctx, night);
  let min = 0;
  let max = 0;
  for (let s = 0; s < alive.length; s++) {
    if (alive[s]) continue;
    if (mustRegisterEvil(v, s)) { min++; max++; }
    else if (canRegisterEvil(v, s)) max++;
  }
  return data.count >= min && data.count <= max;
}
