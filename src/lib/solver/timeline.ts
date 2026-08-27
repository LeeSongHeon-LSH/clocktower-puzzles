// 시간축 처리.
//
// 진행 순서 모델: 밤1 → 낮1 → 밤2 → 낮2 → … → 밤k → (현재: k일차 낮, 처형 전).
// - 처형(execution)은 낮 d (1 ≤ d ≤ k-1), 밤 사망(death)은 밤 n (2 ≤ n ≤ k).
// - 한 밤에 사망 이벤트가 여러 건일 수 있다(타임라인은 그대로 담는다). 다만 지금 모델링된
//   역할 중 한 밤에 둘 이상을 죽이는 능력은 없으므로, 그런 밤은 demonScenarios가 배제한다.
// - 밤 정보는 그 밤의 킬 이후 상태를 본다 (밤 순서상 정보 역할이 임프보다 뒤).
//
// 생존 여부는 이벤트만으로 결정되므로 월드와 무관하게 한 번 계산한다(Schedule).
// 데몬 승계(스타 패스, 탕녀)는 월드 의존이며, 독살 선택과 얽히므로
// 시나리오가 "밤 n에 반드시/절대 독살돼야 하는 좌석" 제약을 방출하고
// solve가 주장 검증에서 나온 독살 요구와 병합해 일관성을 판정한다.

import type { RoleId, Seat, SolverPuzzle } from "./types";

const MINION_ROLES: RoleId[] = ["poisoner", "spy", "baron", "scarletwoman"];

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

// ── DemonScenario: 데몬 승계 시나리오 + 독살 제약 ─────────────────

export interface DemonScenario {
  /** demonDuringNight[n] = 밤 n의 킬 주체인 데몬 좌석 */
  demonDuringNight: Seat[];
  currentDemonSeat: Seat;
  /**
   * 좌석 → 데몬이 된 시점. 원래 임프는 0.
   * 밤 n 스타 패스 승계는 n, 낮 n 처형 승계는 n + 0.5 (밤 n+1부터 임프 토큰).
   */
  becameDemonAt: Map<Seat, number>;
  /** 밤 n → 반드시 이 좌석이 독살돼야 함 (킬 실패 = 데몬 중독) */
  poisonRequired: Map<number, Seat>;
  /** 밤 n → 이 좌석들은 독살되면 안 됨 (킬 성공한 데몬, 승계한 탕녀) */
  poisonForbidden: Map<number, Set<Seat>>;
}

function forbid(m: Map<number, Set<Seat>>, night: number, seat: Seat) {
  if (!m.has(night)) m.set(night, new Set());
  m.get(night)!.add(seat);
}

/**
 * 배정에 대해 이벤트와 정합 가능한 데몬 승계 시나리오를 모두 반환.
 * 게임이 이미 끝났어야 하는 경로(데몬 사망 후 승계 불가, 생존 2인 이하)는 제외.
 * 빈 배열 = 이 배정은 이벤트와 모순.
 */
export function demonScenarios(pz: SolverPuzzle, sched: Schedule, assignment: RoleId[]): DemonScenario[] {
  const impSeat = assignment.indexOf("imp");
  if (impSeat < 0) return [];
  const hasPoisoner = assignment.includes("poisoner");
  const results: DemonScenario[] = [];

  interface State {
    demon: Seat;
    became: Map<Seat, number>;
    night: number;
    demonNights: Seat[];
    required: Map<number, Seat>;
    forbidden: Map<number, Set<Seat>>;
  }
  const stack: State[] = [
    {
      demon: impSeat,
      became: new Map([[impSeat, 0]]),
      night: 1,
      demonNights: [],
      required: new Map(),
      forbidden: new Map(),
    },
  ];

  while (stack.length) {
    const st = stack.pop()!;
    let demon = st.demon;
    const became = new Map(st.became);
    const demonNights = [...st.demonNights];
    const required = new Map(st.required);
    const forbidden = new Map<number, Set<Seat>>();
    for (const [k, v] of st.forbidden) forbidden.set(k, new Set(v));
    let valid = true;

    for (let night = st.night; night <= pz.nights && valid; night++) {
      demonNights[night] = demon;
      const deaths = sched.diedAtNight(night);
      // ── 밤 night: 임프 킬 ──
      if (night === 1) {
        if (deaths.length > 0) { valid = false; break; }
      } else if (deaths.length > 1) {
        // 임프의 킬은 밤당 1명. 두 번째 죽음을 설명할 능력이 아직 모델에 없다.
        valid = false; break;
      } else {
        const dead = deaths.length === 1 ? deaths[0] : null;
        if (!sched.aliveAtNightStart(night)[demon]) { valid = false; break; }
        if (dead === null) {
          // 킬 실패: 데몬이 중독됐어야 한다 (풀에 다른 실패 요인 없음)
          if (!hasPoisoner) { valid = false; break; }
          if (required.has(night) && required.get(night) !== demon) { valid = false; break; }
          required.set(night, demon);
        } else {
          forbid(forbidden, night, demon); // 킬이 성공했으니 데몬은 중독 아님
          if (dead === demon) {
            // 스타 패스: 텔러가 생존 하수인 중 하나를 임프로 만든다
            const aliveAfter = sched.aliveAfterNight(night);
            const eligible: Seat[] = [];
            for (let s = 0; s < assignment.length; s++) {
              if (aliveAfter[s] && !became.has(s) && MINION_ROLES.includes(assignment[s])) eligible.push(s);
            }
            if (eligible.length === 0) { valid = false; break; }
            for (let i = 1; i < eligible.length; i++) {
              const b = new Map(became);
              b.set(eligible[i], night);
              const r = new Map(required);
              const f = new Map<number, Set<Seat>>();
              for (const [k, v] of forbidden) f.set(k, new Set(v));
              stack.push({ demon: eligible[i], became: b, night: night + 1, demonNights: [...demonNights], required: r, forbidden: f });
            }
            demon = eligible[0];
            became.set(demon, night);
          }
          if (sched.aliveAfterNight(night).filter(Boolean).length <= 2) { valid = false; break; }
        }
      }
      // ── 낮 night: 처형 ──
      const executed = sched.executedOnDay(night);
      if (executed !== null) {
        const aliveBefore = sched.aliveAfterNight(night).filter(Boolean).length;
        if (executed === demon) {
          // 탕녀 승계만이 게임을 지속시킨다
          const sw = assignment.indexOf("scarletwoman");
          const swOk = sw >= 0 && sw !== executed && sched.aliveAfterNight(night)[sw] && !became.has(sw) && aliveBefore >= 5;
          if (!swOk) { valid = false; break; }
          forbid(forbidden, night, sw); // 중독된 탕녀는 승계 불가 (밤 night의 독이 낮까지 지속)
          demon = sw;
          became.set(sw, night + 0.5);
        }
        if (aliveBefore - 1 <= 2) { valid = false; break; }
      }
    }

    if (valid) {
      // required와 forbidden의 충돌 검사
      for (const [night, seat] of required) {
        if (forbidden.get(night)?.has(seat)) { valid = false; break; }
      }
    }
    if (valid) {
      results.push({
        demonDuringNight: demonNights,
        currentDemonSeat: demon,
        becameDemonAt: became,
        poisonRequired: required,
        poisonForbidden: forbidden,
      });
    }
  }
  return results;
}

/** 밤 night 시점의 토큰 역할 (데몬 승계 반영) */
export function tokenRoleAt(assignment: RoleId[], sc: DemonScenario, seat: Seat, night: number): RoleId {
  const since = sc.becameDemonAt.get(seat);
  if (since !== undefined && since <= night) return "imp";
  return assignment[seat];
}
