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
// - 푸카: 밤 n의 킬 = 밤 n-1의 중독 선택 (밤1부터 선택, 밤2부터 킬). 킬에는 선택 밤과
//   실행 밤 모두의 멀쩡함이 강제된다. 킬 부재는 선택 실패(군인·수도사는 선택 밤 기준)·
//   선택 무효(그 밤 비정상)·그 낮 처형자가 선택이었던 경우(공짜)·죽음 단계 무산(실행 밤
//   비정상 — 알 수 없는 중독 생존자가 남는 '누수')으로 설명한다. 푸카 독을 받았을 수
//   있는 좌석은 관대 집합으로 계산한다 (nodashiiPoisoned 선례 — require 만족·forbid
//   불파괴). 누수의 독 지속은 그 두 밤까지로 한정하고, 봉쇄·무산이 다음 밤 선택 부재로
//   이어지는 연쇄는 강제하지 않는다 (전부 세계를 늘리는 관대한 방향).
// - 좀부울: 직전 낮에 처형 사망이 있으면 깨어나지 않는다 (그 밤 킬 불가·킬 부재 공짜).
//   첫 죽음은 가짜 — 이벤트는 그대로 두되(등록상 사망) 비밀리에 생존해 계속 킬하고,
//   탕녀 승계도 발동하지 않는다. 죽는 순간 중독됐다면 정말로 죽는다 (그쪽만 승계 분기).
//   같은 좌석의 두 번째 사망은 스키마상 입력 불가라 표현 가능한 퍼즐에서 좀부울의 진짜
//   죽음은 (중독 분기 외엔) 없다. 생존 2인 이하 종료 판정에서 가짜 죽음 좀부울은
//   생존자로 센다 (실제로 살아 있다 — 게임이 계속되는 관대한 방향).

import { ROLES } from "@/data/roles";
import { canShowAsRole, pithagSelfOptionsAt } from "./registration";
import type { Claim, InfoData, RoleId, Seat, SolverPuzzle } from "./types";

// ── Schedule: 이벤트만으로 결정되는 생존 상태 ─────────────────────

/** 낮 공개 행동 (일어난 순서 = 이벤트 배열 순서) */
export type DayAction =
  | { type: "slayerShot"; seat: Seat; target: Seat; died: boolean }
  | { type: "nomination"; nominator: Seat; nominee: Seat }
  | { type: "virginTrigger"; nominator: Seat; nominee: Seat };

export class Schedule {
  readonly nights: number;
  private readonly deathsAtNight = new Map<number, Seat[]>();
  private readonly execOnDay = new Map<number, Seat>();
  private readonly virginDay = new Set<number>(); // execOnDay 중 처녀 발동으로 인한 낮
  private readonly actionsOnDay = new Map<number, DayAction[]>();
  private readonly slainByDay = new Map<number, Seat[]>(); // 총격 사망 (처형 아님)
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
      } else if (ev.type === "execution" || ev.type === "virginTrigger") {
        const day = ev.day;
        const seat = ev.type === "execution" ? ev.seat : ev.nominator;
        if (day < 1 || day > pz.nights - 1) throw new Error(`처형 시점이 범위 밖: 낮 ${day}`);
        if (this.execOnDay.has(day)) throw new Error(`낮 ${day}에 처형이 2건`);
        this.execOnDay.set(day, seat);
        if (ev.type === "virginTrigger") {
          this.virginDay.add(day);
          this.pushAction(day, { type: "virginTrigger", nominator: ev.nominator, nominee: ev.nominee });
        }
      } else if (ev.type === "slayerShot") {
        // 현재 낮(nights)의 총격도 허용 — "오늘 쐈는데 안 죽었다/죽었다"가 단서가 된다
        if (ev.day < 1 || ev.day > pz.nights) throw new Error(`총격 시점이 범위 밖: 낮 ${ev.day}`);
        this.pushAction(ev.day, { type: "slayerShot", seat: ev.seat, target: ev.target, died: ev.died });
        if (ev.died) {
          const slain = this.slainByDay.get(ev.day) ?? [];
          slain.push(ev.target);
          this.slainByDay.set(ev.day, slain);
        }
      } else if (ev.type === "vote") {
        // 투표는 죽음을 만들지 않고, 유령 투표가 있어 죽은 좌석도 가능하다 — 범위만 검증
        if (ev.day < 1 || ev.day > pz.nights) throw new Error(`투표 시점이 범위 밖: 낮 ${ev.day}`);
      } else {
        if (ev.day < 1 || ev.day > pz.nights) throw new Error(`지명 시점이 범위 밖: 낮 ${ev.day}`);
        if (ev.nominator === ev.nominee) throw new Error(`낮 ${ev.day}: 자기 자신을 지명할 수 없습니다`);
        this.pushAction(ev.day, { type: "nomination", nominator: ev.nominator, nominee: ev.nominee });
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
      // 낮의 죽음: 이벤트 배열 순서대로 (총격·처녀 발동), 마지막에 일반 처형
      for (const act of this.actionsOnDay.get(night) ?? []) {
        const involved = act.type === "slayerShot" ? [act.seat, act.target] : [act.nominator, act.nominee];
        for (const s of involved) {
          if (!alive[s]) throw new Error(`낮 ${night}: 이미 죽은 좌석 ${s}이 낮 행동에 참여`);
        }
        const dies = act.type === "slayerShot" ? (act.died ? act.target : null)
          : act.type === "virginTrigger" ? act.nominator : null;
        if (dies !== null) {
          alive = [...alive];
          alive[dies] = false;
        }
      }
      const executed = this.execOnDay.get(night);
      if (executed !== undefined && !this.virginDay.has(night)) {
        if (!alive[executed]) throw new Error(`낮 ${night}: 이미 죽은 좌석 ${executed}을 처형`);
        alive = [...alive];
        alive[executed] = false;
      }
    }
  }

  private pushAction(day: number, act: DayAction) {
    const list = this.actionsOnDay.get(day) ?? [];
    list.push(act);
    this.actionsOnDay.set(day, list);
  }

  /** 밤 night에 죽은 채 발견된 좌석들 (없으면 빈 배열) */
  diedAtNight(night: number): Seat[] {
    return this.deathsAtNight.get(night) ?? [];
  }
  executedOnDay(day: number): Seat | null {
    return this.execOnDay.get(day) ?? null;
  }
  /** 낮 day의 처형이 처녀 발동으로 인한 것인가 */
  isVirginExecution(day: number): boolean {
    return this.virginDay.has(day);
  }
  /** 낮 day의 공개 행동 (일어난 순서) */
  dayActions(day: number): DayAction[] {
    return this.actionsOnDay.get(day) ?? [];
  }
  /** 낮 day에 총격으로 죽은 좌석들 (처형 아님) */
  slainOnDay(day: number): Seat[] {
    return this.slainByDay.get(day) ?? [];
  }
  aliveAtNightStart(night: number): boolean[] {
    return this.aliveStart[night];
  }
  /** 밤 night 킬 이후 생존 여부 (그 밤의 정보 역할이 보는 상태) */
  aliveAfterNight(night: number): boolean[] {
    return this.aliveAfter[night];
  }
  aliveNow(): boolean[] {
    const alive = [...this.aliveAfter[this.nights]];
    for (const s of this.slainByDay.get(this.nights) ?? []) alive[s] = false; // 현재 낮의 총격 사망
    return alive;
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
  /**
   * 푸카 세계: 밤 n에 푸카의 독을 받고 '있었을 수 있는' 좌석들 (관대 집합).
   * 킬 희생자(선택 밤·실행 밤), 그 낮 처형된 선택, 무산 누수(생존자 전원), 마지막 밤의
   * 새 선택(결과가 아직 없어 생존자 누구든)을 담는다. nodashiiPoisoned와 같은 규약 —
   * 정보 무제약, require 만족, forbid 불파괴.
   */
  pukkaPoisoned?: Set<Seat>[];
  /**
   * 이동식 취함 원천(선원·여관주인·대신)의 확정 취함: extraDrunk[n] = 밤 n(과 낮 n)에
   * 취해 있던 좌석들. 이 시나리오(분기) 안에서는 확실하다 — 그 좌석의 그 밤 정보는 무제약이다.
   */
  extraDrunk?: Set<Seat>[];
  /** 이발사 교환 (있으면 tokenRoleAt이 since부터 a·b의 토큰을 맞바꾼다) */
  roleSwap?: RoleSwapCase;
  /**
   * 마귀할멈 변신 (24차): 좌석이 since부터 role의 토큰을 갖는다. solve가 주장의
   * roleChange에서 결정적으로 만들고(분기 아님), timeline은 그 밤에 변신이 가능했는지만
   * 검사한다 (마귀할멈 생존·멀쩡함, 새 역할이 그때 판에 없었음).
   */
  roleChanges?: { seat: Seat; since: number; role: RoleId }[];
  /**
   * 건달 세계 (25차): 밤 n의 건달 진영. "either" = 그 밤 도중에 바뀌었다 —
   * 그 밤의 정보 역할이 첫 선택자보다 앞섰는지 뒤섰는지 따지지 않고 양쪽을 허용한다 (관대).
   */
  goonAlign?: ("good" | "evil" | "either")[];
  /** 건달 세계: 낮 n의 진영 (밤 n이 끝난 뒤로 확정 — 취함은 황혼까지, 진영은 그대로 이어진다) */
  goonAlignDay?: ("good" | "evil")[];
  /**
   * 건달 세계: 밤 n에 '기록 없는 선한 선택자'가 건달을 골랐다 — 누구인지는 모르지만
   * 한 명은 확실히 취했다. 수학자가 그 밤 한 명을 더 셀 수 있어야 한다.
   */
  goonUnknownDrunk?: boolean[];
  /** 비고르모르티스 세계: 좌석 → 그 밤부터 죽었지만 능력을 유지한다 (비고르모르티스의 킬) */
  vigorKeptSince?: Map<Seat, number>;
  /**
   * 비고르모르티스 세계: 밤 n에 죽은 하수인의 이웃 독을 받고 '있었을 수 있는' 좌석들
   * (관대 집합 — nodashiiPoisoned와 같은 규약: 정보 무제약, require 만족, forbid 불파괴).
   */
  vigorPoisoned?: Set<Seat>[];
}

/**
 * 이발사 교환 케이스 (solve가 배정별로 열거 — 스위트하트 선례).
 * since = 교환된 토큰이 관측되는 첫 밤 (밤 사망 → 그 밤, 처형 → 다음 밤).
 * a·b는 선한 좌석이고 둘의 **셋업 역할이 서로의 최종 주장 역할**이다 (교차 구성).
 */
export interface RoleSwapCase {
  since: number;
  a: Seat;
  b: Seat;
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
  /** 푸카 전용: 밤별 '푸카 독을 받았을 수 있는' 좌석 (관대 집합 — pukkaPoisoned로 방출) */
  pukkaMaybe: Map<number, Set<Seat>>;
  /** 할머니의 실제 손주. null = 미확정 (밤1 정보가 취함/중독이었거나 주장이 없음) */
  grandchild: Seat | null;
  /** 팡 구 전용: 점프(첫 외부인 킬 → 외부인이 팡 구가 됨)를 이미 썼는가 (게임당 1회) */
  fangGuJumpUsed: boolean;
  /** 팡 구 전용: 이번 밤 변형이 고른 점프 대상 (승계 단계가 소비하고 비운다) */
  fangGuJumpTarget: Seat | null;
  /** 비고르모르티스 전용: 좌석 → 죽었지만 능력을 유지하기 시작한 밤 */
  vigorKept: Map<Seat, number>;
  /** 비고르모르티스 전용: 좌석 → 이웃 독을 받고 있었을 수 있는 시작 밤 (관대 집합) */
  vigorPoisonMaybe: Map<Seat, number>;
  /** 사냥꾼(실제)이 능력을 소진했는가 — 공개 총격 1회 (명중·불발 무관) */
  slayerUsed: boolean;
  /** 처녀(실제)가 첫 지명을 받아 능력이 소진됐는가 (중독 상태였어도 소진) */
  virginSpent: boolean;
  /**
   * 이동식 취함 원천(선원·여관주인·대신)의 **확정** 취함: 밤 n → 그 밤(과 다음 낮) 취한 좌석들.
   * 이 분기(St) 안에서는 확실하다 — require_를 만족시키고 forbid_를 깨뜨린다.
   */
  drunkNights: Map<number, Set<Seat>>;
  /** 건달의 현재 진영 (셋업은 선). 밤마다 '자기를 고른 첫 사람'의 진영이 된다 */
  goonEvil: boolean;
  /** 밤 → (그 밤 진입 시 진영, 분기 적용 후 진영) — goonAlign 방출용 */
  goonAlign: Map<number, { before: boolean; after: boolean }>;
  /**
   * '기록 없는 선한 선택자'가 건달을 고른 밤. 누가 취했는지 모르지만 한 명은 확실히
   * 취했으므로, 수학자가 그 밤 한 명을 더 셀 수 있어야 한다 (관대한 방향).
   */
  goonUnknownDrunk: Set<number>;
  /**
   * 이 밤의 첫 선택자 순위 (D2 표). null = 아무도 건달을 고르지 않았다.
   * rank −1 = 건달이 비정상이라 능력이 발동하지 않았다 (누가 골랐든 아무 일도 없다).
   * 건달을 죽이려는 킬은 자기보다 앞선 선택자가 있어야 성립한다 (킬 대상 선택이 곧 '고르기').
   */
  goonFirst: { rank: number } | null;
}

/**
 * 밤 순서 순위 (25차 D2). 정확한 순서를 전부 싣지 않고 "누가 건달을 먼저 골랐을 수 있는가"를
 * 가르는 데 필요한 만큼만 둔다 — 같은 순위끼리는 ∃(어느 쪽이든 먼저일 수 있다).
 */
const GOON_RANK: Partial<Record<RoleId, number>> = {
  poisoner: 0,
  snakecharmer: 1, monk: 2, devilsadvocate: 3, witch: 4, cerenovus: 5, pithag: 6,
  sailor: 7, innkeeper: 8, gambler: 9, exorcist: 10,
  imp: 20, po: 20, shabaloth: 20, zombuul: 20, pukka: 20,
  fanggu: 20, vigormortis: 20, nodashii: 20, vortox: 20,
  assassin: 21, godfather: 22,
  ravenkeeper: 25, professor: 26,
  fortuneteller: 30, dreamer: 31, seamstress: 32, chambermaid: 33, butler: 34,
};

/** 밤에 플레이어를 고르는 선한 역할 — 기록이 없으면 '누군가 골랐을 수 있다'(goodUnknown)의 근거 */
const GOON_CHOOSER_ROLES: readonly RoleId[] = [
  "monk", "exorcist", "sailor", "innkeeper", "gambler", "snakecharmer", "professor",
  "ravenkeeper", "fortuneteller", "dreamer", "seamstress", "chambermaid", "butler",
];

/** 건달을 골랐을 수 있는 기록의 대상 좌석들 (D3 목록). 선택 기록이 아니면 null */
function goonChoiceTargets(data: InfoData): Seat[] | null {
  switch (data.type) {
    case "monk":
    case "exorcist":
    case "sailor":
    case "gambler":
    case "snakecharmer":
    case "professor":
    case "ravenkeeper":
    case "dreamer":
      return [data.target];
    case "innkeeper":
    case "fortuneteller":
    case "seamstress":
    case "chambermaid":
      return [...data.targets];
    default:
      return null;
  }
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
    pukkaMaybe: new Map([...s.pukkaMaybe].map(([k, v]) => [k, new Set(v)])),
    grandchild: s.grandchild,
    fangGuJumpUsed: s.fangGuJumpUsed,
    fangGuJumpTarget: s.fangGuJumpTarget,
    vigorKept: new Map(s.vigorKept),
    vigorPoisonMaybe: new Map(s.vigorPoisonMaybe),
    slayerUsed: s.slayerUsed,
    virginSpent: s.virginSpent,
    drunkNights: new Map([...s.drunkNights].map(([k, v]) => [k, new Set(v)])),
    goonEvil: s.goonEvil,
    goonAlign: new Map(s.goonAlign),
    goonUnknownDrunk: new Set(s.goonUnknownDrunk),
    goonFirst: s.goonFirst,
  };
}

function markDrunk(st: St, night: number, seat: Seat) {
  if (!st.drunkNights.has(night)) st.drunkNights.set(night, new Set());
  st.drunkNights.get(night)!.add(seat);
}

function pukkaMark(st: St, night: number, seat: Seat) {
  if (!st.pukkaMaybe.has(night)) st.pukkaMaybe.set(night, new Set());
  st.pukkaMaybe.get(night)!.add(seat);
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
export function demonScenarios(
  pz: SolverPuzzle,
  sched: Schedule,
  assignment: RoleId[],
  sweet?: SweetheartCase | null,
  swap?: RoleSwapCase | null,
  /** 뱀 조련사 교환 밤 — 있으면 swap이 (조련사, 원 데몬) 토큰 교환이고, 그 밤 데몬이 조련사 좌석으로 옮겨간다 */
  snakeSwapNight?: number | null,
  /** 마귀할멈 변신 (24차) — 주장의 roleChange에서 solve가 결정적으로 만든다 */
  roleChanges?: { seat: Seat; since: number; role: RoleId }[] | null,
  /** 숨은 건달 세계 (25차) — 마을 사람을 사칭한 건달이라 마지막에 악해야 성립한다 */
  goonHidden?: boolean,
): DemonScenario[] {
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
  const virginSeat = assignment.indexOf("virgin");
  const slayerSeat = assignment.indexOf("slayer");
  const sailorSeat = assignment.indexOf("sailor");
  const innSeat = assignment.indexOf("innkeeper");
  const courtierSeat = assignment.indexOf("courtier");
  // 대신의 1회 행동 기록 (밤, 역할) — 주장에서 찾는다 (진실 주장 규약)
  const courtierRec = (() => {
    if (courtierSeat < 0) return null;
    const rec = claimBySeat[courtierSeat]?.info.find((i) => i.data?.type === "courtier");
    return rec?.data?.type === "courtier" ? { night: rec.night, role: rec.data.role } : null;
  })();
  const profSeat = assignment.indexOf("professor");
  // 교수의 1회 행동 기록 (밤, 죽은 좌석) — 주장에서 찾는다
  const profRec = (() => {
    if (profSeat < 0) return null;
    const rec = claimBySeat[profSeat]?.info.find((i) => i.data?.type === "professor");
    return rec?.data?.type === "professor" ? { night: rec.night, target: rec.data.target } : null;
  })();
  const philoSeat = assignment.indexOf("philosopher");
  // 철학자의 1회 행동 기록 (밤, 획득 역할) — 주장에서 찾는다
  const philoRec = (() => {
    if (philoSeat < 0) return null;
    const rec = claimBySeat[philoSeat]?.info.find((i) => i.data?.type === "philosopher");
    return rec?.data?.type === "philosopher" ? { night: rec.night, role: rec.data.role } : null;
  })();
  const mcSeat = assignment.indexOf("moonchild");
  const gossipSeat = assignment.indexOf("gossip");
  const mmSeat = assignment.indexOf("mastermind");
  const pithagSeat = assignment.indexOf("pithag");
  const goonSeat = assignment.indexOf("goon");
  const minstrelSeat = assignment.indexOf("minstrel");
  const tealadySeat = assignment.indexOf("tealady");
  const foolSeat = assignment.indexOf("fool");

  /** 좌석의 주장에서 특정 밤의 행동 기록 데이터 */
  function actionData(seat: Seat, type: "monk" | "exorcist" | "gambler" | "sailor" | "innkeeper" | "snakecharmer", night: number) {
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

  /**
   * 비고르모르티스가 죽인 하수인의 이웃 독 후보: 하수인 좌석에서 양방향으로 죽은 좌석과
   * 마을 사람 아닌 좌석을 건너뛰며 첫 마을 사람까지 (도중의 첩자는 흡수 가능 ∃).
   * 죽는 밤의 두 생존 상태(시작/킬 이후) 합집합 — ndPoisonedAt과 같은 관대한 방향.
   */
  function vigorNeighborsAt(minionSeat: Seat, night: number): Set<Seat> {
    const out = new Set<Seat>();
    const n = assignment.length;
    for (const alive of [sched.aliveAtNightStart(night), sched.aliveAfterNight(night)]) {
      for (const dir of [1, -1]) {
        for (let step = 1; step < n; step++) {
          const s = (minionSeat + dir * step + n) % n;
          if (s === minionSeat) break;
          if (!alive[s]) continue;
          if (ROLES[assignment[s]].team === "townsfolk") { out.add(s); break; }
          if (assignment[s] === "spy") out.add(s);
        }
      }
    }
    return out;
  }

  /** 죽었지만 능력을 유지하는가 (비고르모르티스에게 죽은 하수인) */
  function vigorKeeps(st: St, seat: Seat): boolean {
    return demonRole === "vigormortis" && st.vigorKept.has(seat);
  }

  /** 밤 night에 seat의 능력 비정상 동작을 강제 (스위트하트 취함, 노 다시 독, 또는 독살). 모순이면 false */
  function require_(st: St, night: number, seat: Seat): boolean {
    if (sweetTarget === seat && sweetSince <= night) return true; // 이미 취해 있다 — 독살 불요
    if (st.drunkNights.get(night)?.has(seat)) return true; // 이동식 취함 원천에 이미 취해 있다
    if (demonRole === "nodashii" && ndPoisonedAt(st.demonNights[night] ?? st.demon, night).has(seat)) return true;
    // 푸카도 플레이어를 고르므로 건달을 고르면 스스로 취한다 — 건달은 푸카 독을 받지 않는다
    if (demonRole === "pukka" && seat !== goonSeat && st.pukkaMaybe.get(night)?.has(seat)) return true;
    if (demonRole === "vigormortis" && (st.vigorPoisonMaybe.get(seat) ?? Infinity) <= night) return true;
    if (!hasPoisoner) return false;
    if (sweetTarget === poisonerSeat && sweetSince <= night) return false; // 취한 독살범의 독은 듣지 않는다
    if (st.drunkNights.get(night)?.has(poisonerSeat)) return false; // 이동식 취함·건달로 취한 독살범도 마찬가지
    if (st.minstrelNights.includes(night)) return false; // 그 밤엔 독살범도 취해 있다
    const ex = st.required.get(night);
    if (ex !== undefined && ex !== seat) return false;
    if (st.forbidden.get(night)?.has(seat)) return false;
    st.required.set(night, seat);
    return true;
  }

  /**
   * 푸카 세계의 밤별 '독을 받았을 수 있는' 좌석 (finish 시점). 진행 중 표시한 집합에
   * 마지막 밤의 새 선택을 더한다 — 그 결과(다음 밤 사망)가 아직 미래라 생존자 누구든
   * 선택이었을 수 있다. 봉쇄 밤은 선택 자체가 없고 음유시인 밤은 선택이 무효라 제외.
   */
  function pukkaSets(st: St): Set<Seat>[] {
    const out = Array.from({ length: pz.nights + 1 }, (_, n) => new Set(st.pukkaMaybe.get(n) ?? []));
    const last = pz.nights;
    const demonAtLast = st.demonNights[last] ?? st.demon;
    if (sched.aliveAtNightStart(last)[demonAtLast]
        && !st.exorcistBlocked.includes(last) && !st.minstrelNights.includes(last)) {
      sched.aliveAtNightStart(last).forEach((a, x) => {
        if (a && x !== demonAtLast) out[last].add(x);
      });
    }
    return out;
  }

  /** 밤 night에 seat의 능력 정상 동작을 강제 (취하지도 독살되지도 않음). 모순이면 false */
  function forbid_(st: St, night: number, seat: Seat): boolean {
    if (sweetTarget === seat && sweetSince <= night) return false; // 취해 있어 정상 동작 불가
    if (st.drunkNights.get(night)?.has(seat)) return false; // 이동식 취함 원천에 취해 있다
    if (st.required.get(night) === seat) return false;
    if (!st.forbidden.has(night)) st.forbidden.set(night, new Set());
    st.forbidden.get(night)!.add(seat);
    return true;
  }

  function tokenAt(became: Map<Seat, number>, seat: Seat, time: number): RoleId {
    if (swap != null && time >= swap.since) {
      if (seat === swap.a) return assignment[swap.b];
      if (seat === swap.b) return assignment[swap.a];
    }
    if (roleChanges != null) {
      for (const rc of roleChanges) if (rc.seat === seat && time >= rc.since) return rc.role;
    }
    const since = became.get(seat);
    if (since !== undefined && since <= time) return demonRole;
    return assignment[seat];
  }

  /**
   * 찻집 여인의 보호가 **확실히** 작동하는 좌석인가 (양옆 생존 이웃이 반드시 선으로 등록).
   * 확실할 때만 죽음이 모순이 된다 — 은둔자·첩자 이웃은 악 등록이 가능해 보호가 새어도 되고,
   * 데몬이 된 좌석(팡 구 점프)은 더 이상 선이 아니다.
   */
  function tlForced(alive: boolean[], dead: Seat, became: Map<Seat, number>, goonEvil: boolean): boolean {
    if (tealadySeat < 0 || !alive[tealadySeat] || dead === tealadySeat) return false;
    const nb = neighborsOf(alive, tealadySeat);
    if (!nb || !nb.includes(dead)) return false;
    // 지금 악한 건달 이웃은 보호를 확실하게 만들지 못한다 (진영이 밤별 상태다)
    return nb.every((x) => isGoodTeam(assignment[x]) && assignment[x] !== "recluse" && !became.has(x)
      && !(assignment[x] === "goon" && goonEvil));
  }

  function finish(st: St) {
    // 숨은 건달(마을 사람 사칭)은 지금 악할 때만 성립한다 — 선한 건달이라면 정직하게 밝혔다
    if (goonHidden === true && !st.goonEvil) return;
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
      pukkaPoisoned: demonRole === "pukka" ? pukkaSets(st) : undefined,
      extraDrunk: st.drunkNights.size > 0
        ? Array.from({ length: pz.nights + 1 }, (_, n) => new Set(st.drunkNights.get(n) ?? []))
        : undefined,
      roleSwap: swap ?? undefined,
      roleChanges: roleChanges ?? undefined,
      goonAlign: goonSeat < 0 ? undefined : Array.from({ length: pz.nights + 1 }, (_, n) => {
        const a = st.goonAlign.get(n);
        if (a === undefined) return "good";
        return a.before === a.after ? (a.after ? "evil" : "good") : "either";
      }),
      goonAlignDay: goonSeat < 0 ? undefined : Array.from({ length: pz.nights + 1 }, (_, n) =>
        st.goonAlign.get(n)?.after ? "evil" : "good"),
      goonUnknownDrunk: goonSeat < 0 ? undefined
        : Array.from({ length: pz.nights + 1 }, (_, n) => st.goonUnknownDrunk.has(n)),
      vigorKeptSince: demonRole === "vigormortis" ? new Map(st.vigorKept) : undefined,
      vigorPoisoned: demonRole === "vigormortis"
        ? Array.from({ length: pz.nights + 1 }, (_, n) => {
            const set = new Set<Seat>();
            for (const [seat, since] of st.vigorPoisonMaybe) if (since <= n) set.add(seat);
            return set;
          })
        : undefined,
    });
  }

  function doDay(st: St, day: number) {
    // 낮 공개 행동(총격·지명·처녀 발동)의 제약을 먼저 반영한다 — 분기가 생길 수 있다
    for (const s of applyDayActions(st, day)) doDayRest(s, day);
  }

  /**
   * 낮 day의 공개 행동을 일어난 순서대로 적용한 St 분기들. 빈 배열 = 이 세계는 모순.
   * 총격 명중이 실제 데몬을 잡으면 좀부울 가짜 죽음/탕녀 승계로 분기한다
   * (마스터마인드는 '처형'만 연장하므로 총격 사망에는 발동하지 않는다).
   */
  function applyDayActions(st: St, day: number): St[] {
    const actions = sched.dayActions(day);
    if (actions.length === 0) return [st];
    const aliveAtDay = sched.aliveAfterNight(day);
    let branches: St[] = [cloneSt(st)];
    for (const act of actions) {
      const next: St[] = [];
      for (const s of branches) {
        if (act.type === "slayerShot") {
          const shooterIsSlayer = slayerSeat >= 0 && act.seat === slayerSeat;
          if (act.died) {
            // 명중: 실제 사냥꾼의 첫 총격 + 멀쩡함 + 대상이 데몬으로 등록
            if (!shooterIsSlayer || s.slayerUsed) continue;
            const tok = tokenAt(s.became, act.target, day);
            if (ROLES[tok].team !== "demon" && tok !== "recluse") continue;
            if (!forbid_(s, day, slayerSeat)) continue;
            s.slayerUsed = true;
            if (act.target === s.demon) {
              // 실제 데몬이 낮에 총으로 죽었다 — 좀부울 가짜 죽음 / 탕녀 승계만 게임을 지속시킨다
              if (demonRole === "zombuul" && s.zombuulFakeDeadAt === null) {
                const c = cloneSt(s);
                if (forbid_(c, day, act.target)) {
                  c.zombuulFakeDeadAt = day + 0.5;
                  next.push(c);
                }
              }
              if (swSeat >= 0 && swSeat !== act.target && aliveAtDay[swSeat]
                && !s.became.has(swSeat) && countTrue(aliveAtDay) >= 5) {
                const c = cloneSt(s);
                const real = demonRole !== "zombuul" || require_(c, day, act.target);
                if (real && forbid_(c, day, swSeat)) {
                  c.demon = swSeat;
                  c.became.set(swSeat, day + 0.5);
                  c.poChoseNone = false;
                  next.push(c);
                }
              }
            } else {
              next.push(s); // 은둔자가 데몬으로 등록돼 죽었다 (∃)
            }
          } else {
            // 불발: 실제 사냥꾼이었다면 공개 사용으로 능력이 소진된다
            if (shooterIsSlayer && !s.slayerUsed) {
              s.slayerUsed = true;
              const tok = tokenAt(s.became, act.target, day);
              // 멀쩡한 사냥꾼이 반드시 데몬으로 등록되는 대상을 쐈다면 죽었어야 한다 → 사냥꾼 중독 강제
              if (ROLES[tok].team === "demon" && !require_(s, day, slayerSeat)) continue;
            }
            next.push(s); // 허세 총격(비사냥꾼)·소진 후 재총격은 자유
          }
        } else if (act.type === "nomination") {
          if (virginSeat >= 0 && act.nominee === virginSeat && !s.virginSpent) {
            s.virginSpent = true; // 첫 지명 — 발동 여부와 무관하게 소진 (중독 상태였어도)
            const ntok = tokenAt(s.became, act.nominator, day);
            // 반드시 마을 사람으로 등록되는 지명자였다면 발동했어야 한다 → 처녀의 중독 강제
            // (첩자 지명자는 하수인으로 등록됐을 수 있다 ∃ — 자유)
            if (ROLES[ntok].team === "townsfolk" && !require_(s, day, virginSeat)) continue;
          }
          next.push(s);
        } else {
          // virginTrigger: 지명 대상이 멀쩡한 실제 처녀(첫 지명), 지명자가 마을 사람으로 등록
          if (virginSeat < 0 || act.nominee !== virginSeat) continue;
          if (s.virginSpent) continue;
          s.virginSpent = true;
          if (!forbid_(s, day, virginSeat)) continue;
          const ntok = tokenAt(s.became, act.nominator, day);
          if (ROLES[ntok].team !== "townsfolk" && ntok !== "spy") continue;
          // 지명자의 즉시 처형은 Schedule이 그날의 처형으로 반영한다 —
          // 성자·어릿광대·대부/음유시인 트리거는 일반 처형 경로(doDayRest)가 처리한다
          next.push(s);
        }
      }
      branches = next;
    }
    return branches;
  }

  function doDayRest(st: St, day: number) {
    if (day === pz.nights) {
      finish(st); // 현재 시점: k일차 낮, 처형 전
      return;
    }
    // 총격 사망(처형 아님)한 은둔자는 외부인 사망으로 대부를 발동시킬 수 있다 (∃)
    const slain = sched.slainOnDay(day);
    const slainMay = slain.some((x) => tokenAt(st.became, x, day) === "recluse");
    const executed = sched.executedOnDay(day);
    if (executed === null) {
      doNight(st, day + 1, slainMay ? "may" : "none", false);
      return;
    }
    const aliveAtDay = sched.aliveAfterNight(day);
    const aliveBefore = countTrue(aliveAtDay) - slain.length;
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
      const mmOk = mmSeat >= 0 && mmSeat !== executed && (aliveAtDay[mmSeat] || vigorKeeps(st, mmSeat))
        && !st.became.has(mmSeat) && day === pz.nights - 1 && demonRole !== "vortox";
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
    // 멀쩡한 성자 처형 = 게임 종료 → 처형된 성자는 그 밤 독살됐어야 한다 (데몬이 됐다면 성자가 아니다)
    if (assignment[executed] === "saint" && !s.became.has(executed) && !require_(s, day, executed)) continue;
    // 멀쩡한 선원은 처형으로도 죽지 않는다 → 취했거나 중독됐어야 한다 (그 밤의 취함이 낮까지 지속)
    if (executed === sailorSeat && !require_(s, day, executed)) continue;
    // 보호가 확실한 찻집 여인의 이웃은 처형으로도 죽지 않는다 → 찻집 여인의 중독 강제
    if (tlForced(aliveAtDay, executed, s.became, s.goonEvil) && !require_(s, day, tealadySeat)) continue;
    // 회피를 쓰지 않은 어릿광대는 처형으로 죽지 않는다 → 그 밤의 중독 강제
    if (executed === foolSeat && !s.foolDodgeUsed && !require_(s, day, foolSeat)) continue;
    // 가짜 죽음 좀부울은 등록상 죽었지만 실제로 살아 있다 — 종료 판정에서 생존자로 센다
    if (aliveBefore - 1 + (s.zombuulFakeDeadAt !== null ? 1 : 0) <= 2) continue;

    // 트리거 계산: 처형으로 죽은 좌석의 토큰 등록 (+ 총격으로 죽은 은둔자 ∃)
    const token = tokenAt(s.became, executed, day);
    let gfTrigger: Trigger = "none";
    if (token === "recluse" || token === "spy") gfTrigger = "may"; // 오등록 선택은 텔러 몫 (∃)
    else if (ROLES[token].team === "outsider") gfTrigger = "must";
    if (gfTrigger === "none" && slainMay) gfTrigger = "may";

    let minstrelMode: Trigger = "none";
    if (minstrelSeat >= 0 && executed !== minstrelSeat && aliveAtDay[minstrelSeat]) {
      // 마귀할멈은 자기를 마을 사람으로 바꿨을 수 있다 — 하수인 처형이 아닐 수 있다 (∃)
      if (token === "recluse" || token === "spy" || token === "pithag") minstrelMode = "may";
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

  const charmerSeat = assignment.indexOf("snakecharmer");

  /** demonless: 마스터마인드 연장 밤 — 데몬이 죽어 있어 데몬 킬도, 킬 부재 설명도 없다 */
  function doNight(st: St, night: number, trigger: Trigger, minstrelActive: boolean, demonless = false) {
    // 뱀 조련사 교환 (밤 순서상 맨 처음): 멀쩡한 조련사의 기록된 지목이 당시 데몬이어야 한다.
    // 성립하면 조련사가 그 밤부터 데몬이 되고 (승계), 옛 데몬은 선한 뱀 조련사가 된다
    // (토큰은 sc.roleSwap이 바꾼다 — 영구 중독이라 능력은 없다).
    if (snakeSwapNight != null && night === snakeSwapNight) {
      if (st.became.has(charmerSeat)) return;
      const rec = actionData(charmerSeat, "snakecharmer", night);
      if (rec?.type !== "snakecharmer" || rec.target !== st.demon) return; // 지목 기록 ≠ 당시 데몬 — 모순
      if (!sched.aliveAtNightStart(night)[charmerSeat]) return;
      if (!forbid_(st, night, charmerSeat)) return; // 멀쩡했어야 교환이 일어난다
      st.demon = charmerSeat;
      st.became.set(charmerSeat, night);
      st.poChoseNone = false;
    } else if (charmerSeat >= 0 && !st.became.has(charmerSeat)
      && sched.aliveAtNightStart(night)[charmerSeat]
      && (snakeSwapNight == null || night < snakeSwapNight)) {
      // 교환이 일어나지 않은 밤: 기록된 지목이 당시 데몬이었다면 조련사가 비정상이었어야 한다
      const rec = actionData(charmerSeat, "snakecharmer", night);
      if (rec?.type === "snakecharmer" && rec.target === st.demon && !require_(st, night, charmerSeat)) return;
    }
    // 마귀할멈 변신 (24차): 이 밤에 일어났다고 주장된 변신이 실제로 가능했는가.
    // 변신은 결정적이라 분기가 없다 — 불가능하면 이 세계가 모순이다.
    if (roleChanges != null && pithagSeat >= 0) {
      const tonight = roleChanges.filter((rc) => rc.since === night);
      if (tonight.length > 1) return; // 밤당 한 명만 바꾼다
      const rc = tonight[0];
      if (rc !== undefined) {
        if (st.became.has(pithagSeat)) return; // 데몬으로 승계했다면 변신 능력이 없다
        if (!sched.aliveAtNightStart(night)[pithagSeat] && !vigorKeeps(st, pithagSeat)) return;
        if (!forbid_(st, night, pithagSeat)) return; // 멀쩡했어야 변신이 일어난다
        // 새 역할이 그 시점(변신 적용 전)에 판에 없었어야 한다
        for (let x = 0; x < assignment.length; x++) {
          if (x !== rc.seat && tokenAt(st.became, x, night - 0.5) === rc.role) return;
        }
      }
    }
    st.demonNights[night] = st.demon;
    // 건달의 '첫 선택자'를 먼저 열거한다 — 그 취함이 선원·여관주인의 멀쩡함을 깨야 하므로
    // 이동식 취함 분기보다 앞선다
    for (const g of goonBranches(st, night, trigger, minstrelActive)) {
      // 이동식 취함 원천(선원·여관주인·대신)의 선택을 분기로 열거한 뒤 밤을 진행한다
      for (const s of drunkSourceBranches(g, night, minstrelActive)) {
        doNightRest(s, night, trigger, minstrelActive, demonless);
      }
    }
  }

  /**
   * 밤 night의 '건달을 고른 첫 사람(F)' 분기 (25차 D1). 각 분기에서 F는 그 밤 확정 취함이고
   * 건달은 F의 진영이 된다. 죽은 건달·전원 취함 밤에는 능력이 없어 진영이 그대로 유지된다.
   * 완전성이 곧 건전성이다 — 건달을 골랐을 수 있는 좌석이 전부 후보에 있어야 한다.
   */
  function goonBranches(st: St, night: number, trigger: Trigger, minstrelActive: boolean): St[] {
    if (goonSeat < 0) return [st];
    const aliveStart = sched.aliveAtNightStart(night);
    if (!aliveStart[goonSeat] || minstrelActive) {
      st.goonAlign.set(night, { before: st.goonEvil, after: st.goonEvil });
      st.goonFirst = null;
      return [st];
    }

    // 그 밤 건달을 고른 기록. 실제 역할이 그 기록의 능력과 맞는 좌석만 '반드시 골랐다'
    // (forcing)로 세고, 주정뱅이·사칭 좌석의 기록은 후보로만 둔다 (∃ — 관대한 방향).
    const recs: { seat: Seat; rank: number; forcing: boolean }[] = [];
    for (let s = 0; s < assignment.length; s++) {
      if (s === goonSeat || !isGoodTeam(assignment[s])) continue;
      for (const inf of claimBySeat[s]?.info ?? []) {
        if (inf.night !== night || inf.data === undefined) continue;
        const targets = goonChoiceTargets(inf.data);
        if (targets === null || !targets.includes(goonSeat)) continue;
        recs.push({
          seat: s,
          rank: GOON_RANK[inf.data.type as RoleId] ?? 0,
          forcing: aliveStart[s] && tokenAt(st.became, s, night) === inf.data.type,
        });
      }
    }
    const forcing = recs.filter((r) => r.forcing);
    const rMin = forcing.length > 0 ? Math.min(...forcing.map((r) => r.rank)) : Infinity;

    const out: St[] = [];
    /** 진영이 바뀌지 않는 분기 (아무도 안 골랐다 / 건달이 비정상이라 무효) */
    const keepAlign = (c: St, rank: number | null) => {
      c.goonFirst = rank === null ? null : { rank };
      c.goonAlign.set(night, { before: st.goonEvil, after: st.goonEvil });
      out.push(c);
    };
    /** F 분기 — F는 기록된 정직한 선택자보다 앞서 행동했어야 '첫'이 된다 */
    const push = (rank: number, drunkSeat: Seat | null, evil: boolean, unknown = false) => {
      if (rank > rMin) return;
      const c = cloneSt(st);
      if (drunkSeat !== null) markDrunk(c, night, drunkSeat);
      if (unknown) c.goonUnknownDrunk.add(night); // 누군가 취했지만 누구인지 모른다
      c.goonEvil = evil;
      c.goonFirst = { rank };
      c.goonAlign.set(night, { before: st.goonEvil, after: evil });
      out.push(c);
    };

    // 아무도 고르지 않았다 — 정직한 기록이 하나도 없을 때만
    if (forcing.length === 0) keepAlign(cloneSt(st), null);
    // 건달이 취했거나 중독됐다 — 골라도 아무 일이 없다 (rank −1: 건달을 죽이는 킬도 막지 않는다)
    {
      const c = cloneSt(st);
      if (require_(c, night, goonSeat)) keepAlign(c, -1);
    }
    // 대신은 플레이어가 아니라 **캐릭터**를 고르므로 건달을 발동시키지 않는다 —
    // 이 밤 '건달'을 골랐다면 건달은 취해 있고 능력이 작동하지 않는다 (취함 표시는
    // 뒤따르는 이동식 취함 분기가 한다)
    if (courtierRec !== null && courtierRec.night === night && courtierRec.role === "goon"
      && courtierSeat >= 0 && aliveStart[courtierSeat] && !st.became.has(courtierSeat)) {
      keepAlign(cloneSt(st), -1);
    }

    // 악역이 골랐다 — 그 자신이 취하고 건달은 악이 된다
    if (hasPoisoner && !st.became.has(poisonerSeat) && !st.required.has(night)
      && (aliveStart[poisonerSeat] || vigorKeeps(st, poisonerSeat))) {
      push(GOON_RANK.poisoner ?? 0, poisonerSeat, true);
    }
    // 푸카는 밤1부터 깨어나 중독 대상을 고른다 (킬은 밤2부터) — 다른 데몬은 밤2부터 고른다
    const demonChoosesFrom = demonRole === "pukka" ? 1 : 2;
    if (night >= demonChoosesFrom
      && (aliveStart[st.demon] || (demonRole === "zombuul" && st.zombuulFakeDeadAt !== null))) {
      push(20, st.demon, true);
    }
    const minionCandidates: { seat: Seat; rank: number; ok: boolean }[] = [
      { seat: assassinSeat, rank: 21, ok: night >= 2 && !st.assassinUsed },
      { seat: gfSeat, rank: 22, ok: night >= 2 && trigger !== "none" },
      { seat: assignment.indexOf("devilsadvocate"), rank: 3, ok: true },
      { seat: assignment.indexOf("witch"), rank: 4, ok: true },
      { seat: assignment.indexOf("cerenovus"), rank: 5, ok: true },
      { seat: pithagSeat, rank: 6, ok: night >= 2 },
    ];
    for (const m of minionCandidates) {
      if (m.seat < 0 || !m.ok || st.became.has(m.seat)) continue;
      if (!aliveStart[m.seat] && !vigorKeeps(st, m.seat)) continue;
      push(m.rank, m.seat, true);
    }

    // 기록된 선한 선택자가 골랐다 — 그 좌석이 취하고 건달은 선이 된다
    for (const r of recs) if (aliveStart[r.seat]) push(r.rank, r.seat, false);
    // 기록이 없는 선한 선택자가 골랐을 수도 있다 (대상 미상 — 취함 표시 없이 진영만 바뀐다)
    const unknownChooser = assignment.some((role, s) =>
      s !== goonSeat && aliveStart[s] && GOON_CHOOSER_ROLES.includes(role)
      && !(claimBySeat[s]?.info ?? []).some(
        (i) => i.night === night && i.data !== undefined && goonChoiceTargets(i.data) !== null));
    if (unknownChooser) push(0, null, false, true);

    return out;
  }

  /**
   * 밤 night의 이동식 취함 분기들. 각 분기의 취함은 **확정**이다 (require 만족·forbid 파괴).
   * - 선원: (자신이 취함 — 공짜) / (멀쩡 — 기록된 대상이 확정 취함). 중독된 선원(아무도 안 취함)은
   *   관측상 '자신이 취함'과 같아 별도 분기가 없다.
   * - 여관주인: 기록된 두 대상 중 하나가 취함(여관주인 멀쩡 강제 — 보호도 확실해진다) / 무효(중독 강제)
   * - 대신: 기록된 역할 토큰의 좌석이 3밤 취함(멀쩡 강제) / 무효(중독 강제)
   * 빈 배열 = 이 세계는 기록과 모순 (죽은 좌석을 골랐다 등).
   */
  function drunkSourceBranches(st: St, night: number, minstrelActive: boolean): St[] {
    if (minstrelActive) return [st]; // 전원 취함 밤 — 원천 분기가 무의미하다
    const aliveStart = sched.aliveAtNightStart(night);
    let branches: St[] = [st];

    if (sailorSeat >= 0 && aliveStart[sailorSeat]) {
      const rec = actionData(sailorSeat, "sailor", night);
      const target = rec?.type === "sailor" ? rec.target : null;
      if (target !== null && !aliveStart[target]) return []; // 죽은 좌석을 고를 수 없다
      branches = branches.flatMap((base) => {
        const out: St[] = [];
        const self = cloneSt(base);
        markDrunk(self, night, sailorSeat);
        out.push(self);
        const sober = cloneSt(base);
        if (target !== null) {
          if (forbid_(sober, night, sailorSeat)) { // 멀쩡해야 대상이 취한다
            markDrunk(sober, night, target);
            out.push(sober);
          }
        } else {
          out.push(sober); // 기록 없는 밤 — 대상 미상, 취함 표시 없이 진행 (관대한 방향)
        }
        return out;
      });
    }

    if (innSeat >= 0 && night >= 2 && aliveStart[innSeat]) {
      const rec = actionData(innSeat, "innkeeper", night);
      if (rec?.type === "innkeeper") {
        const [a, b] = rec.targets;
        if (!aliveStart[a] || !aliveStart[b]) return []; // 죽은 좌석을 고를 수 없다
        branches = branches.flatMap((base) => {
          const out: St[] = [];
          for (const t of a === b ? [a] : [a, b]) {
            const c = cloneSt(base);
            if (forbid_(c, night, innSeat)) { // 멀쩡해야 취함(과 보호)이 성립한다
              markDrunk(c, night, t);
              out.push(c);
            }
          }
          const voided = cloneSt(base);
          if (require_(voided, night, innSeat)) out.push(voided); // 무효 — 보호도 취함도 없다
          return out;
        });
      }
      // 기록 없는 밤: 대상 미상 — 취함·보호 표시 없이 진행 (관대한 방향)
    }

    // 철학자의 능력 획득 (사용 밤): (효과 — 원주인이 있으면 그 밤부터 영구 취함) /
    // (무효 — 사용 밤 중독: 능력을 얻지 못했고, 이후 철학자의 정보는 전부 가짜다)
    if (philoRec !== null && philoRec.night === night
      && aliveStart[philoSeat] && !st.became.has(philoSeat)) {
      const chosen = philoRec.role;
      branches = branches.flatMap((base) => {
        const out: St[] = [];
        const eff = cloneSt(base);
        if (forbid_(eff, night, philoSeat)) {
          let holder = -1;
          for (let x = 0; x < assignment.length; x++) {
            if (x !== philoSeat && tokenAt(base.became, x, night) === chosen) { holder = x; break; }
          }
          if (holder >= 0) {
            for (let k = night; k <= pz.nights; k++) markDrunk(eff, k, holder); // 원주인 영구 취함
          }
          out.push(eff);
        }
        const voided = cloneSt(base);
        if (require_(voided, night, philoSeat)) {
          // 능력을 얻지 못했다 — 이후 철학자의 '획득 능력' 정보는 전부 무제약 (가짜)
          for (let k = night; k <= pz.nights; k++) markDrunk(voided, k, philoSeat);
          out.push(voided);
        }
        return out;
      });
    }

    if (courtierRec !== null && courtierRec.night === night
      && aliveStart[courtierSeat] && !st.became.has(courtierSeat)) {
      const chosen = courtierRec.role;
      branches = branches.flatMap((base) => {
        const out: St[] = [];
        const eff = cloneSt(base);
        if (forbid_(eff, night, courtierSeat)) {
          // 그 역할 토큰의 좌석이 이 밤부터 3밤 3낮 취한다 (게임에 없으면 소진만)
          let targetSeat = -1;
          for (let x = 0; x < assignment.length; x++) {
            if (tokenAt(base.became, x, night) === chosen) { targetSeat = x; break; }
          }
          if (targetSeat >= 0) {
            for (let k = 0; k < 3 && night + k <= pz.nights; k++) markDrunk(eff, night + k, targetSeat);
          }
          out.push(eff);
        }
        const voided = cloneSt(base);
        if (require_(voided, night, courtierSeat)) out.push(voided); // 무효 — 아무도 안 취한다
        return out;
      });
    }

    return branches;
  }

  function doNightRest(st: St, night: number, trigger: Trigger, minstrelActive: boolean, demonless = false) {
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

    // 비고르모르티스에게 죽은 하수인은 능력을 유지한다 — 죽어서도 준비 상태
    const assassinReady = assassinSeat >= 0 && !st.assassinUsed && !st.became.has(assassinSeat)
      && (aliveStart[assassinSeat] || vigorKeeps(st, assassinSeat));
    const gfReady = gfSeat >= 0 && !st.became.has(gfSeat) && (aliveStart[gfSeat] || vigorKeeps(st, gfSeat));
    const monkAlive = monkSeat >= 0 && aliveStart[monkSeat];
    const monkData = monkAlive ? actionData(monkSeat, "monk", night) : undefined;
    const monkTarget = monkData && "target" in monkData ? monkData.target : null;
    const exoAlive = exoSeat >= 0 && aliveStart[exoSeat];
    const exoData = exoAlive ? actionData(exoSeat, "exorcist", night) : undefined;
    const exoTarget = exoData && "target" in exoData ? exoData.target : null;
    // 여관주인의 이 밤 보호 대상 (기록이 있을 때만 — 없으면 보호를 강제하지 않는다, 관대한 방향)
    const innRec = innSeat >= 0 && night >= 2 && aliveStart[innSeat] ? actionData(innSeat, "innkeeper", night) : undefined;
    const innProtected: [Seat, Seat] | null = innRec?.type === "innkeeper" ? innRec.targets : null;
    const sailorAlive = sailorSeat >= 0 && aliveStart[sailorSeat];

    // 교수의 부활 시도 (1회, 기록 밤): 부활이 일어난 게임은 이 스키마에 입력될 수 없다
    // (죽음 이벤트는 번복되지 않는다 — 샤바로스 역류 선례). 대상이 반드시 마을 사람으로
    // 등록되는 시신이면 부활이 일어났어야 하므로, 교수가 그 밤 비정상이었어야 한다.
    // (첩자 시신은 하수인으로, 주정뱅이 시신은 외부인으로 등록될 수 있어 ∃ 자유)
    if (profRec !== null && profRec.night === night && aliveStart[profSeat]) {
      const tok = tokenAt(st.became, profRec.target, night);
      if (ROLES[tok].team === "townsfolk" && !require_(st, night, profSeat)) return;
    }
    // 봉쇄 가능: 지목 기록이 악마를 가리키거나, 기록이 없어 ∃ 지목=악마
    const exoCanBlock = exoAlive && (exoTarget === demon || exoData === undefined);

    // 푸카: 밤 night의 킬/킬 부재는 밤 night-1의 중독 선택에서 온다 —
    // 군인·수도사 보호 판정은 선택 밤 기준 (수도사는 밤2부터 행동)
    const pkPrev = night - 1;
    const pkMonkAlive = demonRole === "pukka" && monkSeat >= 0 && pkPrev >= 2 && sched.aliveAtNightStart(pkPrev)[monkSeat];
    const pkMonkData = pkMonkAlive ? actionData(monkSeat, "monk", pkPrev) : undefined;
    const pkMonkTarget = pkMonkData && "target" in pkMonkData ? pkMonkData.target : null;

    // 도박사의 이 밤 추측 기록
    const gambleData = gamblerSeat >= 0 && aliveStart[gamblerSeat] ? actionData(gamblerSeat, "gambler", night) : undefined;
    const gamble = gambleData && gambleData.type === "gambler" ? gambleData : undefined;
    const gambleTokenRole = (x: Seat) => tokenAt(st.became, x, night);
    const tokenView = {
      tokenRole: gambleTokenRole,
      rolePool: pz.rolePool,
      pithagSelfOptions: pithagSelfOptionsAt(gambleTokenRole, assignment.length, pz.rolePool, night),
      goonAlign: (st.goonEvil ? "evil" : "good") as "evil" | "good",
    };
    /** 추측이 반드시 맞는가 (오답 사망 불가) / 반드시 틀리는가 (생존이 모순) */
    const gambleMustCorrect = gamble !== undefined && (() => {
      const tok = tokenAt(st.became, gamble.target, night);
      return tok === gamble.role && tok !== "spy" && tok !== "recluse";
    })();
    const gambleMustWrong = gamble !== undefined && !canShowAsRole(tokenView, gamble.target, gamble.role);

    // 찻집 여인이 이웃 보호로 킬 실패를 설명할 수 있는가 (이웃 둘 다 선 등록 가능)
    const tlCanProtect = tealadySeat >= 0 && aliveStart[tealadySeat] && (() => {
      const nb = neighborsOf(aliveStart, tealadySeat);
      return nb !== null && nb.every((x) => assignment[x] === "spy"
        || (isGoodTeam(assignment[x]) && !(assignment[x] === "goon" && st.goonEvil)));
    })();

    // 좀부울: 직전 낮에 처형 사망이 있으면 깨어나지 않는다 — 그 밤 킬 불가, 킬 부재는 공짜
    const zombuulRested = demonRole === "zombuul" && sched.executedOnDay(night - 1) !== null;
    // 데몬 킬 집합: 보통은 0~1건, Po의 3킬 밤(직전 선택이 '아무도 안 함')에는 최대 3건,
    // 샤바로스는 매밤 2명 선택(시신 포함 가능)이라 최대 2건.
    const poTriple = demonRole === "po" && st.poChoseNone;
    // 데몬이 건달을 골라 그 밤 취했다 — 킬이 실패한다 (25차 D4)
    const goonDrunkDemon = st.goonFirst?.rank === 20;
    const killSets: Seat[][] = demonless || zombuulRested || goonDrunkDemon ? [[]]
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
          if (tlForced(aliveStart, d, s.became, s.goonEvil) && !require_(s, night, tealadySeat)) return false;
          // 멀쩡한 선원은 죽지 않는다 → 취했거나(자기 선택) 중독됐어야 한다 (암살자는 관통)
          if (d === sailorSeat && !require_(s, night, sailorSeat)) return false;
          // 여관주인이 보호한 좌석의 죽음 → 여관주인이 비정상이었어야 한다 (암살자는 관통)
          if (innProtected !== null && innProtected.includes(d) && !require_(s, night, innSeat)) return false;
          // 회피 미사용 어릿광대의 죽음 → 그 밤 중독 (암살자·자기 죽음 계열은 회피 무관)
          if (killedByDemonlike && d === foolSeat && !s.foolDodgeUsed && !require_(s, night, foolSeat)) return false;
          return true;
        };
        if (assassinReady && !usedAs) {
          collect(idx + 1, true, usedGf, usedLink, usedMc, usedGossip, [...muts, (s) => {
            // 암살자가 건달을 죽이려면 그보다 앞선 선택자가 있어야 한다 (25차 D4)
            if (goonSeat >= 0 && d === goonSeat
              && !(s.goonFirst !== null && s.goonFirst.rank < 21)) return false;
            if (!forbid_(s, night, assassinSeat)) return false; // 중독된 암살자는 죽이지 못한다
            s.assassinUsed = true;
            s.assassinNight = night;
            return true;
          }], gfKilled, demonByOther || d === demon);
        }
        if (gfReady && trigger !== "none" && !usedGf) {
          collect(idx + 1, usedAs, true, usedLink, usedMc, usedGossip, [...muts, (s) => {
            if (goonSeat >= 0 && d === goonSeat
              && !(s.goonFirst !== null && s.goonFirst.rank < 22)) return false;
            if (!forbid_(s, night, gfSeat)) return false;
            s.godfatherNights.push(night);
            return sideEffects(true)(s);
          }], true, demonByOther || d === demon);
        }
        if (d === gmSeat && !usedLink) {
          for (const link of demonKills) {
            if (!(isGoodTeam(assignment[link]) || assignment[link] === "spy")) continue;
            collect(idx + 1, usedAs, usedGf, true, usedMc, usedGossip, [...muts, (s) => {
              if (s.became.has(link)) return false; // 데몬이 된 좌석(팡 구 점프)은 손주일 수 없다
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
            if (s.became.has(tinkerSeat)) return false; // 데몬이 된 땜장이(팡 구 점프)는 능력을 잃었다
            if (!forbid_(s, night, tinkerSeat)) return false; // 중독된 땜장이는 텔러가 죽일 수 없다
            return sideEffects(false)(s);
          }], gfKilled, demonByOther);
        }
        // 달의 자손의 저주: 어젯밤(또는 어제 낮 처형으로) 죽은 달의 자손이 선한 플레이어를
        // 지목했다 (∃) — 선으로 등록되는 좌석만 저주로 죽을 수 있고, 발동은 한 번뿐
        const curseTargetGood = assignment[d] === "spy"
          || (isGoodTeam(assignment[d]) && !(assignment[d] === "goon" && st.goonEvil));
        if (night === mcCurseNight && !usedMc && curseTargetGood) {
          collect(idx + 1, usedAs, usedGf, usedLink, true, usedGossip, [...muts, (s) => {
            // 데몬이 된 좌석(팡 구 점프)은 저주 능력·선 등록 어느 쪽도 성립하지 않는다
            if (s.became.has(mcSeat) || s.became.has(d)) return false;
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
            // 데몬이 건달을 죽이려면 그보다 앞서 건달을 고른 사람이 있어야 한다 —
            // 없으면 데몬 자신이 첫 선택자가 되어 취하고 킬이 실패한다
            if (goonSeat >= 0 && demonKills.includes(goonSeat)
              && !(s.goonFirst !== null && s.goonFirst.rank < 20)) return false;
            if (!forbid_(s, night, demon)) return false; // 킬이 성공했으니 데몬은 중독 아님
            // 푸카의 킬은 선택 밤에도 멀쩡했어야 성립한다 (비정상이면 선택 무효 → 킬 없음)
            if (demonRole === "pukka" && !forbid_(s, pkPrev, demon)) return false;
            // 봉쇄됐어야 하는 밤에 킬이 났다 → 구마사제가 중독됐던 것
            if (exoTarget === demon && !require_(s, night, exoSeat)) return false;
            for (const k of demonKills) {
              if (demonRole === "pukka") {
                // 군인·수도사 보호는 선택 밤 기준으로 뚫려야 한다 → 그 밤의 중독 강제
                if (k === soldierSeat && !require_(s, pkPrev, soldierSeat)) return false;
                if (pkMonkTarget !== null && pkMonkTarget === k && !require_(s, pkPrev, monkSeat)) return false;
              } else {
              // 멀쩡한 군인은 데몬에게 죽지 않는다
              if (k === soldierSeat && !require_(s, night, soldierSeat)) return false;
              // 수도사가 이 대상을 보호했다고 기록했다 → 수도사가 중독됐던 것
              if (monkTarget !== null && monkTarget === k && !require_(s, night, monkSeat)) return false;
              }
              // 멀쩡한 선원은 데몬에게도 죽지 않는다 → 취함/중독 강제
              if (k === sailorSeat && !require_(s, night, sailorSeat)) return false;
              // 여관주인이 보호한 좌석은 그 밤 죽지 않는다 → 여관주인 비정상 강제
              if (innProtected !== null && innProtected.includes(k) && !require_(s, night, innSeat)) return false;
              // 팡 구: 점프 미사용 상태에서는 외부인이 킬로 죽을 수 없다 — 첫 외부인 공격은
              // 점프가 된다 (은둔자는 하수인 오등록으로 정상 사망 가능 ∃)
              if (demonRole === "fanggu" && !s.fangGuJumpUsed) {
                const tok = tokenAt(s.became, k, night);
                if (ROLES[tok].team === "outsider" && tok !== "recluse") return false;
              }
              // 확실한 찻집 여인 보호를 뚫었다 → 찻집 여인의 중독
              if (tlForced(aliveStart, k, s.became, s.goonEvil) && !require_(s, night, tealadySeat)) return false;
              // 회피 미사용 어릿광대를 죽였다 → 어릿광대의 중독
              if (k === foolSeat && !s.foolDodgeUsed && !require_(s, night, foolSeat)) return false;
              // 손주가 데몬에게 죽었는데 할머니가 살아 있다 → 할머니가 중독됐던 것
              if (s.grandchild !== null && k === s.grandchild && gmSeat >= 0 && aliveStart[gmSeat] && !deaths.includes(gmSeat)) {
                if (!require_(s, night, gmSeat)) return false;
              }
            }
            // 푸카의 희생자는 선택 밤부터 죽는 밤까지 푸카 독을 받고 있었다 (죽기 직전 정보가 중독 정보)
            if (demonRole === "pukka") {
              for (const k of demonKills) { pukkaMark(s, pkPrev, k); pukkaMark(s, night, k); }
            }
            // 비고르모르티스가 하수인을 죽였다: 능력 유지 + 마을 사람 이웃 1명이 계속 중독
            // (어느 이웃인지는 텔러 몫 ∃ — 관대 집합. 은둔자는 하수인으로 오등록돼 죽었을 수 있어
            //  이웃 독도 '있었을 수 있음'으로만 담는다. 능력은 없으니 유지는 없다)
            if (demonRole === "vigormortis") {
              for (const k of demonKills) {
                const tok = tokenAt(s.became, k, night);
                if (ROLES[tok].team === "minion") s.vigorKept.set(k, night);
                if (ROLES[tok].team === "minion" || tok === "recluse") {
                  for (const nb of vigorNeighborsAt(k, night)) {
                    if (!s.vigorPoisonMaybe.has(nb)) s.vigorPoisonMaybe.set(nb, night);
                  }
                }
              }
            }
            s.poChoseNone = false; // Po: 대상을 골랐다 — '아무도 안 함'이 아니다
            return true;
          });
          // 팡 구 점프: 데몬 좌석의 사망은 "외부인을 골라 점프가 발동한" 것일 수 있다 —
          // 대상 외부인은 죽지 않고 비밀리에 팡 구가 된다 (게임당 1회). 첩자는 외부인
          // 오등록으로 대상이 될 수 있다 (∃). 대상별로 다른 데몬 좌석 = 다른 월드.
          if (demonRole === "fanggu" && !st.fangGuJumpUsed
            && demonKills.length === 1 && demonKills[0] === demon) {
            for (let t = 0; t < assignment.length; t++) {
              if (t === demon || !aliveStart[t] || deaths.includes(t)) continue;
              const tok = tokenAt(st.became, t, night);
              if (ROLES[tok].team !== "outsider" && tok !== "spy") continue;
              const target = t;
              impVariants.push((s) => {
                if (goonSeat >= 0 && target === goonSeat
                  && !(s.goonFirst !== null && s.goonFirst.rank < 20)) return false;
                if (!forbid_(s, night, demon)) return false; // 멀쩡해야 킬(=점프)이 성립한다
                if (exoTarget === demon && !require_(s, night, exoSeat)) return false; // 봉쇄됐어야 하는 밤
                // 수도사·찻집 여인이 대상을 보호했다면 킬 자체가 막혀 점프도 없다 → 보호자의 중독 강제
                if (monkTarget !== null && monkTarget === target && !require_(s, night, monkSeat)) return false;
                if (tlForced(aliveStart, target, s.became, s.goonEvil) && !require_(s, night, tealadySeat)) return false;
                s.fangGuJumpUsed = true;
                s.fangGuJumpTarget = target;
                return true;
              });
            }
          }
        } else {
          // 데몬 킬 부재 — 설명이 하나는 있어야 한다 (Po의 조용한 밤은 자발적 선택이라 공짜)
          if (goonDrunkDemon) {
            // 건달을 골라 취한 데몬은 죽이지 못한다 — 킬 부재의 설명이 이미 있다 (공짜)
            impVariants.push((s) => {
              s.poChoseNone = false; // 대상을 골랐다 — '아무도 안 함'이 아니다
              if (demonRole === "pukka") {
                // 실행 단계가 무산됐다 — 누가 중독됐는지 알 수 없다 (기존 누수 규약)
                sched.aliveAtNightStart(pkPrev).forEach((a, x) => {
                  if (a && x !== demon) { pukkaMark(s, pkPrev, x); pukkaMark(s, night, x); }
                });
              }
              return true;
            });
          } else if (zombuulRested) {
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
          if (demonRole === "pukka") {
            // 밤 night의 킬 부재 = 밤 night-1의 선택이 죽음으로 이어지지 않았다
            // (0) 이 데몬은 그 밤에 선택한 적이 없다 — 승계 직후·봉쇄 밤·음유시인 밤 (공짜)
            if ((st.became.get(demon) ?? 0) > pkPrev
              || st.exorcistBlocked.includes(pkPrev) || st.minstrelNights.includes(pkPrev)) {
              impVariants.push(() => true);
            }
            // (1) 선택 무효 — 선택 밤에 푸카가 비정상이라 아무도 중독되지 않았다
            impVariants.push((s) => require_(s, pkPrev, demon)); // 독살 또는 이동식 취함 — require_가 원천을 검사한다
            // (2) 선택 실패 — 멀쩡한 군인을 골랐다 / 수도사가 선택 대상을 보호했다 (선택 밤 기준)
            if (soldierSeat >= 0 && sched.aliveAtNightStart(pkPrev)[soldierSeat]) {
              impVariants.push((s) => forbid_(s, pkPrev, soldierSeat));
            }
            if (pkMonkAlive && (pkMonkTarget === null || sched.aliveAtNightStart(pkPrev)[pkMonkTarget])) {
              impVariants.push((s) => forbid_(s, pkPrev, monkSeat));
            }
            // (2') 죽음 저지 — 멀쩡한 선원/여관주인 보호가 실행 밤의 죽음을 막았다
            if (sailorAlive) impVariants.push((s) => forbid_(s, night, sailorSeat));
            if (innSeat >= 0 && night >= 2 && aliveStart[innSeat]) {
              impVariants.push((s) => forbid_(s, night, innSeat));
            }
            // (3) 그 낮 처형자가 선택이었다 — 죽기 전에 처형됐다 (공짜, 그 좌석은 중독됐던 것)
            const executee = sched.executedOnDay(pkPrev);
            if (executee !== null) {
              impVariants.push((s) => {
                if (!forbid_(s, pkPrev, demon)) return false; // 선택이 유효했어야 중독됐다
                pukkaMark(s, pkPrev, executee);
                return true;
              });
            }
            // (4) 죽음 단계 무산 — 실행 밤에 푸카가 비정상. 유효한 선택이 죽지 않고 남는다
            //     (누수: 누가 중독됐는지 알 수 없다 — 그 두 밤의 관대 집합에 생존자 전원)
            {
              impVariants.push((s) => {
                if (!require_(s, night, demon)) return false;
                if (!forbid_(s, pkPrev, demon)) return false;
                sched.aliveAtNightStart(pkPrev).forEach((a, x) => {
                  if (a && x !== demon) { pukkaMark(s, pkPrev, x); pukkaMark(s, night, x); }
                });
                return true;
              });
            }
          } else if (demonRole !== "po" || !st.poChoseNone) {
            // '선택은 했으나 실패' 계열 — Po라면 다음 밤 3킬이 열리지 않는다
            impVariants.push((s) => require_(s, night, demon)); // 독살 또는 이동식 취함 — require_가 원천을 검사한다
            if (soldierSeat >= 0 && aliveStart[soldierSeat]) {
              impVariants.push((s) => forbid_(s, night, soldierSeat)); // 데몬이 멀쩡한 군인을 노렸다
            }
            if (monkAlive && (monkTarget === null || aliveStart[monkTarget])) {
              impVariants.push((s) => forbid_(s, night, monkSeat)); // 수도사가 데몬의 대상을 보호했다
            }
            if (tlCanProtect) {
              impVariants.push((s) => forbid_(s, night, tealadySeat)); // 보호받는 이웃을 노렸다
            }
            if (sailorAlive) {
              impVariants.push((s) => forbid_(s, night, sailorSeat)); // 멀쩡한 선원을 노렸다
            }
            if (innSeat >= 0 && night >= 2 && aliveStart[innSeat]) {
              impVariants.push((s) => forbid_(s, night, innSeat)); // 여관주인이 데몬의 대상을 보호했다
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
          if (s2.fangGuJumpTarget !== null) {
            // 팡 구 점프: 대상 외부인이 새 팡 구가 된다 — 탕녀 승계는 발동하지 않는다 (데몬 생존)
            const t = s2.fangGuJumpTarget;
            const c = cloneSt(s2);
            c.fangGuJumpTarget = null;
            c.demon = t;
            c.became.set(t, night);
            nexts = [c];
          } else if (demonKills.includes(demon) && demonRole === "imp") {
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
    pukkaMaybe: new Map(),
    grandchild: null,
    fangGuJumpUsed: false,
    fangGuJumpTarget: null,
    vigorKept: new Map(),
    vigorPoisonMaybe: new Map(),
    slayerUsed: false,
    virginSpent: false,
    drunkNights: new Map(),
    goonEvil: false, // 건달은 셋업에 선이다
    goonAlign: new Map(),
    goonUnknownDrunk: new Set(),
    goonFirst: null,
  };

  // 독살범이 건달을 고르는 순간 스스로 취한다 (공식 How to Run: "becomes drunk immediately")
  // — 그래서 건달은 독살될 수 없다. 다른 취함 원천(스위트하트·대신 등)은 그대로 통한다.
  if (goonSeat >= 0) {
    for (let n = 1; n <= pz.nights; n++) st0.forbidden.set(n, new Set([goonSeat]));
  }

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

/** 밤 night 시점의 토큰 역할 (데몬 승계 + 역할 교환 반영 — 교환이 우선한다: 뱀 조련사 교환에서 옛 데몬의 became(0)이 새 토큰을 가리면 안 된다) */
export function tokenRoleAt(assignment: RoleId[], sc: DemonScenario, seat: Seat, night: number): RoleId {
  const sw = sc.roleSwap;
  if (sw !== undefined && night >= sw.since) {
    if (seat === sw.a) return assignment[sw.b];
    if (seat === sw.b) return assignment[sw.a];
  }
  if (sc.roleChanges !== undefined) {
    for (const rc of sc.roleChanges) if (rc.seat === seat && night >= rc.since) return rc.role;
  }
  const since = sc.becameDemonAt.get(seat);
  if (since !== undefined && since <= night) {
    return assignment.find((r) => ROLES[r].team === "demon") ?? "imp";
  }
  return assignment[seat];
}
