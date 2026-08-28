// 이동식 취함 원천(선원·여관주인·대신)의 행동 기록 — 정보가 아니라 선택의 기록이다.
// 참/거짓 판정 대상이 아니고 제약은 timeline(drunkSourceBranches)이 소비한다.
// 여기서는 구조만 검증한다: 그런 선택이 가능했는가 (대상 생존, 역할이 대본에 있는가).

import { Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";
import { PHILOSOPHER_GAINABLE } from "../types";

type SailorData = Extract<InfoData, { type: "sailor" }>;
type InnkeeperData = Extract<InfoData, { type: "innkeeper" }>;
type CourtierData = Extract<InfoData, { type: "courtier" }>;

export function sailor(ctx: Ctx, seat: Seat, data: SailorData, night: number): boolean {
  if (data.target === seat) return false; // "나 또는 대상" — 대상은 타인이다
  return ctx.sched.aliveAtNightStart(night)[data.target];
}

export function innkeeper(ctx: Ctx, seat: Seat, data: InnkeeperData, night: number): boolean {
  void seat; // 자신 포함 선택 가능
  if (data.targets[0] === data.targets[1]) return false; // 서로 다른 2명
  const alive = ctx.sched.aliveAtNightStart(night);
  return alive[data.targets[0]] && alive[data.targets[1]];
}

export function courtier(ctx: Ctx, _seat: Seat, data: CourtierData, _night: number): boolean {
  return ctx.pz.rolePool.includes(data.role); // 대본에 있는 역할만 고를 수 있다
}

type SnakeData = Extract<InfoData, { type: "snakecharmer" }>;

/** 뱀 조련사: 살아 있는 다른 플레이어를 지목한다 (효과는 timeline·solve가 소비) */
export function snakecharmer(ctx: Ctx, seat: Seat, data: SnakeData, night: number): boolean {
  if (data.target === seat) return false;
  return ctx.sched.aliveAtNightStart(night)[data.target];
}

type PhilosopherData = Extract<InfoData, { type: "philosopher" }>;

/** 철학자: 대본 안의 획득 가능한 선한 능력만 고를 수 있다 */
export function philosopher(ctx: Ctx, _seat: Seat, data: PhilosopherData, _night: number): boolean {
  return ctx.pz.rolePool.includes(data.role) && PHILOSOPHER_GAINABLE.includes(data.role);
}

type ProfessorData = Extract<InfoData, { type: "professor" }>;

/** 교수(부활 시도): 죽은 좌석만 고를 수 있다 (밤2부터 — 기상은 wakes가 판정) */
export function professor(ctx: Ctx, seat: Seat, data: ProfessorData, night: number): boolean {
  if (data.target === seat) return false;
  return night >= 2 && !ctx.sched.aliveAtNightStart(night)[data.target];
}
