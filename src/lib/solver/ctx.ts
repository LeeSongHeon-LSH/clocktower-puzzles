// 체커들이 공유하는 평가 컨텍스트와 공용 유틸.

import type { Claim, RoleId, Seat, SolverPuzzle } from "./types";
import { DemonScenario, Schedule, tokenRoleAt } from "./timeline";
import type { TokenView } from "./registration";

export interface Ctx {
  pz: SolverPuzzle;
  sched: Schedule;
  assignment: RoleId[];
  /** 좌석별 공개 주장 */
  claimBySeat: Claim[];
  sc: DemonScenario;
  redHerring: Seat | null;
  /**
   * 밤별 독살 대상. 빠른 경로(수학자 없음)에서는 null —
   * 이때 정확한 독살 벡터가 필요한 체커(수학자)는 호출되지 않는다.
   */
  poison: (Seat | null)[] | null;
  /** 스위트하트 사망으로 취한 좌석과 시점 (밤 n = n, 낮 d 처형 = d + 0.5). 없으면 null */
  sweet: { target: Seat; since: number } | null;
}

export function isDrunk(ctx: Ctx, seat: Seat): boolean {
  return ctx.assignment[seat] === "drunk";
}

/** 스위트하트 취함 — 밤 night의 정보·능력이 비정상 동작하는가 (취한 뒤에도 깨어나긴 한다) */
export function isSweetDrunk(ctx: Ctx, seat: Seat, night: number): boolean {
  return ctx.sweet !== null && ctx.sweet.target === seat && ctx.sweet.since <= night;
}

/** 노 다시의 이웃 독 — 밤 night에 중독돼 있었을 수 있는가 (간격 추상화, timeline이 계산) */
export function isNdPoisoned(ctx: Ctx, seat: Seat, night: number): boolean {
  return ctx.sc.nodashiiPoisoned?.[night]?.has(seat) ?? false;
}

/** 푸카의 독 — 밤 night에 받고 있었을 수 있는가 (관대 집합, timeline이 계산) */
export function isPukkaPoisoned(ctx: Ctx, seat: Seat, night: number): boolean {
  return ctx.sc.pukkaPoisoned?.[night]?.has(seat) ?? false;
}

/** 비고르모르티스가 죽인 하수인의 이웃 독 — 밤 night에 받고 있었을 수 있는가 (관대 집합) */
export function isVigorPoisoned(ctx: Ctx, seat: Seat, night: number): boolean {
  return ctx.sc.vigorPoisoned?.[night]?.has(seat) ?? false;
}

/** 비고르모르티스에게 죽어 능력을 유지 중인가 (밤 night 기준) */
export function vigorKept(ctx: Ctx, seat: Seat, night: number): boolean {
  return (ctx.sc.vigorKeptSince?.get(seat) ?? Infinity) <= night;
}

export function isPoisoned(ctx: Ctx, seat: Seat, night: number): boolean {
  return ctx.poison !== null && ctx.poison[night] === seat;
}

/** 좌석이 믿고 있는 자기 역할 (주정뱅이는 주장 역할, 그 외는 승계 반영 토큰) */
export function believedRole(ctx: Ctx, seat: Seat, night: number): RoleId {
  // 데몬이 된 좌석(승계·팡 구 점프)은 자신이 데몬임을 통보받는다 — 주정뱅이였어도 벗어난다
  const since = ctx.sc.becameDemonAt.get(seat);
  if (since !== undefined && since <= night) return tokenRoleAt(ctx.assignment, ctx.sc, seat, night);
  if (isDrunk(ctx, seat)) return ctx.claimBySeat[seat].role;
  return tokenRoleAt(ctx.assignment, ctx.sc, seat, night);
}

export function view(ctx: Ctx, night: number): TokenView {
  return {
    tokenRole: (s: Seat) => tokenRoleAt(ctx.assignment, ctx.sc, s, night),
    rolePool: ctx.pz.rolePool,
  };
}

export function circularDistance(n: number, a: Seat, b: Seat): number {
  const d = Math.abs(a - b) % n;
  return Math.min(d, n - d);
}

/**
 * 원형 좌석에서 자신을 제외한 가장 가까운 생존 이웃 [왼쪽, 오른쪽].
 * 생존한 타인이 없으면 null. (둘이 같은 좌석일 수 있음 — 생존 타인이 1명일 때)
 */
export function aliveNeighbors(alive: boolean[], seat: Seat): [Seat, Seat] | null {
  const n = alive.length;
  let left: Seat | null = null;
  let right: Seat | null = null;
  for (let step = 1; step < n; step++) {
    const l = (seat - step + n) % n;
    if (alive[l]) { left = l; break; }
  }
  for (let step = 1; step < n; step++) {
    const r = (seat + step) % n;
    if (alive[r]) { right = r; break; }
  }
  if (left === null || right === null) return null;
  return [left, right];
}

/**
 * 좌석이 밤 night에 깨어나는가 (텔러가 깨우는가).
 * 주정뱅이·중독자도 깨어난다(가짜 정보를 받는다). 객실 청소부·수학자 검증의 기반.
 */
export function wakes(ctx: Ctx, seat: Seat, night: number): boolean {
  const role = believedRole(ctx, seat, night);
  const aliveStart = ctx.sched.aliveAtNightStart(night);
  const aliveAfter = ctx.sched.aliveAfterNight(night);
  switch (role) {
    case "washerwoman":
    case "librarian":
    case "investigator":
    case "chef":
    case "clockmaker":
      return night === 1;
    case "empath":
    case "fortuneteller":
    case "chambermaid":
    case "mathematician":
      return aliveAfter[seat];
    case "undertaker":
      return aliveAfter[seat] && ctx.sched.executedOnDay(night - 1) !== null;
    case "ravenkeeper":
      return ctx.sched.diedAtNight(night).includes(seat);
    case "juggler":
      return night === 2 && aliveAfter[seat];
    case "monk":
    case "exorcist":
    case "gambler":
      return night >= 2 && aliveStart[seat];
    case "sage":
      // 데몬에게 죽은 그 밤에만 깨어난다 (암살자·대부의 킬은 트리거가 아니다)
      return ctx.sc.impKillDuringNight?.[night]?.includes(seat) ?? false;
    case "butler":
      return aliveAfter[seat];
    case "dreamer":
      return aliveStart[seat]; // 악마보다 먼저 행동 — 그 밤에 죽더라도 이미 깨어났다
    case "oracle":
      return night >= 2 && aliveAfter[seat];
    case "grandmother":
      return night === 1;
    case "assassin":
      return ctx.sc.assassinNight === night; // 능력을 쓴 밤에만 깨어난다
    case "godfather":
      // 밤1: 등장한 외부인을 본다. 이후: 킬을 수행한 밤에만
      return night === 1 ? aliveStart[seat] : (ctx.sc.godfatherNights?.has(night) ?? false);
    case "seamstress": {
      // 1회용: 실제 사용 밤은 그 좌석의 주장에 기록된 밤
      const claim = ctx.claimBySeat[seat];
      const used = claim.role === "seamstress" ? claim.info.find((i) => i.data?.type === "seamstress") : undefined;
      return used !== undefined && used.night === night && aliveAfter[seat];
    }
    case "poisoner":
    case "spy":
    case "devilsadvocate": // 밤마다 처형 면역 대상을 고른다 (밤1 포함)
      // 비고르모르티스에게 죽은 하수인은 능력을 유지하며 계속 깨어난다
      return aliveStart[seat] || vigorKept(ctx, seat, night);
    case "witch":
      // 밤마다 저주 대상을 고른다 — 생존자가 3명 이하면 능력을 잃고 깨어나지 않는다
      return (aliveStart[seat] || vigorKept(ctx, seat, night)) && aliveStart.filter(Boolean).length > 3;
    case "lunatic":
      // 자기가 데몬인 줄 알고 데몬처럼 깨어나 '킬'을 고른다 (실제로는 아무 일도 없다)
      return night >= 2 && aliveStart[seat];
    case "zombuul": {
      // 구마사제 봉쇄 밤에는 깨어나지 못한다
      if (ctx.sc.exorcistBlocked?.has(night)) return false;
      // 승계한 밤(탕녀)에는 악마가 됐다고 통보받으며 깨어난다
      if (ctx.sc.becameDemonAt.get(seat) === night) return true;
      if (night < 2) return false;
      // 직전 낮에 처형 사망이 있으면 깨어나지 않는다 — '오늘 아무도 죽지 않았다'가 조건
      if (ctx.sched.executedOnDay(night - 1) !== null) return false;
      // 가짜 죽음 후에도 (등록상 사망) 비밀리에 계속 깨어나 킬한다
      if (ctx.sc.zombuulFakeDeadAt != null && ctx.sc.zombuulFakeDeadAt < night) return true;
      return aliveStart[seat];
    }
    case "pukka": {
      // 밤1부터 깨어나 중독 대상을 고른다 (킬은 밤2부터) — 봉쇄 밤은 예외
      if (ctx.sc.exorcistBlocked?.has(night)) return false;
      if (ctx.sc.becameDemonAt.get(seat) === night) return true;
      return aliveStart[seat];
    }
    case "imp":
    case "vortox":
    case "nodashii":
    case "fanggu": // 점프로 승계한 밤에는 아래 since === night 분기로 깨어난다
    case "vigormortis":
    case "shabaloth": // 밤2부터 매밤 2명을 고른다 (시신 포함 가능)
    case "po": { // 조용한 밤에도 깨어난다 — '아무도 안 함'도 선택하러 깬다
      // 구마사제가 악마를 지목한 밤에는 악마가 깨어나지 못한다
      if (ctx.sc.exorcistBlocked?.has(night)) return false;
      // 승계한 밤(스타 패스, 탕녀)에는 악마가 됐다고 통보받으며 깨어난다
      const since = ctx.sc.becameDemonAt.get(seat);
      if (since === night) return true;
      return night >= 2 && aliveStart[seat];
    }
    default:
      // baron, scarletwoman, recluse 등은 밤에 깨어나지 않는다
      return false;
  }
}
