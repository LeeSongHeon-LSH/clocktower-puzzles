// 수도사: 밤2부터 매일 밤 한 명을 골라 악마로부터 보호한다.
//
// 이 데이터는 정보가 아니라 **행동 기록**이다 — 참/거짓 판정 대상이 아니고
// (취해도 중독돼도 자기가 누굴 골랐는지는 안다), 보호의 효력 제약은
// timeline.ts의 킬 귀속이 소비한다. 여기서는 구조만 본다: 죽은 사람이나
// 자신은 애초에 고를 수 없었다.

import type { Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "monk" }>;

export function monk(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  if (data.target === seat) return false;
  return ctx.sched.aliveAtNightStart(night)[data.target];
}
