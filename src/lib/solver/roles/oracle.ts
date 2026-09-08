// 예언자: 밤2부터 매일 밤, 죽은 플레이어 중 악인 수를 배운다.
// 죽은 은둔자는 악으로, 죽은 첩자는 선으로 오등록될 수 있다 (초공감자와 같은 min/max).

import { Ctx, view } from "../ctx";
import { evilRange } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "oracle" }>;

/** 예언자가 볼 수 있는 값의 [min, max] */
export function oracleRange(ctx: Ctx, night: number): [number, number] {
  const alive = ctx.sched.aliveAfterNight(night);
  const dead: Seat[] = [];
  for (let s = 0; s < alive.length; s++) if (!alive[s]) dead.push(s);
  return evilRange(view(ctx, night), dead);
}

export function oracle(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const [min, max] = oracleRange(ctx, night);
  return data.count >= min && data.count <= max;
}
