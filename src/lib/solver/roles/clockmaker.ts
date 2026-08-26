// 시계공: 밤1, 악마에서 가장 가까운 하수인까지의 좌석 거리(스텝)를 배운다. 실제 토큰 기준.

import { ROLES } from "@/data/roles";
import { circularDistance, Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "clockmaker" }>;

export function clockmaker(ctx: Ctx, _seat: Seat, data: Data): boolean {
  const n = ctx.pz.playerCount;
  const demonSeat = ctx.assignment.indexOf("imp");
  let best = Infinity;
  for (let s = 0; s < n; s++) {
    if (ROLES[ctx.assignment[s]].team === "minion") {
      best = Math.min(best, circularDistance(n, demonSeat, s));
    }
  }
  return Number.isFinite(best) && data.steps === best;
}
