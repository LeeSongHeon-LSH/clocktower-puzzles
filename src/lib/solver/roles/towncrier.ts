// 마을 서기: 밤마다(밤2부터) 어제 하수인이 지명했는지 배운다.
//
// 지명 기록(nomination·virginTrigger 이벤트)은 **부분 기록**이다 — "예"는 미기록 지명이
// 있을 수 있어 항상 성립하고(처형 뒤에는 반드시 지명이 있었다), "아니오"가 그날 기록된
// 지명자를 제약한다: 반드시 하수인으로 등록되는 지명자가 있으면 참일 수 없다.
// 첩자는 선으로(∃), 은둔자는 하수인이 아닌 것으로(∃) 등록될 수 있어 걸리지 않는다.

import { ROLES } from "@/data/roles";
import { Ctx } from "../ctx";
import { tokenRoleAt } from "../timeline";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "towncrier" }>;

/** 낮 day에 기록된 지명자들 */
export function nominatorsOnDay(ctx: Ctx, day: number): Seat[] {
  return ctx.pz.events.flatMap((e) =>
    (e.type === "nomination" || e.type === "virginTrigger") && e.day === day ? [e.nominator] : [],
  );
}

export function towncrier(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  if (data.yes) return true; // 미기록 지명 ∃ — 항상 성립 (관대한 방향)
  const day = night - 1;
  return nominatorsOnDay(ctx, day).every((v) => {
    const tok = tokenRoleAt(ctx.assignment, ctx.sc, v, day + 0.5);
    return ROLES[tok].team !== "minion" || tok === "spy"; // 첩자는 선 등록 가능 (∃)
  });
}
