// 꽃파는 소녀: 밤마다(밤2부터) 어제 악마가 투표했는지 배운다.
//
// 투표 기록(vote 이벤트)은 **부분 기록**이다 — "예"는 미기록 투표가 있을 수 있어 항상
// 성립하고(죽은 악마도 유령 투표 ∃), "아니오"가 그날 기록된 투표자를 제약한다:
// 반드시 악마로 등록되는 투표자(현재 데몬)가 있으면 참일 수 없다. 은둔자는 선으로
// 등록될 수 있어 (∃) 걸리지 않는다.

import { ROLES } from "@/data/roles";
import { Ctx } from "../ctx";
import { tokenRoleAt } from "../timeline";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "flowergirl" }>;

/** 낮 day에 기록된 투표자들 */
export function votersOnDay(ctx: Ctx, day: number): Seat[] {
  return ctx.pz.events.flatMap((e) => (e.type === "vote" && e.day === day ? [e.seat] : []));
}

export function flowergirl(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  if (data.yes) return true; // 미기록 투표 ∃ — 항상 성립 (관대한 방향)
  const day = night - 1;
  return votersOnDay(ctx, day).every(
    (v) => ROLES[tokenRoleAt(ctx.assignment, ctx.sc, v, day + 0.5)].team !== "demon",
  );
}
