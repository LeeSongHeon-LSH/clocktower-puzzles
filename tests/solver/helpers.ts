// 테스트용 Ctx/퍼즐 구성 헬퍼.

import type { Ctx } from "@/lib/solver/ctx";
import { Schedule, DemonScenario } from "@/lib/solver/timeline";
import type { Claim, GameEvent, RoleId, Seat, SolverPuzzle } from "@/lib/solver/types";

export function makePuzzle(opts: {
  assignmentLength: number;
  rolePool: RoleId[];
  claims?: Claim[];
  events?: GameEvent[];
  nights?: number;
}): SolverPuzzle {
  return {
    playerCount: opts.assignmentLength,
    rolePool: opts.rolePool,
    claims: opts.claims ?? [],
    events: opts.events ?? [],
    nights: opts.nights ?? 1,
  };
}

/** 승계 없는 기본 시나리오 */
export function plainScenario(assignment: RoleId[], nights: number): DemonScenario {
  const impSeat = assignment.indexOf("imp");
  const demonNights: Seat[] = [];
  for (let n = 1; n <= nights; n++) demonNights[n] = impSeat;
  return {
    demonDuringNight: demonNights,
    currentDemonSeat: impSeat,
    becameDemonAt: new Map([[impSeat, 0]]),
    poisonRequired: new Map(),
    poisonForbidden: new Map(),
  };
}

export function makeCtx(opts: {
  assignment: RoleId[];
  rolePool: RoleId[];
  claims?: Claim[];
  events?: GameEvent[];
  nights?: number;
  redHerring?: Seat | null;
  poison?: (Seat | null)[] | null;
  sweet?: { target: Seat; since: number } | null;
}): Ctx {
  const pz = makePuzzle({
    assignmentLength: opts.assignment.length,
    rolePool: opts.rolePool,
    claims: opts.claims,
    events: opts.events,
    nights: opts.nights,
  });
  // 주장이 안 주어진 좌석은 자기 실제 역할(악역은 아무 역할)을 주장하는 것으로 채운다
  const claimBySeat: Claim[] = [];
  for (const c of pz.claims) claimBySeat[c.seat] = c;
  for (let s = 0; s < pz.playerCount; s++) {
    if (!claimBySeat[s]) claimBySeat[s] = { seat: s, role: opts.assignment[s], info: [] };
  }
  return {
    pz,
    sched: new Schedule(pz),
    assignment: opts.assignment,
    claimBySeat,
    sc: plainScenario(opts.assignment, pz.nights),
    redHerring: opts.redHerring ?? null,
    poison: opts.poison ?? null,
    sweet: opts.sweet ?? null,
  };
}
