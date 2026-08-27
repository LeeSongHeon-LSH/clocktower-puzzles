// 구마사제: 밤2부터 매일 밤 한 명을 지목한다 (전날 밤과 다른 사람).
// 지목이 악마면 그 밤 악마는 깨어나지 못한다.
//
// 수도사와 같은 **행동 기록** — 효력 제약(킬 봉쇄·봉쇄 위반 시 중독 강제)은
// timeline.ts가 소비하고, 여기서는 구조만 본다.

import type { Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "exorcist" }>;

export function exorcist(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  if (!ctx.sched.aliveAtNightStart(night)[data.target]) return false;
  // 전날 밤과 같은 사람은 지목할 수 없다
  const prev = ctx.claimBySeat[seat].info.find((i) => i.night === night - 1 && i.data?.type === "exorcist");
  if (prev?.data && "target" in prev.data && prev.data.target === data.target) return false;
  return true;
}
