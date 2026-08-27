// 할머니: 시작할 때 손주(선한 플레이어)와 그 역할을 안다.
// 손주가 악마에게 죽으면 함께 죽는다 — 그 연쇄 제약은 timeline.ts가 소비하고,
// 여기서는 밤1 정보의 내용(그 좌석이 그 역할로 등록될 수 있는가)만 본다.

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "grandmother" }>;

export function grandmother(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  const team = ROLES[data.shownRole].team;
  if (team !== "townsfolk" && team !== "outsider") return false;
  if (data.target === seat) return false;
  return canShowAsRole(view(ctx, night), data.target, data.shownRole);
}
