// 객실 청소부: 매일 밤 생존자 두 명을 골라 그중 몇 명이 그 밤에 깨어났는지 배운다.
// 기상 여부는 독살과 무관한 사실이므로 빠른 경로에서도 검증 가능.

import { Ctx, wakes } from "../ctx";
import { tokenRoleAt } from "../timeline";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "chambermaid" }>;

/**
 * 객실 청소부가 볼 수 있는 값의 [min, max] (참 판정·거짓 판정 공용).
 * 구조가 성립하지 않으면(자신 포함, 죽은 대상) null — 그 정보는 존재할 수 없다.
 */
export function chambermaidRange(ctx: Ctx, seat: Seat, data: Data, night: number): [number, number] | null {
  if (data.targets.includes(seat)) return null; // 자신 제외
  const alive = ctx.sched.aliveAfterNight(night);
  if (!data.targets.every((t) => alive[t])) return null; // 생존자만 고를 수 있다
  // 마귀할멈은 자기를 다른 역할로 바꿨을 수 있어 기상 여부가 ∃다 (24차 D8) — 범위로 센다
  let min = 0;
  let max = 0;
  for (const t of data.targets) {
    if (night >= 2 && tokenRoleAt(ctx.assignment, ctx.sc, t, night) === "pithag") { max++; continue; }
    if (wakes(ctx, t, night)) { min++; max++; }
  }
  return [min, max];
}

export function chambermaid(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  const range = chambermaidRange(ctx, seat, data, night);
  if (range === null) return false;
  return data.count >= range[0] && data.count <= range[1];
}
