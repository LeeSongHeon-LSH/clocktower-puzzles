// 장의사: 전날 낮에 처형된 플레이어의 역할을 배운다 (죽은 은둔자도 오등록 가능).

import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "undertaker" }>;

export function undertaker(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const executed = ctx.sched.executedOnDay(night - 1);
  if (executed === null) return false; // wakes()가 걸러주지만 방어적으로
  const v = view(ctx, night - 1); // 처형 시점의 토큰 (승계 반영)
  return canShowAsRole(v, executed, data.shownRole);
}
