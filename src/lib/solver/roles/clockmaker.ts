// 시계공: 밤1, 악마에서 가장 가까운 하수인까지의 좌석 거리(스텝)를 배운다. 실제 토큰 기준.

import { ROLES } from "@/data/roles";
import { circularDistance, Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "clockmaker" }>;

/** 실제 스텝 수. 하수인이 없으면 null (그 정보는 존재할 수 없다) */
export function clockmakerSteps(ctx: Ctx): number | null {
  const n = ctx.pz.playerCount;
  const demonSeat = ctx.assignment.findIndex((r) => ROLES[r].team === "demon");
  let best = Infinity;
  for (let s = 0; s < n; s++) {
    if (ROLES[ctx.assignment[s]].team === "minion") {
      best = Math.min(best, circularDistance(n, demonSeat, s));
    }
  }
  return Number.isFinite(best) ? best : null;
}

export function clockmaker(ctx: Ctx, _seat: Seat, data: Data): boolean {
  const best = clockmakerSteps(ctx);
  return best !== null && data.steps === best;
}
