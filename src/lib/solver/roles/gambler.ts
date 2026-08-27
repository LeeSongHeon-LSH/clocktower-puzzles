// 도박사: 밤2부터 매일 밤 한 명의 역할을 추측한다 — 틀리면 죽는다.
//
// 수도사와 같은 **행동 기록**이다. 추측이 맞았는지의 효력(오답 사망, 반드시
// 틀린 추측인데 생존 → 중독 강제)은 timeline.ts의 킬 귀속이 소비하고,
// 여기서는 구조만 본다: 죽은 사람은 애초에 고를 수 없었다.

import type { Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "gambler" }>;

export function gambler(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  return ctx.sched.aliveAtNightStart(night)[data.target];
}
