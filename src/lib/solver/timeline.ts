// 시간축 처리.
//
// 진행 순서 모델: 밤1 → 낮1 → 밤2 → 낮2 → … → 밤k → (현재: k일차 낮, 처형 전).
// - 처형(execution)은 낮 d (1 ≤ d ≤ k-1), 밤 사망(death)은 밤 n (2 ≤ n ≤ k).
// - 한 밤의 사망은 여러 건일 수 있다. 각 죽음은 임프 킬 / 암살자 / 대부 /
//   할머니 연쇄 / 도박사의 오답 / 땜장이 중 하나로 귀속돼야 하고,
//   demonScenarios가 가능한 귀속을 전부 분기한다.
// - 밤 정보는 그 밤의 킬 이후 상태를 본다 (밤 순서상 정보 역할이 임프보다 뒤).
//
// 생존 여부는 이벤트만으로 결정되므로 월드와 무관하게 한 번 계산한다(Schedule).
// 데몬 승계(스타 패스, 탕녀)와 킬 귀속은 월드 의존이며 독살 선택과 얽히므로,
// 시나리오가 "밤 n에 반드시/절대 독살돼야 하는 좌석" 제약을 방출하고
// solve가 주장 검증에서 나온 독살 요구와 병합해 일관성을 판정한다.
//
// 모델 경계 (문서화된 근사):
// - 같은 밤에 승계가 일어난 직후의 새 데몬을 암살자·대부가 다시 죽이는 경로는 탐색하지 않는다.
// - 수도사가 임프 자신을 보호해 스타 패스를 막는 경우는 고려하지 않는다 (허용 방향 근사).
// - 대부·음유시인 트리거는 "낮 처형으로 죽은" 외부인/하수인만 본다 (이 모델의 낮 사망은 처형뿐).
// - 어릿광대·찻집 여인의 "처형됐지만 살아남음"은 이벤트로 표현할 수 없으므로 등장하지 않는다 —
//   처형 이벤트는 언제나 죽음이고, 이들이 처형돼 죽었다면 그 시점의 취함/중독이 강제된다.
// - Po의 3킬 밤(직전 선택이 '아무도 안 함')은 죽은 좌석 선택이 허용되므로 실제 사망
//   0~3건이 전부 설명 없이 성립한다 (관대한 방향). 구마사제 봉쇄 밤은 선택 자체가 없던
//   밤이라 '아무도 안 함'으로 치지 않는다 — 다음 밤 3킬이 열리지 않는다.
// - 샤바로스는 밤마다 2명을 고르는데 시신도 고를 수 있어 실제 사망 0~2건이 전부 설명
//   없이 성립한다 (관대한 방향). 역류(부활)는 이벤트로 표현 불가 — "might"라 비발동 ∃가
//   항상 성립하고, 역류가 발동한 게임은 입력될 수 없다.
// - 좀부울: 직전 낮에 처형 사망이 있으면 깨어나지 않는다 (그 밤 킬 불가·킬 부재 공짜).
//   첫 죽음은 가짜 — 이벤트는 그대로 두되(등록상 사망) 비밀리에 생존해 계속 킬하고,
//   탕녀 승계도 발동하지 않는다. 죽는 순간 중독됐다면 정말로 죽는다 (그쪽만 승계 분기).
//   같은 좌석의 두 번째 사망은 스키마상 입력 불가라 표현 가능한 퍼즐에서 좀부울의 진짜
//   죽음은 (중독 분기 외엔) 없다. 생존 2인 이하 종료 판정에서 가짜 죽음 좀부울은
//   생존자로 센다 (실제로 살아 있다 — 게임이 계속되는 관대한 방향).

import { ROLES } from "@/data/roles";
import { canShowAsRole } from "./registration";
import type { Claim, RoleId, Seat, SolverPuzzle } from "./types";

// ── Schedule: 이벤트만으로 결정되는 생존 상태 ─────────────────────

export class Schedule {
  readonly nights: number;
  private readonly deathsAtNight = new Map<number, Seat[]>();
  private readonly execOnDay = new Map<number, Seat>();
  /** aliveStart[n] = 밤 n 시작 시점 생존 배열, aliveAfter[n] = 밤 n 킬 이후 */
  private readonly aliveStart: boolean[][] = [];
  private readonly aliveAfter: boolean[][] = [];

  constructor(pz: SolverPuzzle) {
    this.nights = pz.nights;
    for (const ev of pz.events) {
      if (ev.type === "death") {
        if (ev.night < 2 || ev.night > pz.nights) throw new Error(`밤 사망 시점이 범위 밖: 밤 ${ev.night}`);
        const same = this.deathsAtNight.get(ev.night) ?? [];
        if (same.includes(ev.seat)) throw new Error(`밤 ${ev.night}: 좌석 ${ev.seat}의 사망이 중복`);
        same.push(ev.seat);
        this.deathsAtNight.set(ev.night, same);
      } else {
        if (ev.day < 1 || ev.day > pz.nights - 1) throw new Error(`처형 시점이 범위 밖: 낮 ${ev.day}`);
        if (this.execOnDay.has(ev.day)) throw new Error(`낮 ${ev.day}에 처형이 2건`);
        this.execOnDay.set(ev.day, ev.seat);
      }
    }
    let alive = Array.from({ length: pz.playerCount }, () => true);
    for (let night = 1; night <= pz.nights; night++) {
      this.aliveStart[night] = [...alive];
      const dead = this.deathsAtNight.get(night);
      if (dead !== undefined && dead.length > 0) {
        alive = [...alive];
        for (const seat of dead) {
          if (!alive[seat]) throw new Error(`밤 ${night}: 이미 죽은 좌석 ${seat}이 또 사망`);
          alive[seat] = false;
        }
      }
      this.aliveAfter[night] = [...alive];
      const executed = this.execOnDay.get(night);
      if (executed !== undefined) {
        if (!alive[executed]) throw new Error(`낮 ${night}: 이미 죽은 좌석 ${executed}을 처형`);
        alive = [...alive];
        alive[executed] = false;
      }
    }
  }

  /** 밤 night에 죽은 채 발견된 좌석들 (없으면 빈 배열) */
  diedAtNight(night: number): Seat[] {
    return this.deathsAtNight.get(night) ?? [];
  }
  executedOnDay(day: number): Seat | null {
    return this.execOnDay.get(day) ?? null;
  }
  aliveAtNightStart(night: number): boolean[] {
    return this.aliveStart[night];
  }
  /** 밤 night 킬 이후 생존 여부 (그 밤의 정보 역할이 보는 상태) */
  aliveAfterNight(night: number): boolean[] {
    return this.aliveAfter[night];
  }
  aliveNow(): boolean[] {
    return this.aliveAfter[this.nights];
  }
}

// ── DemonScenario: 데몬 승계 + 킬 귀속 시나리오 ───────────────────

export interface DemonScenario {
  /** demonDuringNight[n] = 밤 n의 킬 주체인 데몬 좌석 */
  demonDuringNight: Seat[];
  currentDemonSeat: Seat;
  /**
   * 좌석 → 데몬이 된 시점. 원래 임프는 0.
   * 밤 n 승계(스타 패스, 밤 데몬 사망의 탕녀 승계)는 n, 낮 n 처형 승계는 n + 0.5.
   */
  becameDemonAt: Map<Seat, number>;
  /** 밤 n → 반드시 이 좌석이 독살돼야 함 */
  poisonRequired: Map<number, Seat>;
  /** 밤 n → 이 좌석들은 독살되면 안 됨 */
  poisonForbidden: Map<number, Set<Seat>>;
  /** 암살자가 능력을 쓴 밤 (기상 판정용). null = 사용 안 함 */
  assassinNight?: number | null;
  /** 대부가 킬을 수행한 밤들 */
  godfatherNights?: Set<number>;
  /** 구마사제가 악마를 지목해 악마가 깨어나지 못한 밤들 */
  exorcistBlocked?: Set<number>;
  /** impKillDuringNight[n] = 밤 n에 데몬이 죽인 좌석들 (Po의 3킬 밤은 여럿) — 현자 기상 판정용 */
  impKillDuringNight?: Seat[][];
  /** 음유시인 발동으로 전원이 취해 있던 밤들 — 그 밤의 정보·킬·독살은 모두 무효 */
  minstrelNights?: Set<number>;
  /**
   * 좀부울의 가짜 죽음 시점 (밤 n = n, 낮 d 처형 = d + 0.5). 좀부울 세계에서 가짜 죽음이
   * 일어났을 때만 존재 — 그 좌석은 등록상 죽었지만 실제로 살아 있어 계속 깨어나고 킬한다.
   */
  zombuulFakeDeadAt?: number | null;
  /**
   * 노 다시 세계: 밤 n에 노 다시의 독을 받고 '있었을 수 있는' 좌석들 (데몬 세계에서만).
   * 간격 추상화의 관대한 쪽 — 첩자의 주민 오등록 흡수(∃), 밤중 사망으로 인한 이동을
   * 전부 합집합으로 담는다. 여기 든 좌석의 정보는 무제약이고 비정상 동작 강제(require)를
   * 만족시키지만, 정상 동작 강제(forbid)를 깨뜨리지는 않는다 — 확실한 중독이 아니기 때문.
   */
  nodashiiPoisoned?: Set<Seat>[];
}

/**
 * 스위트하트 취함 케이스 (solve가 배정별로 열거).
 * 스위트하트가 죽은 배정에서만 존재한다. target이 좌석이면 "사망 순간 멀쩡했고 그
 * 좌석이 since부터 취한다", null이면 "사망 순간 중독돼 있어 취함이 발동하지 않았다".
 * 시점 규약은 becameDemonAt과 같다: 밤 n 사망 = n, 낮 d 처형 = d + 0.5.
 * deathNight는 사망 순간의 독살 제약이 걸리는 밤 인덱스 (낮 d 처형이면 d — 밤 d의 독이 낮까지 지속).
 */
export interface SweetheartCase {
  sweetSeat: Seat;
  deathNight: number;
  since: number;
  target: Seat | null;
}

type Trigger = "must" | "may" | "none";

interface St {
  demon: Seat;
  became: Map<Seat, number>;
  demonNights: Seat[];
  required: Map<number, Seat>;
  forbidden: Map<number, Set<Seat>>;
  assassinUsed: boolean;
  assassinNight: number | null;
  godfatherNights: number[];
  exorcistBlocked: number[];
  impKills: Seat[][];
  minstrelNights: number[];
  foolDodgeUsed: boolean;
  /** Po 전용: 직전 밤의 선택이 '아무도 안 함'이었는가 (참이면 이번 밤엔 반드시 3명을 고른다) */
  poChoseNone: boolean;
  /** 좀부울 전용: 가짜 죽음 시점 (밤 n = n, 낮 d = d + 0.5). null = 아직 안 죽음 */
  zombuulFakeDeadAt: number | null;
  /** 할머니의 실제 손주. null = 미확정 (밤1 정보가 취함/중독이었거나 주장이 없음) */
  grandchild: Seat | null;
}

function cloneSt(s: St): St {
  return {
    demon: s.demon,
    became: new Map(s.became),
    demonNights: [...s.demonNights],
    required: new Map(s.required),
    forbidden: new Map([...s.forbidden].map(([k, v]) => [k, new Set(v)])),
    assassinUsed: s.assassinUsed,
    assassinNight: s.assassinNight,
    godfatherNights: [...s.godfatherNights],
    exorcistBlocked: [...s.exorcistBlocked],
    impKills: [...s.impKills],
    minstrelNights: [...s.minstrelNights],
    foolDodgeUsed: s.foolDodgeUsed,
    poChoseNone: s.poChoseNone,
    zombuulFakeDeadAt: s.zombuulFakeDeadAt,
    grandchild: s.grandchild,
  };
}

function countTrue(arr: boolean[]): number {
  return arr.filter(Boolean).length;
}

/** arr의 크기 k 이하 부분집합 전부 (Po 3킬 밤의 데몬 킬 귀속 후보) */
function subsetsUpTo(arr: Seat[], k: number): Seat[][] {
  const out: Seat[][] = [[]];
  for (const x of arr) {
    for (const base of [...out]) {
      if (base.length < k) out.push([...base, x]);
    }
  }
  return out;
}

function isGoodTeam(role: RoleId): boolean {
  const t = ROLES[role].team;
  return t === "townsfolk" || t === "outsider";
}

/** 자신을 제외한 가장 가까운 생존 이웃 [왼쪽, 오른쪽]. ctx.aliveNeighbors와 같은 정의 (순환 의존 회피용 사본). */
function neighborsOf(alive: boolean[], seat: Seat): [Seat, Seat] | null {
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
 * 배정에 대해 이벤트와 정합 가능한 데몬 승계·킬 귀속 시나리오를 모두 반환.
 * 게임이 이미 끝났어야 하는 경로(데몬 사망 후 승계 불가, 생존 2인 이하)는 제외.
 * 빈 배열 = 이 배정은 이벤트와 모순.
 */
export function demonScenarios(pz: SolverPuzzle, sched: Schedule, assignment: RoleId[], sweet?: SweetheartCase | null): DemonScenario[] {
  const origDemonSeat = assignment.findIndex((r) => ROLES[r].team === "demon");
  if (origDemonSeat < 0) return [];
  const demonRole = assignment[origDemonSeat]; // 승계자의 토큰도 이 역할이 된다 (탕녀는 '그 악마'가 된다)
  const poisonerSeat = assignment.indexOf("poisoner");
  const hasPoisoner = poisonerSeat >= 0;
  // 스위트하트 취함: since 이후의 그 좌석은 능력이 비정상 동작한다 (독살과 같은 효과, 영구)
  const sweetTarget = sweet ? sweet.target : null;
  const sweetSince = sweet ? sweet.since : Infinity;

  const claimBySeat: (Claim | undefined)[] = [];
  for (const c of pz.claims) claimBySeat[c.seat] = c;

  const monkSeat = assignment.indexOf("monk");
  const soldierSeat = assignment.indexOf("soldier");
  const exoSeat = assignment.indexOf("exorcist");
  const assassinSeat = assignment.indexOf("assassin");
  const gfSeat = assignment.indexOf("godfather");
  const gmSeat = assignment.indexOf("grandmother");
  const swSeat = assignment.indexOf("scarletwoman");
  const gamblerSeat = assignment.indexOf("gambler");
  const tinkerSeat = assignment.indexOf("tinker");
  const mcSeat = assignment.indexOf("moonchild");
  const gossipSeat = assignment.indexOf("gossip");
  const mmSeat = assignment.indexOf("mastermind");
  const minstrelSeat = assignment.indexOf("minstrel");
  const tealadySeat = assignment.indexOf("tealady");
  const foolSeat = assignment.indexOf("fool");

  /** 좌석의 주장에서 특정 밤의 행동 기록 데이터 */
  function actionData(seat: Seat, type: "monk" | "exorcist" | "gambler", night: number) {
    return claimBySeat[seat]?.info.find((i) => i.night === night && i.data?.type === type)?.data;
  }

  // 달의 자손의 저주가 발동할 수 있는 밤: 죽음(밤 n → 다음 날 알게 됨 → 밤 n+1),
  // 처형(낮 d → 즉시 알게 됨 → 밤 d+1). 사망 시점은 이벤트로 고정이라 밤 하나로 정해진다.
  const mcCurseNight: number = (() => {
    if (mcSeat < 0) return -1;
    for (let n = 2; n <= pz.nights; n++) {
      if (sched.diedAtNight(n).includes(mcSeat)) return n + 1;
    }
    for (let d = 1; d <= pz.nights - 1; d++) {
      if (sched.executedOnDay(d) === mcSeat) return d + 1;
    }
    return -1;
  })();

  const gmClaimTarget: Seat | null = (() => {
    if (gmSeat < 0) return null;
    const rec = claimBySeat[gmSeat]?.info.find((i) => i.night === 1 && i.data?.type === "grandmother");
    return rec?.data && "target" in rec.data ? rec.data.target : null;
  })();

  const results: DemonScenario[] = [];

  /**
   * 노 다시가 demonSeat에 앉은 밤 night에 그 독을 받고 있었을 수 있는 좌석들.
   * 각 방향에서 죽은 좌석과 마을 사람 아닌 좌석을 건너뛰며 첫 마을 사람까지 —
   * 도중의 첩자는 주민으로 오등록돼 독을 흡수했을 수도 있다(∃, 계속 진행).
   * 밤 시작/킬 이후 두 생존 상태의 합집합 (밤중 사망으로 독이 옮겨 갔을 수 있다).
   */
  function ndPoisonedAt(demonSeat: Seat, night: number): Set<Seat> {
    const out = new Set<Seat>();
    const n = assignment.length;
    for (const alive of [sched.aliveAtNightStart(night), sched.aliveAfterNight(night)]) {
      for (const dir of [1, -1]) {
        for (let step = 1; step < n; step++) {
          const s = (demonSeat + dir * step + n) % n;
          if (s === demonSeat) break;
          if (!alive[s]) continue;
          if (ROLES[assignment[s]].team === "townsfolk") { out.add(s); break; }
          if (assignment[s] === "spy") out.add(s);
        }
      }
    }
    return out;
  }

  /** 밤 night에 seat의 능력 비정상 동작을 강제 (스위트하트 취함, 노 다시 독, 또는 독살). 모순이면 false */
  function require_(st: St, night: number, seat: Seat): boolean {
    if (sweetTarget === seat && sweetSince <= night) return true; // 이미 취해 있다 — 독살 불요
    if (demonRole === "nodashii" && ndPoisonedAt(st.demonNights[night] ?? st.demon, night).has(seat)) return true;
    if (!hasPoisoner) return false;
    if (sweetTarget === poisonerSeat && sweetSince <= night) return false; // 취한 독살범의 독은 듣지 않는다
    if (st.minstrelNights.includes(night)) return false; // 그 밤엔 독살범도 취해 있다
    const ex = st.required.get(night);
    if (ex !== undefined && ex !== seat) return false;
    if (st.forbidden.get(night)?.has(seat)) return false;
    st.required.set(night, seat);
    return true;
  }

  /** 밤 night에 seat의 능력 정상 동작을 강제 (취하지도 독살되지도 않음). 모순이면 false */
  function forbid_(st: St, night: number, seat: Seat): boolean {
    if (sweetTarget === seat && sweetSince <= night) return false; // 취해 있어 정상 동작 불가
    if (st.required.get(night) === seat) return false;
    if (!st.forbidden.has(night)) st.forbidden.set(night, new Set());
    st.forbidden.get(night)!.add(seat);
    return true;
  }

  function tokenAt(became: Map<Seat, number>, seat: Seat, time: number): RoleId {
    const since = became.get(seat);
    if (since !== undefined && since <= time) return demonRole;
    return assignment[seat];
  }

  /**
   * 찻집 여인의 보호가 **확실히** 작동하는 좌석인가 (양옆 생존 이웃이 반드시 선으로 등록).
   * 확실할 때만 죽음이 모순이 된다 — 은둔자·첩자 이웃은 악 등록이 가능해 보호가 새어도 된다.
   */
  function tlForced(alive: boolean[], dead: Seat): boolean {
    if (tealadySeat < 0 || !alive[tealadySeat] || dead === tealadySeat) return false;
    const nb = neighborsOf(alive, tealadySeat);
    if (!nb || !nb.includes(dead)) return false;
    return nb.every((x) => isGoodTeam(assignment[x]) && assignment[x] !== "recluse");
  }

  function finish(st: St) {
    results.push({
      demonDuringNight: st.demonNights,
      currentDemonSeat: st.demon,
      becameDemonAt: st.became,
      poisonRequired: st.required,
      poisonForbidden: st.forbidden,
      assassinNight: st.assassinNight,
      godfatherNights: new Set(st.godfatherNights),
      exorcistBlocked: new Set(st.exorcistBlocked),
      impKillDuringNight: [...st.impKills],
      minstrelNights: new Set(st.minstrelNights),
      zombuulFakeDeadAt: st.zombuulFakeDeadAt,
      nodashiiPoisoned: demonRole === "nodashii"
        ? Array.from({ length: pz.nights + 1 }, (_, n) =>
            n === 0 ? new Set<Seat>() : ndPoisonedAt(st.demonNights[n] ?? st.demon, n))
        : undefined,
    });
  }

  function doDay(st: St, day: number) {
    if (day === pz.nights) {
      finish(st); // 현재 시점: k일차 낮, 처형 전
      return;
    }
    const executed = sched.executedOnDay(day);
    if (executed === null) {
      doNight(st, day + 1, "none", false);
      return;
    }
    const aliveAtDay = sched.aliveAfterNight(day);
    const aliveBefore = countTrue(aliveAtDay);
    let branches: { st: St; demonless: boolean }[];
    if (executed === st.demon) {
      branches = [];
      // (0) 좀부울의 첫 죽음은 가짜다 — 등록상 죽지만 비밀리에 생존, 승계 없음.
      //     멀쩡했어야 가짜 죽음이 성립한다 (중독된 좀부울은 정말로 죽는다 — 아래 진짜 죽음 경로).
      if (demonRole === "zombuul" && st.zombuulFakeDeadAt === null) {
        const c = cloneSt(st);
        if (forbid_(c, day, executed)) {
          c.zombuulFakeDeadAt = day + 0.5;
          branches.push({ st: c, demonless: false });
        }
      }
      /** 진짜 죽음의 전제 — 좀부울이라면 그 시점의 중독이 강제된다 */
      const realDeath: Mut = (c) => demonRole !== "zombuul" || require_(c, day, executed);
      // (a) 탕녀 승계 — 게임이 계속된다
      const swOk = swSeat >= 0 && swSeat !== executed && aliveAtDay[swSeat] && !st.became.has(swSeat) && aliveBefore >= 5;
      if (swOk) {
        const c = cloneSt(st);
        if (realDeath(c) && forbid_(c, day, swSeat)) { // 중독된 탕녀는 승계 불가 (밤 day의 독이 낮까지 지속)
          c.demon = swSeat;
          c.became.set(swSeat, day + 0.5);
          c.poChoseNone = false; // 승계한 Po의 선택 상태는 새로 시작한다
          branches.push({ st: c, demonless: false });
        }
      }
      // (b) 마스터마인드 연장 — 게임을 '끝내는' 처형이어야 발동한다 (탕녀가 승계하면 안 끝남).
      //     하루(밤 하나 + 낮 하나)만 이어지므로 마지막 낮(nights-1) 처형일 때만 현재에 닿는다.
      const mmOk = mmSeat >= 0 && mmSeat !== executed && aliveAtDay[mmSeat] && !st.became.has(mmSeat)
        && day === pz.nights - 1 && demonRole !== "vortox";
      if (mmOk) {
        const c = cloneSt(st);
        let ok = realDeath(c) && forbid_(c, day, mmSeat); // 중독된 마스터마인드는 연장하지 못한다
        if (ok && swOk) ok = require_(c, day, swSeat); // 승계 가능했던 탕녀는 중독됐던 것
        if (ok) branches.push({ st: c, demonless: true });
      }
      if (branches.length === 0) return;
    } else {
      branches = [{ st: cloneSt(st), demonless: false }];
    }

    for (const br of branches) {
    const s = br.st;
    // 멀쩡한 성자 처형 = 게임 종료 → 처형된 성자는 그 밤 독살됐어야 한다
    if (assignment[executed] === "saint" && !require_(s, day, executed)) continue;
    // 보호가 확실한 찻집 여인의 이웃은 처형으로도 죽지 않는다 → 찻집 여인의 중독 강제
    if (tlForced(aliveAtDay, executed) && !require_(s, day, tealadySeat)) continue;
    // 회피를 쓰지 않은 어릿광대는 처형으로 죽지 않는다 → 그 밤의 중독 강제
    if (executed === foolSeat && !s.foolDodgeUsed && !require_(s, day, foolSeat)) continue;
    // 가짜 죽음 좀부울은 등록상 죽었지만 실제로 살아 있다 — 종료 판정에서 생존자로 센다
    if (aliveBefore - 1 + (s.zombuulFakeDeadAt !== null ? 1 : 0) <= 2) continue;

    // 트리거 계산: 처형으로 죽은 좌석의 토큰 등록
    const token = tokenAt(s.became, executed, day);
    let gfTrigger: Trigger = "none";
    if (token === "recluse" || token === "spy") gfTrigger = "may"; // 오등록 선택은 텔러 몫 (∃)
    else if (ROLES[token].team === "outsider") gfTrigger = "must";

    let minstrelMode: Trigger = "none";
    if (minstrelSeat >= 0 && executed !== minstrelSeat && aliveAtDay[minstrelSeat]) {
      if (token === "recluse" || token === "spy") minstrelMode = "may";
      else if (ROLES[token].team === "minion") minstrelMode = "must";
    }

    if (minstrelMode !== "none") {
      const act = cloneSt(s);
      if (forbid_(act, day, minstrelSeat)) doNight(act, day + 1, gfTrigger, true, br.demonless); // 멀쩡한 음유시인 → 전원 취함
      if (minstrelMode === "must") {
        const poi = cloneSt(s);
        if (require_(poi, day, minstrelSeat)) doNight(poi, day + 1, gfTrigger, false, br.demonless);
      } else {
        doNight(s, day + 1, gfTrigger, false, br.demonless); // 하수인으로 등록되지 않은 것으로 (∃)
      }
      continue;
    }
    doNight(s, day + 1, gfTrigger, false, br.demonless);
    }
  }

  type Mut = (s: St) => boolean;

  /** demonless: 마스터마인드 연장 밤 — 데몬이 죽어 있어 데몬 킬도, 킬 부재 설명도 없다 */
  function doNight(st: St, night: number, trigger: Trigger, minstrelActive: boolean, demonless = false) {
    st.demonNights[night] = st.demon;
    const deaths = sched.diedAtNight(night);
    if (night === 1) {
      // 첫 밤에는 아무 킬 수단도 작동하지 않는다
      if (deaths.length > 0) return;
      doDay(st, 1);
      return;
    }
    // 가짜 죽음 좀부울은 등록상 죽었어도 실제로 살아 있어 계속 진행한다
    const demonReallyAlive = sched.aliveAtNightStart(night)[st.demon]
      || (demonRole === "zombuul" && st.zombuulFakeDeadAt !== null);
    if (!demonless && !demonReallyAlive) return;

    if (minstrelActive) {
      // 전원 취함: 킬도, 독살도, 유효한 정보도 없는 밤
      if (deaths.length > 0) return;
      if (st.required.has(night)) return;
      st.minstrelNights.push(night);
      st.impKills[night] = [];
      // 취한 Po도 깨어나 선택은 한다 — '아무도 안 함'(다음 밤 3킬)과 대상 선택(취해서
      // 실패) 모두 가능. 3킬 밤이었다면 3명을 골랐고 전부 실패한 것이다.
      if (demonRole === "po" && !st.poChoseNone) {
        const c = cloneSt(st);
        c.poChoseNone = true;
        doDay(c, night);
      }
      st.poChoseNone = false;
      doDay(st, night);
      return;
    }

    const demon = st.demon;
    const aliveStart = sched.aliveAtNightStart(night);
    const aliveAfter = sched.aliveAfterNight(night);

    const assassinReady = assassinSeat >= 0 && !st.assassinUsed && !st.became.has(assassinSeat) && aliveStart[assassinSeat];
    const gfReady = gfSeat >= 0 && !st.became.has(gfSeat) && aliveStart[gfSeat];
    const monkAlive = monkSeat >= 0 && aliveStart[monkSeat];
    const monkData = monkAlive ? actionData(monkSeat, "monk", night) : undefined;
    const monkTarget = monkData && "target" in monkData ? monkData.target : null;
    const exoAlive = exoSeat >= 0 && aliveStart[exoSeat];
    const exoData = exoAlive ? actionData(exoSeat, "exorcist", night) : undefined;
    const exoTarget = exoData && "target" in exoData ? exoData.target : null;
    // 봉쇄 가능: 지목 기록이 악마를 가리키거나, 기록이 없어 ∃ 지목=악마
    const exoCanBlock = exoAlive && (exoTarget === demon || exoData === undefined);

    // 도박사의 이 밤 추측 기록
    const gambleData = gamblerSeat >= 0 && aliveStart[gamblerSeat] ? actionData(gamblerSeat, "gambler", night) : undefined;
    const gamble = gambleData && gambleData.type === "gambler" ? gambleData : undefined;
    const tokenView = { tokenRole: (x: Seat) => tokenAt(st.became, x, night), rolePool: pz.rolePool };
    /** 추측이 반드시 맞는가 (오답 사망 불가) / 반드시 틀리는가 (생존이 모순) */
    const gambleMustCorrect = gamble !== undefined && (() => {
      const tok = tokenAt(st.became, gamble.target, night);
      return tok === gamble.role && tok !== "spy" && tok !== "recluse";
    })();
    const gambleMustWrong = gamble !== undefined && !canShowAsRole(tokenView, gamble.target, gamble.role);

    // 찻집 여인이 이웃 보호로 킬 실패를 설명할 수 있는가 (이웃 둘 다 선 등록 가능)
    const tlCanProtect = tealadySeat >= 0 && aliveStart[tealadySeat] && (() => {
      const nb = neighborsOf(aliveStart, tealadySeat);
      return nb !== null && nb.every((x) => isGoodTeam(assignment[x]) || assignment[x] === "spy");
    })();

    // 좀부울: 직전 낮에 처형 사망이 있으면 깨어나지 않는다 — 그 밤 킬 불가, 킬 부재는 공짜
    const zombuulRested = demonRole === "zombuul" && sched.executedOnDay(night - 1) !== null;
    // 데몬 킬 집합: 보통은 0~1건, Po의 3킬 밤(직전 선택이 '아무도 안 함')에는 최대 3건,
    // 샤바로스는 매밤 2명 선택(시신 포함 가능)이라 최대 2건.
    const poTriple = demonRole === "po" && st.poChoseNone;
    const killSets: Seat[][] = demonless || zombuulRested ? [[]]
      : poTriple ? subsetsUpTo(deaths, 3)
      : demonRole === "shabaloth" ? subsetsUpTo(deaths, 2)
      : [[], ...deaths.map((d) => [d])];
    for (const demonKills of killSets) {
      const rest = deaths.filter((d) => !demonKills.includes(d));

      // ── 남은 죽음들을 {암살자, 대부, 할머니 연쇄, 도박 오답, 땜장이}에 귀속 ──
      // 각 귀속은 상태 변형(Mut) 목록으로 표현하고, 완성된 조합마다 임프 분기를 돈다.
      interface Plan { muts: Mut[]; gfKilled: boolean; demonByOther: boolean }
      const plans: Plan[] = [];
      const collect = (idx: number, usedAs: boolean, usedGf: boolean, usedLink: boolean, usedMc: boolean, usedGossip: boolean, muts: Mut[], gfKilled: boolean, demonByOther: boolean) => {
        if (idx === rest.length) {
          plans.push({ muts, gfKilled, demonByOther });
          return;
        }
        const d = rest[idx];
        const sideEffects = (killedByDemonlike: boolean): Mut => (s) => {
          // 찻집 여인의 확실한 보호를 뚫은 죽음 → 찻집 여인의 중독 (암살자는 보호 무시)
          if (tlForced(aliveStart, d) && !require_(s, night, tealadySeat)) return false;
          // 회피 미사용 어릿광대의 죽음 → 그 밤 중독 (암살자·자기 죽음 계열은 회피 무관)
          if (killedByDemonlike && d === foolSeat && !s.foolDodgeUsed && !require_(s, night, foolSeat)) return false;
          return true;
        };
        if (assassinReady && !usedAs) {
          collect(idx + 1, true, usedGf, usedLink, usedMc, usedGossip, [...muts, (s) => {
            if (!forbid_(s, night, assassinSeat)) return false; // 중독된 암살자는 죽이지 못한다
            s.assassinUsed = true;
            s.assassinNight = night;
            return true;
          }], gfKilled, demonByOther || d === demon);
        }
        if (gfReady && trigger !== "none" && !usedGf) {
          collect(idx + 1, usedAs, true, usedLink, usedMc, usedGossip, [...muts, (s) => {
            if (!forbid_(s, night, gfSeat)) return false;
            s.godfatherNights.push(night);
            return sideEffects(true)(s);
          }], true, demonByOther || d === demon);
        }
        if (d === gmSeat && !usedLink) {
          for (const link of demonKills) {
            if (!(isGoodTeam(assignment[link]) || assignment[link] === "spy")) continue;
            collect(idx + 1, usedAs, usedGf, true, usedMc, usedGossip, [...muts, (s) => {
              if (s.grandchild === null) s.grandchild = link; // 미확정 손주를 여기서 확정 (∃)
              else if (s.grandchild !== link) return false;
              if (!forbid_(s, night, gmSeat)) return false; // 중독된 할머니는 연쇄 사망하지 않는다
              return sideEffects(true)(s);
            }], gfKilled, demonByOther);
          }
        }
        if (d === gamblerSeat && gamble !== undefined && !gambleMustCorrect) {
          collect(idx + 1, usedAs, usedGf, usedLink, usedMc, usedGossip, [...muts, (s) => {
            if (!forbid_(s, night, gamblerSeat)) return false; // 중독된 도박사는 오답으로도 죽지 않는다
            return sideEffects(false)(s);
          }], gfKilled, demonByOther);
        }
        if (d === tinkerSeat) {
          collect(idx + 1, usedAs, usedGf, usedLink, usedMc, usedGossip, [...muts, (s) => {
            if (!forbid_(s, night, tinkerSeat)) return false; // 중독된 땜장이는 텔러가 죽일 수 없다
            return sideEffects(false)(s);
          }], gfKilled, demonByOther);
        }
        // 달의 자손의 저주: 어젯밤(또는 어제 낮 처형으로) 죽은 달의 자손이 선한 플레이어를
        // 지목했다 (∃) — 선으로 등록되는 좌석만 저주로 죽을 수 있고, 발동은 한 번뿐
        if (night === mcCurseNight && !usedMc && (isGoodTeam(assignment[d]) || assignment[d] === "spy")) {
          collect(idx + 1, usedAs, usedGf, usedLink, true, usedGossip, [...muts, (s) => {
            // 죽음을 알고 지목하던 시점(전날 밤~낮)에 멀쩡했어야 저주가 성립한다
            if (!forbid_(s, night - 1, mcSeat)) return false;
            return sideEffects(true)(s);
          }], gfKilled, demonByOther);
        }
        // 소문꾼: 어제 낮의 공개 발언이 참이었다면(∃ — 발언 내용은 기록되지 않는다)
        // 그 밤 텔러가 고른 1명이 죽는다. 밤당 발언 하나 → 한 번만.
        if (gossipSeat >= 0 && aliveStart[gossipSeat] && !usedGossip) {
          collect(idx + 1, usedAs, usedGf, usedLink, usedMc, true, [...muts, (s) => {
            if (!forbid_(s, night, gossipSeat)) return false; // 취하거나 중독된 소문꾼은 죽이지 못한다
            return sideEffects(true)(s);
          }], gfKilled, demonByOther || d === demon);
        }
      };
      collect(0, false, false, false, false, false, [], false, false);

      for (const plan of plans) {
        const base = cloneSt(st);
        base.impKills[night] = demonKills;
        let ok = true;
        for (const m of plan.muts) if (!m(base)) { ok = false; break; }
        if (!ok) continue;
        // 의무 트리거인데 대부 킬이 없다 → 대부가 그 밤 중독됐어야 한다
        if (trigger === "must" && gfReady && !plan.gfKilled && !require_(base, night, gfSeat)) continue;
        // 도박사가 반드시 틀리는 추측을 하고도 살아 있다 → 그 밤 중독됐어야 한다
        if (gamble !== undefined && gambleMustWrong && !deaths.includes(gamblerSeat) && !require_(base, night, gamblerSeat)) continue;

        // ── 임프 ──
        const impVariants: Mut[] = [];
        if (demonless) {
          impVariants.push(() => true); // 데몬이 죽은 연장 밤 — 킬도, 킬 부재의 설명도 없다
        } else if (demonKills.length > 0) {
          impVariants.push((s) => {
            if (!forbid_(s, night, demon)) return false; // 킬이 성공했으니 데몬은 중독 아님
            // 봉쇄됐어야 하는 밤에 킬이 났다 → 구마사제가 중독됐던 것
            if (exoTarget === demon && !require_(s, night, exoSeat)) return false;
            for (const k of demonKills) {
              // 멀쩡한 군인은 데몬에게 죽지 않는다
              if (k === soldierSeat && !require_(s, night, soldierSeat)) return false;
              // 수도사가 이 대상을 보호했다고 기록했다 → 수도사가 중독됐던 것
              if (monkTarget !== null && monkTarget === k && !require_(s, night, monkSeat)) return false;
              // 확실한 찻집 여인 보호를 뚫었다 → 찻집 여인의 중독
              if (tlForced(aliveStart, k) && !require_(s, night, tealadySeat)) return false;
              // 회피 미사용 어릿광대를 죽였다 → 어릿광대의 중독
              if (k === foolSeat && !s.foolDodgeUsed && !require_(s, night, foolSeat)) return false;
              // 손주가 데몬에게 죽었는데 할머니가 살아 있다 → 할머니가 중독됐던 것
              if (s.grandchild !== null && k === s.grandchild && gmSeat >= 0 && aliveStart[gmSeat] && !deaths.includes(gmSeat)) {
                if (!require_(s, night, gmSeat)) return false;
              }
            }
            s.poChoseNone = false; // Po: 대상을 골랐다 — '아무도 안 함'이 아니다
            return true;
          });
        } else {
          // 데몬 킬 부재 — 설명이 하나는 있어야 한다 (Po의 조용한 밤은 자발적 선택이라 공짜)
          if (zombuulRested) {
            // 어제 낮에 처형 사망이 있었다 — 좀부울은 애초에 깨어나지 않는 밤 (킬 부재가
            // 규칙이고, '선택했으나 실패' 계열 분기도 성립하지 않는다)
            impVariants.push(() => true);
          } else {
          if (demonRole === "shabaloth") {
            // 시신 2명을 골랐을 수 있다 — 킬 부재가 설명 없이 성립한다 (관대한 방향)
            impVariants.push(() => true);
          }
          if (demonRole === "po") {
            if (st.poChoseNone) {
              // 3킬 밤: 반드시 3명을 고르지만 죽은 좌석도 고를 수 있어
              // 사망 0건이 설명 없이 성립한다 (관대한 근사). 조용한 밤을 다시 고를 수는 없다.
              impVariants.push((s) => { s.poChoseNone = false; return true; });
            } else {
              // 자발적 '아무도 안 함' — 다음 밤 3킬이 열린다
              impVariants.push((s) => { s.poChoseNone = true; return true; });
            }
          }
          if (demonRole !== "po" || !st.poChoseNone) {
            // '선택은 했으나 실패' 계열 — Po라면 다음 밤 3킬이 열리지 않는다
            if (hasPoisoner) impVariants.push((s) => require_(s, night, demon));
            if (soldierSeat >= 0 && aliveStart[soldierSeat]) {
              impVariants.push((s) => forbid_(s, night, soldierSeat)); // 데몬이 멀쩡한 군인을 노렸다
            }
            if (monkAlive && (monkTarget === null || aliveStart[monkTarget])) {
              impVariants.push((s) => forbid_(s, night, monkSeat)); // 수도사가 데몬의 대상을 보호했다
            }
            if (tlCanProtect) {
              impVariants.push((s) => forbid_(s, night, tealadySeat)); // 보호받는 이웃을 노렸다
            }
            if (foolSeat >= 0 && aliveStart[foolSeat] && !st.foolDodgeUsed) {
              impVariants.push((s) => {
                if (!forbid_(s, night, foolSeat)) return false; // 어릿광대가 첫 죽음을 회피했다
                s.foolDodgeUsed = true;
                return true;
              });
            }
          }
          if (exoCanBlock) {
            impVariants.push((s) => {
              if (!forbid_(s, night, exoSeat)) return false; // 멀쩡한 구마사제가 악마를 지목했다
              s.exorcistBlocked.push(night);
              s.poChoseNone = false; // 봉쇄는 '아무도 안 함' 선택이 아니다 — 기상 자체가 없었다
              return true;
            });
          }
          }
        }

        for (const variant of impVariants) {
          const s2 = cloneSt(base);
          if (!variant(s2)) continue;

          // ── 데몬 사망 → 승계 ──
          let nexts: St[];
          if (demonKills.includes(demon) && demonRole === "imp") {
            // 스타 패스 (임프 전용): 텔러가 생존 하수인 중 하나를 임프로 만든다
            const eligible: Seat[] = [];
            for (let x = 0; x < assignment.length; x++) {
              if (aliveAfter[x] && !s2.became.has(x) && ROLES[assignment[x]].team === "minion") eligible.push(x);
            }
            nexts = eligible.map((e) => {
              const c = cloneSt(s2);
              c.demon = e;
              c.became.set(e, night);
              return c;
            });
          } else if (demonKills.includes(demon) || plan.demonByOther) {
            // 밤에 데몬이 살해당함 → 탕녀만이 게임을 지속시킨다 (생존 5인 이상)
            nexts = [];
            // 좀부울의 첫 죽음은 가짜 — 승계 없이 계속된다 (멀쩡했어야 한다.
            // 중독된 좀부울은 정말로 죽어 아래 탕녀 승계 경로로 간다)
            if (demonRole === "zombuul" && s2.zombuulFakeDeadAt === null) {
              const c = cloneSt(s2);
              if (forbid_(c, night, demon)) {
                c.zombuulFakeDeadAt = night;
                nexts.push(c);
              }
            }
            if (swSeat >= 0 && !s2.became.has(swSeat) && aliveAfter[swSeat] && countTrue(aliveStart) >= 5) {
              const c = cloneSt(s2);
              // 좀부울의 진짜 죽음(승계 발동)에는 그 시점 중독이 강제된다
              if (demonRole === "zombuul" && !require_(c, night, demon)) { /* 가짜 죽음만 가능 */ }
              else if (forbid_(c, night, swSeat)) {
                c.demon = swSeat;
                c.became.set(swSeat, night);
                c.poChoseNone = false; // 승계한 Po의 선택 상태는 새로 시작한다
                nexts.push(c);
              }
            }
          } else {
            nexts = [s2];
          }

          for (const nx of nexts) {
            // 게임이 이미 끝났어야 한다 — 가짜 죽음 좀부울은 실제로 살아 있어 생존자로 센다
            const fakeAlive = nx.zombuulFakeDeadAt !== null ? 1 : 0;
            if (deaths.length > 0 && countTrue(aliveAfter) + fakeAlive <= 2) continue;
            doDay(nx, night);
          }
        }
      }
    }
  }

  const st0: St = {
    demon: origDemonSeat,
    became: new Map([[origDemonSeat, 0]]),
    demonNights: [],
    required: new Map(),
    forbidden: new Map(),
    assassinUsed: false,
    assassinNight: null,
    godfatherNights: [],
    exorcistBlocked: [],
    impKills: [],
    minstrelNights: [],
    foolDodgeUsed: false,
    poChoseNone: false,
    zombuulFakeDeadAt: null,
    grandchild: null,
  };

  // 스위트하트 사망 순간의 상태 제약: 취함 발동에는 멀쩡함이, 미발동에는 중독이 필요하다
  if (sweet) {
    const ok = sweet.target === null
      ? require_(st0, sweet.deathNight, sweet.sweetSeat)
      : forbid_(st0, sweet.deathNight, sweet.sweetSeat);
    if (!ok) return results;
  }

  // 할머니 밤1 정보의 취함/중독 여부가 손주 확정을 좌우하므로 최상위에서 분기한다.
  // Vortox 세계에서는 멀쩡한 할머니의 정보도 거짓이라 손주가 확정되지 않는다 — 미확정(∃)으로 둔다.
  if (gmSeat >= 0 && gmClaimTarget !== null && demonRole !== "vortox") {
    const target = gmClaimTarget;
    const canBeGrandchild = target !== gmSeat && (isGoodTeam(assignment[target]) || assignment[target] === "spy");
    if (canBeGrandchild) {
      const sober = cloneSt(st0);
      sober.grandchild = target;
      if (forbid_(sober, 1, gmSeat)) doNight(sober, 1, "none", false);
    }
    if (hasPoisoner) {
      const poisoned = cloneSt(st0);
      if (require_(poisoned, 1, gmSeat)) doNight(poisoned, 1, "none", false);
    }
  } else {
    doNight(st0, 1, "none", false);
  }

  return results;
}

/** 밤 night 시점의 토큰 역할 (데몬 승계 반영 — 승계자는 그 판의 데몬 역할이 된다) */
export function tokenRoleAt(assignment: RoleId[], sc: DemonScenario, seat: Seat, night: number): RoleId {
  const since = sc.becameDemonAt.get(seat);
  if (since !== undefined && since <= night) {
    return assignment.find((r) => ROLES[r].team === "demon") ?? "imp";
  }
  return assignment[seat];
}
