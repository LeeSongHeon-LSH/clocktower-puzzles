// 시간축 처리.
//
// 진행 순서 모델: 밤1 → 낮1 → 밤2 → 낮2 → … → 밤k → (현재: k일차 낮, 처형 전).
// - 처형(execution)은 낮 d (1 ≤ d ≤ k-1), 밤 사망(death)은 밤 n (2 ≤ n ≤ k).
// - 한 밤의 사망은 여러 건일 수 있다. 각 죽음은 임프 킬 / 암살자 / 대부 / 할머니 연쇄
//   중 하나로 귀속돼야 하고, demonScenarios가 가능한 귀속을 전부 분기한다.
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
// - 대부 트리거는 "낮 처형으로 죽은 외부인"만 본다 (이 모델의 낮 사망은 처형뿐이다).

import { ROLES } from "@/data/roles";
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
    grandchild: s.grandchild,
  };
}

function countTrue(arr: boolean[]): number {
  return arr.filter(Boolean).length;
}

function isGoodTeam(role: RoleId): boolean {
  const t = ROLES[role].team;
  return t === "townsfolk" || t === "outsider";
}

/**
 * 배정에 대해 이벤트와 정합 가능한 데몬 승계·킬 귀속 시나리오를 모두 반환.
 * 게임이 이미 끝났어야 하는 경로(데몬 사망 후 승계 불가, 생존 2인 이하)는 제외.
 * 빈 배열 = 이 배정은 이벤트와 모순.
 */
export function demonScenarios(pz: SolverPuzzle, sched: Schedule, assignment: RoleId[]): DemonScenario[] {
  const impSeat = assignment.indexOf("imp");
  if (impSeat < 0) return [];
  const hasPoisoner = assignment.includes("poisoner");

  const claimBySeat: (Claim | undefined)[] = [];
  for (const c of pz.claims) claimBySeat[c.seat] = c;

  const monkSeat = assignment.indexOf("monk");
  const soldierSeat = assignment.indexOf("soldier");
  const exoSeat = assignment.indexOf("exorcist");
  const assassinSeat = assignment.indexOf("assassin");
  const gfSeat = assignment.indexOf("godfather");
  const gmSeat = assignment.indexOf("grandmother");
  const swSeat = assignment.indexOf("scarletwoman");

  /** 좌석의 주장에서 특정 밤의 행동 대상 (수도사 보호·구마사제 지목). 기록이 없으면 null */
  function actionTarget(seat: Seat, type: "monk" | "exorcist", night: number): Seat | null {
    const rec = claimBySeat[seat]?.info.find((i) => i.night === night && i.data?.type === type);
    return rec?.data && "target" in rec.data ? rec.data.target : null;
  }

  const gmClaimTarget: Seat | null = (() => {
    if (gmSeat < 0) return null;
    const rec = claimBySeat[gmSeat]?.info.find((i) => i.night === 1 && i.data?.type === "grandmother");
    return rec?.data && "target" in rec.data ? rec.data.target : null;
  })();

  const results: DemonScenario[] = [];

  /** 밤 night에 seat 독살을 강제. 모순이면 false */
  function require_(st: St, night: number, seat: Seat): boolean {
    if (!hasPoisoner) return false;
    const ex = st.required.get(night);
    if (ex !== undefined && ex !== seat) return false;
    if (st.forbidden.get(night)?.has(seat)) return false;
    st.required.set(night, seat);
    return true;
  }

  /** 밤 night에 seat이 독살되지 않았음을 강제. 모순이면 false */
  function forbid_(st: St, night: number, seat: Seat): boolean {
    if (st.required.get(night) === seat) return false;
    if (!st.forbidden.has(night)) st.forbidden.set(night, new Set());
    st.forbidden.get(night)!.add(seat);
    return true;
  }

  function tokenAt(became: Map<Seat, number>, seat: Seat, time: number): RoleId {
    const since = became.get(seat);
    if (since !== undefined && since <= time) return "imp";
    return assignment[seat];
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
    });
  }

  function doDay(st: St, day: number) {
    if (day === pz.nights) {
      finish(st); // 현재 시점: k일차 낮, 처형 전
      return;
    }
    const executed = sched.executedOnDay(day);
    if (executed === null) {
      doNight(st, day + 1, "none");
      return;
    }
    const aliveBefore = countTrue(sched.aliveAfterNight(day));
    const s = cloneSt(st);
    if (executed === s.demon) {
      // 탕녀 승계만이 게임을 지속시킨다
      const swOk = swSeat >= 0 && swSeat !== executed && sched.aliveAfterNight(day)[swSeat] && !s.became.has(swSeat) && aliveBefore >= 5;
      if (!swOk) return;
      if (!forbid_(s, day, swSeat)) return; // 중독된 탕녀는 승계 불가 (밤 day의 독이 낮까지 지속)
      s.demon = swSeat;
      s.became.set(swSeat, day + 0.5);
    }
    // 멀쩡한 성자 처형 = 게임 종료 → 처형된 성자는 그 밤 독살됐어야 한다
    if (assignment[executed] === "saint" && !require_(s, day, executed)) return;
    if (aliveBefore - 1 <= 2) return;

    // 대부 트리거: 처형으로 죽은 좌석이 외부인으로 등록되는가
    const token = tokenAt(s.became, executed, day);
    let trigger: Trigger = "none";
    if (token === "recluse" || token === "spy") trigger = "may"; // 오등록 선택은 텔러 몫 (∃)
    else if (ROLES[token].team === "outsider") trigger = "must";

    doNight(s, day + 1, trigger);
  }

  function doNight(st: St, night: number, trigger: Trigger) {
    st.demonNights[night] = st.demon;
    const deaths = sched.diedAtNight(night);
    if (night === 1) {
      // 첫 밤에는 아무 킬 수단도 작동하지 않는다
      if (deaths.length > 0) return;
      doDay(st, 1);
      return;
    }
    if (!sched.aliveAtNightStart(night)[st.demon]) return;

    const demon = st.demon;
    const aliveStart = sched.aliveAtNightStart(night);
    const aliveAfter = sched.aliveAfterNight(night);

    const assassinReady = assassinSeat >= 0 && !st.assassinUsed && !st.became.has(assassinSeat) && aliveStart[assassinSeat];
    const gfReady = gfSeat >= 0 && !st.became.has(gfSeat) && aliveStart[gfSeat];
    const monkAlive = monkSeat >= 0 && aliveStart[monkSeat];
    const monkTarget = monkAlive ? actionTarget(monkSeat, "monk", night) : null;
    const exoAlive = exoSeat >= 0 && aliveStart[exoSeat];
    const exoTarget = exoAlive ? actionTarget(exoSeat, "exorcist", night) : null;
    const exoHasClaim = exoAlive && claimBySeat[exoSeat]?.info.some((i) => i.night === night && i.data?.type === "exorcist") === true;
    // 봉쇄 가능: 지목 기록이 악마를 가리키거나, 기록이 없어 ∃ 지목=악마
    const exoCanBlock = exoAlive && (exoTarget === demon || !exoHasClaim);

    for (const impKill of [...deaths, null] as (Seat | null)[]) {
      const rest1 = deaths.filter((d) => d !== impKill);
      const assassinChoices: (Seat | null)[] = assassinReady ? [...rest1, null] : [null];
      for (const asKill of assassinChoices) {
        const rest2 = rest1.filter((d) => d !== asKill);
        const gfChoices: (Seat | null)[] = gfReady && trigger !== "none" ? [...rest2, null] : [null];
        for (const gfKill of gfChoices) {
          const rest3 = rest2.filter((d) => d !== gfKill);

          // 남은 죽음은 전부 할머니 연쇄여야 한다 (할머니는 1명 → 최대 1건)
          if (rest3.length > 1) continue;
          const linkDeath = rest3.length === 1;
          if (linkDeath) {
            if (rest3[0] !== gmSeat || impKill === null || impKill === gmSeat) continue;
            // 손주는 선한 플레이어여야 한다 (첩자는 선으로 등록될 수 있어 허용)
            if (!isGoodTeam(assignment[impKill]) && assignment[impKill] !== "spy") continue;
          }

          const base = cloneSt(st);
          let ok = true;

          // ── 임프 외 킬 주체 제약 ──
          if (asKill !== null) {
            ok = forbid_(base, night, assassinSeat); // 중독된 암살자는 죽이지 못한다
            base.assassinUsed = true;
            base.assassinNight = night;
          }
          if (ok && gfKill !== null) {
            ok = forbid_(base, night, gfSeat);
            base.godfatherNights.push(night);
          }
          // 의무 트리거인데 대부 킬이 없다 → 대부가 그 밤 중독됐어야 한다
          if (ok && trigger === "must" && gfReady && gfKill === null) {
            ok = require_(base, night, gfSeat);
          }
          if (ok && linkDeath) {
            if (base.grandchild === null) base.grandchild = impKill; // 미확정 손주를 여기서 확정 (∃)
            else if (base.grandchild !== impKill) ok = false;
            // 중독된 할머니는 연쇄 사망하지 않는다 — 죽었으니 멀쩡했어야 한다
            if (ok) ok = forbid_(base, night, gmSeat);
          }
          if (!ok) continue;

          // ── 임프 ──
          const impVariants: ((s: St) => boolean)[] = [];
          if (impKill !== null) {
            impVariants.push((s) => {
              if (!forbid_(s, night, demon)) return false; // 킬이 성공했으니 데몬은 중독 아님
              // 봉쇄됐어야 하는 밤에 킬이 났다 → 구마사제가 중독됐던 것
              if (exoTarget === demon && !require_(s, night, exoSeat)) return false;
              // 멀쩡한 군인은 임프에게 죽지 않는다
              if (impKill === soldierSeat && !require_(s, night, soldierSeat)) return false;
              // 수도사가 이 대상을 보호했다고 기록했다 → 수도사가 중독됐던 것
              if (monkTarget !== null && monkTarget === impKill && !require_(s, night, monkSeat)) return false;
              // 손주가 임프에게 죽었는데 할머니가 살아 있다 → 할머니가 중독됐던 것
              if (s.grandchild !== null && impKill === s.grandchild && gmSeat >= 0 && aliveStart[gmSeat] && !deaths.includes(gmSeat)) {
                if (!require_(s, night, gmSeat)) return false;
              }
              return true;
            });
          } else {
            // 임프 킬 부재 — 설명이 하나는 있어야 한다
            if (hasPoisoner) impVariants.push((s) => require_(s, night, demon));
            if (soldierSeat >= 0 && aliveStart[soldierSeat]) {
              impVariants.push((s) => forbid_(s, night, soldierSeat)); // 임프가 멀쩡한 군인을 노렸다
            }
            if (monkAlive && (monkTarget === null || aliveStart[monkTarget])) {
              impVariants.push((s) => forbid_(s, night, monkSeat)); // 수도사가 임프의 대상을 보호했다
            }
            if (exoCanBlock) {
              impVariants.push((s) => {
                if (!forbid_(s, night, exoSeat)) return false; // 멀쩡한 구마사제가 악마를 지목했다
                s.exorcistBlocked.push(night);
                return true;
              });
            }
          }

          for (const variant of impVariants) {
            const s2 = cloneSt(base);
            if (!variant(s2)) continue;

            // ── 데몬 사망 → 승계 ──
            let nexts: St[];
            if (impKill === demon) {
              // 스타 패스: 텔러가 생존 하수인 중 하나를 임프로 만든다
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
            } else if (asKill === demon || gfKill === demon) {
              // 밤에 데몬이 살해당함 → 탕녀만이 게임을 지속시킨다 (생존 5인 이상)
              nexts = [];
              if (swSeat >= 0 && !s2.became.has(swSeat) && aliveAfter[swSeat] && countTrue(aliveStart) >= 5) {
                const c = cloneSt(s2);
                if (forbid_(c, night, swSeat)) {
                  c.demon = swSeat;
                  c.became.set(swSeat, night);
                  nexts = [c];
                }
              }
            } else {
              nexts = [s2];
            }

            if (deaths.length > 0 && countTrue(aliveAfter) <= 2) continue; // 게임이 이미 끝났어야 한다
            for (const nx of nexts) doDay(nx, night);
          }
        }
      }
    }
  }

  const st0: St = {
    demon: impSeat,
    became: new Map([[impSeat, 0]]),
    demonNights: [],
    required: new Map(),
    forbidden: new Map(),
    assassinUsed: false,
    assassinNight: null,
    godfatherNights: [],
    exorcistBlocked: [],
    grandchild: null,
  };

  // 할머니 밤1 정보의 취함/중독 여부가 손주 확정을 좌우하므로 최상위에서 분기한다
  if (gmSeat >= 0 && gmClaimTarget !== null) {
    const target = gmClaimTarget;
    const canBeGrandchild = target !== gmSeat && (isGoodTeam(assignment[target]) || assignment[target] === "spy");
    if (canBeGrandchild) {
      const sober = cloneSt(st0);
      sober.grandchild = target;
      if (forbid_(sober, 1, gmSeat)) doNight(sober, 1, "none");
    }
    if (hasPoisoner) {
      const poisoned = cloneSt(st0);
      if (require_(poisoned, 1, gmSeat)) doNight(poisoned, 1, "none");
    }
  } else {
    doNight(st0, 1, "none");
  }

  return results;
}

/** 밤 night 시점의 토큰 역할 (데몬 승계 반영) */
export function tokenRoleAt(assignment: RoleId[], sc: DemonScenario, seat: Seat, night: number): RoleId {
  const since = sc.becameDemonAt.get(seat);
  if (since !== undefined && since <= night) return "imp";
  return assignment[seat];
}
