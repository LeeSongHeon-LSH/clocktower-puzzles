// 현자: 악마에게 죽는 밤, 깨어나 두 좌석을 배운다 — 그중 하나가 자신을 죽인 악마다.
// 기상 조건(임프 킬로 죽었는가)은 wakes()가 시나리오의 킬 귀속으로 판정한다.

import type { Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "sage" }>;

export function sage(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  if (data.targets[0] === data.targets[1]) return false;
  return data.targets.includes(ctx.sc.demonDuringNight[night]);
}
