// 객실 청소부: 매일 밤 생존자 두 명을 골라 그중 몇 명이 그 밤에 깨어났는지 배운다.
// 기상 여부는 독살과 무관한 사실이므로 빠른 경로에서도 검증 가능.

import { Ctx, wakes } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "chambermaid" }>;

export function chambermaid(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  if (data.targets.includes(seat)) return false; // 자신 제외
  const alive = ctx.sched.aliveAfterNight(night);
  if (!data.targets.every((t) => alive[t])) return false; // 생존자만 고를 수 있다
  const count = data.targets.filter((t) => wakes(ctx, t, night)).length;
  return data.count === count;
}
