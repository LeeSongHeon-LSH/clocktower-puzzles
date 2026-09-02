// 전수 탐색 엔진.
//
// 핵심 아이디어: 선한 생존 정직 플레이어의 토큰은 주장 역할로 고정되므로,
// 자유도는 (악역 좌석·역할, 주정뱅이 좌석, 데몬 승계, 독살 대상, 레드 헤링)뿐이다.
// 독살은 "정보가 술/독 없이 설명 안 되는 (좌석, 밤) 쌍"으로 역산한다(빠른 경로).
// 수학자(정확한 독살 벡터 필요)가 있는 퍼즐만 독살 벡터를 전수 열거한다.

import { ROLES } from "@/data/roles";
import { composition } from "./composition";
import { checkContent } from "./roles";
import { checkContentFalse } from "./roles/false-info";
import { Ctx, isDrunk, isExtraDrunk, isNdPoisoned, isPukkaPoisoned, isSweetDrunk, isVigorPoisoned, wakes } from "./ctx";
import { DemonScenario, demonScenarios, RoleSwapCase, Schedule, SweetheartCase, tokenRoleAt } from "./timeline";
import type { Claim, InfoData, RoleId, Seat, SolverPuzzle, World } from "./types";
import { PHILOSOPHER_GAINABLE, SOLVER_ROLES, SWAPPABLE_ROLES, worldKey } from "./types";

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map((c) => [head, ...c]),
    ...combinations(rest, k),
  ];
}

function permutations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  const out: T[][] = [];
  arr.forEach((x, i) => {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest, k - 1)) out.push([x, ...p]);
  });
  return out;
}

/**
 * 어떤 월드에서든 좌석에 **배정될 수 있는** 역할을 모은다.
 * - 풀 안의 하수인: 하수인 자리에 순열로 들어간다
 * - 주장 역할: 선하고 정직한 좌석의 토큰이 된다
 * - 주정뱅이: 풀에 있으면 선한 좌석 하나가 될 수 있다
 * 여기에 능력이 모델링되지 않은 역할이 섞이면 탐색이 그 능력을 없는 셈 치므로
 * "유일해"라는 결론 자체가 거짓이 된다 — unmodeledRoles가 그 판정을 한다.
 */
function assignableRoles(pz: SolverPuzzle): RoleId[] {
  const out = new Set<RoleId>(pz.rolePool.filter((r) => {
    const t = ROLES[r].team;
    return t === "minion" || t === "demon"; // 데몬 자리는 풀의 데몬들로 탐색한다
  }));
  for (const c of pz.claims) {
    out.add(c.role);
    if (c.roleChange !== undefined) out.add(c.roleChange.from); // 마귀할멈 변신 전 역할은 셋업에 배정된다
  }
  if (pz.rolePool.includes("drunk")) out.add("drunk");
  if (pz.rolePool.includes("mutant")) out.add("mutant");
  if (pz.rolePool.includes("lunatic")) out.add("lunatic");
  if (pz.rolePool.includes("cerenovus")) {
    // 광기 좌석의 실제 역할은 풀의 어떤 선한 역할이든 될 수 있다
    for (const r of pz.rolePool) {
      const t = ROLES[r].team;
      if (t === "townsfolk" || t === "outsider") out.add(r);
    }
  }
  return [...out];
}

function validatePuzzle(pz: SolverPuzzle): Claim[] {
  const claimBySeat: Claim[] = [];
  if (new Set(pz.rolePool).size !== pz.rolePool.length) throw new Error("역할 풀에 중복이 있습니다");
  if (!pz.rolePool.some((r) => ROLES[r].team === "demon")) throw new Error("역할 풀에 악마가 없습니다");
  if (pz.rolePool.includes("vortox") && pz.rolePool.includes("mastermind")) {
    // 연장 밤에는 죽은 보르톡스의 거짓 강제가 풀리는데 그 조합 처리가 아직 없다 — 건전성 위해 거부
    throw new Error("보르톡스와 마스터마인드는 아직 한 퍼즐에서 함께 지원되지 않습니다");
  }
  if (pz.rolePool.includes("fanggu") && pz.rolePool.includes("sweetheart")) {
    // 점프한 스위트하트는 능력을 잃는데, 스위트하트 취함 열거가 점프와 얽히는 처리가 아직 없다 — 건전성 위해 거부
    throw new Error("팡 구와 스위트하트는 아직 한 퍼즐에서 함께 지원되지 않습니다");
  }
  const hasBarber = pz.rolePool.includes("barber");
  if (hasBarber) {
    // 주장 날조 수단이 있으면 숨은 교환(주장이 드러내지 않는 교환)이 은닉될 수 있다 — 건전성 위해 거부
    for (const bad of ["drunk", "mutant", "lunatic", "cerenovus", "fanggu"] as RoleId[]) {
      if (pz.rolePool.includes(bad)) {
        throw new Error(`이발사와 ${ROLES[bad].ko}은(는) 아직 한 퍼즐에서 함께 지원되지 않습니다`);
      }
    }
    // 하수인이 2명이면 하수인 간 교환이 주장에 드러나지 않는다 — 건전성 위해 거부
    if (pz.playerCount >= 10) throw new Error("이발사 퍼즐은 9인 이하만 지원됩니다 (하수인 간 교환 은닉)");
  }
  if (pz.rolePool.includes("snakecharmer")) {
    // barber(roleSwap 충돌)·fanggu/zombuul(승계·가짜 죽음과 교환의 교차)·탕녀(승계한 데몬과의
    // 교환은 토큰 타임라인이 아직 표현 못 함) — 건전성 위해 거부
    for (const bad of ["barber", "fanggu", "zombuul", "scarletwoman"] as RoleId[]) {
      if (pz.rolePool.includes(bad)) {
        throw new Error(`뱀 조련사와 ${ROLES[bad].ko}은(는) 아직 한 퍼즐에서 함께 지원되지 않습니다`);
      }
    }
  }
  const hasPithag = pz.rolePool.includes("pithag");
  if (hasPithag) {
    // 마귀할멈이 새 하수인·새 데몬을 만드는 세계는 아직 열거하지 않는다 —
    // 대본에서 그것이 아예 불가능하도록 강제한다 (24차 D1)
    if (pz.rolePool.filter((r) => ROLES[r].team === "minion").length !== 1) {
      throw new Error("마귀할멈 퍼즐의 대본에는 하수인이 마귀할멈 하나뿐이어야 합니다 (새 하수인 생성 미지원)");
    }
    if (pz.rolePool.filter((r) => ROLES[r].team === "demon").length !== 1) {
      throw new Error("마귀할멈 퍼즐의 대본에는 악마가 한 종류만 있어야 합니다 (새 악마 생성 미지원)");
    }
    if (pz.playerCount >= 10) {
      throw new Error("마귀할멈 퍼즐은 9인 이하만 지원됩니다 (하수인이 2명인 구성 불가)");
    }
    // 주장을 날조하는 역할은 숨은 변신을 은닉한다 (자기 배제가 깨진다).
    // 팡 구·이발사·뱀 조련사·철학자는 역할 타임라인이 변신과 얽힌다.
    for (const bad of ["drunk", "mutant", "lunatic", "goon", "fanggu", "barber", "snakecharmer", "philosopher"] as RoleId[]) {
      if (pz.rolePool.includes(bad)) {
        throw new Error(`마귀할멈과 ${ROLES[bad].ko}은(는) 아직 한 퍼즐에서 함께 지원되지 않습니다`);
      }
    }
  }
  for (const c of pz.claims) {
    if (c.seat < 0 || c.seat >= pz.playerCount) throw new Error(`잘못된 좌석: ${c.seat}`);
    if (claimBySeat[c.seat]) throw new Error(`좌석 ${c.seat}의 주장이 중복`);
    if (!pz.rolePool.includes(c.role)) throw new Error(`풀에 없는 역할 주장: ${c.role}`);
    if (c.role === "drunk" || c.role === "mutant" || c.role === "lunatic" || ROLES[c.role].team === "demon") {
      // 숨은 외부인(주정뱅이·광인·루나틱)은 자기 정체를 모르거나 감춘다 — 공개 주장하지 않는다
      throw new Error(`주장할 수 없는 역할: ${c.role}`);
    }
    if (hasBarber && ROLES[c.role].team === "minion") {
      // 하수인 역할 주장은 악역이 낀 교환을 드러내는 유일한 통로인데 그 열거가 아직 없다 — 거부
      throw new Error(`이발사 퍼즐에서 하수인 역할 주장(${c.role})은 지원되지 않습니다`);
    }
    // 마귀할멈 변신 이력 (24차 D3)
    const change = c.roleChange;
    if (change !== undefined) {
      if (!hasPithag) throw new Error(`좌석 ${c.seat}: 변신 이력은 마귀할멈이 풀에 있을 때만 쓸 수 있습니다`);
      if (change.night < 2 || change.night > pz.nights) {
        throw new Error(`좌석 ${c.seat}: 변신한 밤이 범위 밖입니다 (밤 ${change.night})`);
      }
      if (!SWAPPABLE_ROLES.includes(change.from) || !PHILOSOPHER_GAINABLE.includes(c.role) || change.from === c.role) {
        throw new Error(`좌석 ${c.seat}: 변신 이력에 쓸 수 없는 역할입니다 (${change.from} → ${c.role})`);
      }
    }
    for (const info of c.info) {
      if (info.night < 1 || info.night > pz.nights) throw new Error(`좌석 ${c.seat}: 정보 밤 범위 밖 (밤 ${info.night})`);
      if (info.asRole === undefined && change !== undefined && info.night < change.night && info.data !== undefined) {
        throw new Error(`좌석 ${c.seat}: 변신 전(밤 ${info.night}) 정보에는 당시 역할을 밝혀야 합니다`);
      }
      if (info.asRole !== undefined) {
        if (change !== undefined) {
          // 변신 전의 정보만 당시 역할로 주장할 수 있다
          if (info.night >= change.night || info.asRole !== change.from) {
            throw new Error(`좌석 ${c.seat}: 변신 전 정보만 당시 역할(${change.from})로 주장할 수 있습니다`);
          }
        } else if (c.role === "philosopher") {
          // 철학자의 획득 능력 정보 — 사용 기록의 역할·시점과 일치해야 한다
          const rec = c.info.find((i) => i.data?.type === "philosopher");
          if (rec?.data?.type !== "philosopher" || rec.data.role !== info.asRole || info.night < rec.night) {
            throw new Error(`좌석 ${c.seat}: 철학자의 획득 능력 정보는 사용 기록(밤·역할)과 일치해야 합니다`);
          }
        } else {
          if (!hasBarber) throw new Error(`좌석 ${c.seat}: 당시 역할(asRole)은 이발사가 풀에 있을 때만 쓸 수 있습니다`);
          if (!SWAPPABLE_ROLES.includes(info.asRole) || !SWAPPABLE_ROLES.includes(c.role)) {
            throw new Error(`좌석 ${c.seat}: 교환 이력에 쓸 수 없는 역할입니다 (${info.asRole} → ${c.role})`);
          }
        }
      }
      if (info.data && info.data.type !== (info.asRole ?? c.role)) {
        throw new Error(`좌석 ${c.seat}: 당시 역할(${info.asRole ?? c.role})과 정보 타입(${info.data.type}) 불일치`);
      }
    }
    if (c.info.filter((i) => i.data?.type === "artist").length > 1) {
      throw new Error(`좌석 ${c.seat}: 화가의 질문은 게임당 1회입니다`);
    }
    const philoRecs = c.info.filter((i) => i.data?.type === "philosopher");
    if (philoRecs.length > 1) throw new Error(`좌석 ${c.seat}: 철학자의 능력 획득은 게임당 1회입니다`);
    if (philoRecs[0]?.data?.type === "philosopher" && !PHILOSOPHER_GAINABLE.includes(philoRecs[0].data.role)) {
      throw new Error(`좌석 ${c.seat}: 철학자가 획득할 수 없는 역할입니다 (${philoRecs[0].data.role})`);
    }
    claimBySeat[c.seat] = c;
  }
  for (let s = 0; s < pz.playerCount; s++) {
    if (!claimBySeat[s]) throw new Error(`좌석 ${s}의 주장이 없습니다 (전원 공개 주장 형식)`);
  }
  return claimBySeat;
}

/**
 * 능력이 솔버에 없어 전수 탐색이 성립하지 않는 역할을 모은다.
 *
 * **선언이 아니라 파생값이다** — 퍼즐 내용에서 계산되므로 작성자가 끌 수 없다.
 * 모르는 능력을 없는 셈 치고 세면 "유일해"라는 결론 자체가 거짓이 되므로,
 * 여기가 비어 있지 않으면 열거를 하지 않는다 (해가 0개인 것과는 다르다).
 */
export function unmodeledRoles(pz: SolverPuzzle & { solution?: readonly RoleId[] }): RoleId[] {
  const candidates = new Set<RoleId>([...assignableRoles(pz), ...(pz.solution ?? [])]);
  return [...candidates].filter((r) => !SOLVER_ROLES.includes(r));
}

export interface Analysis {
  /** 비어 있으면 유일해 판정이 성립한다 */
  unmodeled: RoleId[];
  /** unmodeled가 비어 있을 때만 채워진다 */
  worlds: World[];
}

/**
 * 구조 검사는 **언제나** 하고, 전수 탐색은 검증이 성립할 때만 한다.
 *
 * 좌석 범위·주장 중복·풀에 없는 역할 주장·주장 불가 역할·사건 원장 범위 —
 * 이 검사들은 실험적 역할과 무관하게 전부 살아 있어야 한다. 건너뛰는 것은
 * 유일해 탐색 하나뿐이다.
 */
export function analyze(pz: SolverPuzzle & { solution?: readonly RoleId[] }): Analysis {
  const claimBySeat = validatePuzzle(pz);
  const sched = new Schedule(pz); // 사건 원장 구조 검사 (시점 범위·중복)
  const unmodeled = unmodeledRoles(pz);
  if (unmodeled.length > 0) return { unmodeled, worlds: [] };
  return { unmodeled, worlds: enumerate(pz, claimBySeat, sched) };
}

/** 유일해가 증명되어야 하는 경로용 — 검증이 성립하지 않으면 거부한다. */
export function solve(pz: SolverPuzzle): World[] {
  const { unmodeled, worlds } = analyze(pz);
  if (unmodeled.length > 0) {
    throw new Error(`솔버가 아직 모르는 역할입니다: ${unmodeled.map((r) => ROLES[r].ko).join(", ")}`);
  }
  return worlds;
}

interface GoodInfo {
  seat: Seat;
  night: number;
  data: InfoData;
}

function enumerate(pz: SolverPuzzle, claimBySeat: Claim[], sched: Schedule): World[] {
  const N = pz.playerCount;
  const seats = Array.from({ length: N }, (_, i) => i);
  const minionsInPool = pz.rolePool.filter((r) => ROLES[r].team === "minion");
  const demonsInPool = pz.rolePool.filter((r) => ROLES[r].team === "demon");
  // Vortox 세계는 처형 없는 낮이 지나는 순간 악의 승리로 끝났어야 한다 —
  // 지나간 낮(1 ~ nights-1) 전부에 처형이 있어야만 성립한다 (현재 낮은 처형 전이라 제외)
  const vortoxViable = Array.from({ length: pz.nights - 1 }, (_, i) => i + 1)
    .every((d) => sched.executedOnDay(d) !== null);
  const baseComp = composition(N, false);
  const found = new Map<string, World>();

  for (const demonSeat of seats) {
    const nonDemon = seats.filter((s) => s !== demonSeat);
    for (const minionSeats of combinations(nonDemon, baseComp.minion)) {
      for (const minionRoles of permutations(minionsInPool, minionSeats.length)) {
        for (const demonRole of demonsInPool) {
        if (demonRole === "vortox" && !vortoxViable) continue;
        // 구성 변형: 남작 +2 외부인, 대부 ±1 외부인 (텔러 선택 — 두 경우 모두 탐색),
        // 팡 구 +1 외부인, 비고르모르티스 −1 외부인 (0 미만으로는 내려가지 않는다)
        let deltas = [0];
        if (demonRole === "fanggu") deltas = deltas.map((d) => d + 1);
        if (minionRoles.includes("baron")) deltas = deltas.map((d) => d + 2);
        if (minionRoles.includes("godfather")) deltas = deltas.flatMap((d) => [d + 1, d - 1]);
        if (demonRole === "vigormortis") deltas = deltas.map((d) => Math.max(d - 1, -baseComp.outsider));
        for (const delta of new Set(deltas)) {
          const comp = { ...baseComp, outsider: baseComp.outsider + delta, townsfolk: baseComp.townsfolk - delta };
          if (comp.outsider < 0 || comp.townsfolk < 0) continue;
          const evil = new Set<Seat>([demonSeat, ...minionSeats]);
          const goodSeats = seats.filter((s) => !evil.has(s));
          // 세레노부스 광기 (18차): 마지막 밤의 광기 선택이 선한 좌석 하나의 주장 전체를
          // 날조로 만들 수 있다 — 그 좌석의 실제 역할은 풀의 어떤 선한 역할이든 될 수 있다.
          const madChoices: ({ seat: Seat; role: RoleId } | null)[] = [null];
          if (minionRoles.includes("cerenovus")) {
            const goodPoolRoles = pz.rolePool.filter((r) => {
              const t = ROLES[r].team;
              return t === "townsfolk" || t === "outsider";
            });
            for (const g of goodSeats) {
              for (const r of goodPoolRoles) {
                if (r !== claimBySeat[g].role) madChoices.push({ seat: g, role: r });
              }
            }
          }

          for (const mad of madChoices) {
          const outsiderClaims = goodSeats.filter(
            (s) => s !== mad?.seat && ROLES[claimBySeat[s].role].team === "outsider",
          );
          const madOutsider = mad !== null && ROLES[mad.role].team === "outsider" ? 1 : 0;
          const need = comp.outsider - outsiderClaims.length - madOutsider;
          if (need < 0 || need > 1) continue;
          // 숨은 외부인: 주정뱅이(자기 역할을 믿음), 광인(외부인임을 알고 사칭),
          // 루나틱(자기가 데몬인 줄 알고 허세) — 마을 사람을 주장하는 선한 좌석 하나가 실제로는 이들일 수 있다
          const hiddenRoles = (["drunk", "mutant", "lunatic"] as RoleId[]).filter((r) => pz.rolePool.includes(r));
          if (need === 1 && hiddenRoles.length === 0) continue;
          const hiddenChoices: ({ seat: Seat; role: RoleId } | null)[] = need === 1
            ? goodSeats
                .filter((s) => s !== mad?.seat && ROLES[claimBySeat[s].role].team === "townsfolk")
                .flatMap((s) => hiddenRoles.map((role) => ({ seat: s, role })))
            : [null];

          for (const hidden of hiddenChoices) {
            const assignment: RoleId[] = new Array(N);
            assignment[demonSeat] = demonRole;
            minionSeats.forEach((s, i) => { assignment[s] = minionRoles[i]; });
            for (const s of goodSeats) {
              assignment[s] = s === hidden?.seat ? hidden.role : s === mad?.seat ? mad.role : claimBySeat[s].role;
            }

            // 마귀할멈 변신 (24차 D4): 정직한 선한 좌석의 변신 이력은 **결정적**이다 —
            // 그 좌석의 셋업 역할은 변신 전 역할이고, 최종 그리모어(assignment)는 주장 역할이다.
            // 주장 전체가 날조인 좌석(숨은 외부인·광기)의 이력은 허세라 무시한다.
            const roleChanges: { seat: Seat; since: number; role: RoleId }[] = [];
            const setupAssignment = [...assignment];
            for (const s of goodSeats) {
              if (s === hidden?.seat || s === mad?.seat) continue;
              const rc = claimBySeat[s].roleChange;
              if (rc === undefined) continue;
              roleChanges.push({ seat: s, since: rc.night, role: claimBySeat[s].role });
              setupAssignment[s] = rc.from;
            }

            // 실물 토큰 중복·마을 사람 수는 **셋업** 기준이다 (변신이 다중집합을 바꾼다)
            const goodTokens = goodSeats.map((s) => setupAssignment[s]);
            if (new Set(goodTokens).size !== goodTokens.length) continue; // 실물 토큰 중복 불가
            const tfCount = goodSeats.filter((s) => ROLES[setupAssignment[s]].team === "townsfolk").length;
            if (tfCount !== comp.townsfolk) continue;

            // 역할 교환 분기: 이발사(선한 두 좌석의 교차 셋업) / 뱀 조련사(데몬 승계형 교환) / 없음
            type SwapBranch =
              | { kind: "none" }
              | { kind: "barber"; c: RoleSwapCase }
              | { kind: "snake"; t: number };
            const swapBranches: SwapBranch[] = roleSwapCases(pz, sched, assignment, goodSeats, claimBySeat)
              .map((c): SwapBranch => (c === null ? { kind: "none" } : { kind: "barber", c }));
            for (const t of snakeSwapNights(pz, sched, assignment, demonSeat, claimBySeat)) {
              swapBranches.push({ kind: "snake", t });
            }

            for (const br of swapBranches) {
              let setup = setupAssignment;
              let tokenSwap: RoleSwapCase | null = null;
              let snakeNight: number | null = null;
              let snakeOldDemon: { seat: Seat; since: number } | null = null;
              if (br.kind === "barber") {
                // 이발사 교환 세계의 셋업은 두 좌석의 주장 역할을 서로 바꾼 것이다
                setup = [...setupAssignment];
                [setup[br.c.a], setup[br.c.b]] = [setup[br.c.b], setup[br.c.a]];
                tokenSwap = br.c;
              } else if (br.kind === "snake") {
                tokenSwap = { since: br.t, a: assignment.indexOf("snakecharmer"), b: demonSeat };
                snakeNight = br.t;
                snakeOldDemon = { seat: demonSeat, since: br.t };
              }
              for (const sweet of sweetheartCases(pz, sched, setup, seats)) {
                for (const sc of demonScenarios(pz, sched, setup, sweet, tokenSwap, snakeNight, roleChanges)) {
                  const ftSeat = setup.indexOf("fortuneteller");
                  const rhChoices: (Seat | null)[] = ftSeat >= 0 ? goodSeats : [null];
                  for (const rh of rhChoices) {
                    // 월드의 assignment는 **최종(현재) 그리모어** — 교환 전 이력만 다른 세계는 같은 해다
                    const world = tryWorld(pz, sched, claimBySeat, setup, sc, sweet, rh, goodSeats, mad?.seat ?? null, assignment, snakeOldDemon);
                    if (world) found.set(worldKey(world), world);
                  }
                }
              }
            }
          }
          }
          }
        }
      }
    }
  }
  return [...found.values()];
}

/**
 * 이발사 교환 케이스 열거 (20차). 이발사가 배정에 없거나 죽지 않았으면 [null] (교환 없음).
 * 죽었다면 "교환 없음"(may)과, 교환 가능한 선한 두 좌석의 모든 쌍을 분기한다.
 * 교환된 좌석의 셋업 역할은 서로의 주장 역할이므로, 숨은 교환은 정직한 좌석의 주장과
 * 스스로 모순된다 — 주장(asRole 이력 또는 정보 없음)이 드러내는 교환만 살아남는다.
 * since: 밤 사망은 그 밤(공식 밤 순서상 킬 직후 교환 → 그 밤 정보는 새 역할), 처형은 다음 밤.
 */
function roleSwapCases(
  pz: SolverPuzzle,
  sched: Schedule,
  assignment: RoleId[],
  goodSeats: Seat[],
  claimBySeat: Claim[],
): (RoleSwapCase | null)[] {
  const out: (RoleSwapCase | null)[] = [null];
  const bSeat = assignment.indexOf("barber");
  if (bSeat < 0) return out;
  let since = -1;
  for (let n = 2; n <= pz.nights; n++) {
    if (sched.diedAtNight(n).includes(bSeat)) since = n;
  }
  for (let d = 1; d <= pz.nights - 1; d++) {
    if (sched.executedOnDay(d) === bSeat) since = d + 1;
  }
  if (since < 1 || since > pz.nights) return out;
  const alive = sched.aliveAtNightStart(since);
  for (let i = 0; i < goodSeats.length; i++) {
    for (let j = i + 1; j < goodSeats.length; j++) {
      const a = goodSeats[i];
      const b = goodSeats[j];
      if (!alive[a] || !alive[b]) continue;
      const ra = claimBySeat[a].role;
      const rb = claimBySeat[b].role;
      if (ra === rb) continue;
      if (!SWAPPABLE_ROLES.includes(ra) || !SWAPPABLE_ROLES.includes(rb)) continue;
      out.push({ since, a, b });
    }
  }
  return out;
}

/**
 * 뱀 조련사 교환 케이스 열거 (21차). 교환 세계는 **옛 데몬 좌석이 최종적으로 뱀 조련사를
 * 주장**할 때만 성립하고 (자기 배제 — 교환됐다면 이제 선한 조련사라 진실을 말한다),
 * 교환 밤 t는 조련사의 지목 기록 중 원 데몬 좌석을 겨눈 것에서 온다.
 */
function snakeSwapNights(
  pz: SolverPuzzle,
  sched: Schedule,
  assignment: RoleId[],
  demonSeat: Seat,
  claimBySeat: Claim[],
): number[] {
  const s = assignment.indexOf("snakecharmer");
  if (s < 0) return [];
  if (claimBySeat[demonSeat].role !== "snakecharmer") return [];
  const out: number[] = [];
  for (const info of claimBySeat[s].info) {
    if (info.data?.type === "snakecharmer" && info.data.target === demonSeat
      && sched.aliveAtNightStart(info.night)[s]) {
      out.push(info.night);
    }
  }
  return out;
}

/**
 * 스위트하트 케이스 열거. 스위트하트가 배정에 없거나 살아 있으면 [null] (취함 없음).
 * 죽었다면 텔러가 고른 취함 대상 전부 + "사망 순간 중독이라 미발동"(target: null)을 분기한다 —
 * 사망 시점은 이벤트로 고정돼 있어 대상 1명만 열거하면 된다 (docs/REQUIREMENTS.md 2.4).
 */
function sweetheartCases(pz: SolverPuzzle, sched: Schedule, assignment: RoleId[], seats: Seat[]): (SweetheartCase | null)[] {
  const sweetSeat = assignment.indexOf("sweetheart");
  if (sweetSeat < 0) return [null];
  let deathNight: number | null = null;
  let since = 0;
  for (let n = 2; n <= pz.nights; n++) {
    if (sched.diedAtNight(n).includes(sweetSeat)) { deathNight = n; since = n; }
  }
  for (let d = 1; d <= pz.nights - 1; d++) {
    if (sched.executedOnDay(d) === sweetSeat) { deathNight = d; since = d + 0.5; }
  }
  if (deathNight === null) return [null];
  const dn = deathNight;
  return [
    ...seats.filter((t) => t !== sweetSeat).map((t) => ({ sweetSeat, deathNight: dn, since, target: t as Seat | null })),
    { sweetSeat, deathNight: dn, since, target: null },
  ];
}

function tryWorld(
  pz: SolverPuzzle,
  sched: Schedule,
  claimBySeat: Claim[],
  assignment: RoleId[],
  sc: DemonScenario,
  sweet: SweetheartCase | null,
  redHerring: Seat | null,
  goodSeats: Seat[],
  madSeat: Seat | null = null,
  finalAssignment: RoleId[] = assignment, // 교환 세계의 최종(현재) 그리모어 — World에 실린다
  /** 뱀 조련사 교환의 옛 데몬 — since부터 선한 뱀 조련사가 되어 진실을 주장한다 (영구 중독) */
  snakeOldDemon: { seat: Seat; since: number } | null = null,
): World | null {
  const sweetDrunk = sweet !== null && sweet.target !== null ? { target: sweet.target, since: sweet.since } : null;
  const ctx: Ctx = { pz, sched, assignment, claimBySeat, sc, redHerring, poison: null, sweet: sweetDrunk };

  // 세레노부스 광기의 성립 조건: 마지막 밤에 세레노부스가 행동할 수 있어야 한다
  const cerenoSeat = madSeat !== null ? assignment.indexOf("cerenovus") : -1;
  if (madSeat !== null) {
    const n = pz.nights;
    const kept = (sc.vigorKeptSince?.get(cerenoSeat) ?? Infinity) <= n;
    if (!sched.aliveAtNightStart(n)[cerenoSeat] && !kept) return null; // 죽은 세레노부스는 광기를 강제하지 못한다
    const became = sc.becameDemonAt.get(cerenoSeat);
    if (became !== undefined && became <= n) return null; // 데몬으로 승계했다면 능력이 없다
    if (sc.minstrelNights?.has(n)) return null; // 전원 취함 밤 — 광기 무효
    if (sweetDrunk !== null && sweetDrunk.target === cerenoSeat && sweetDrunk.since <= n) return null;
    if (sc.extraDrunk?.[n]?.has(cerenoSeat)) return null; // 확정 취함 — 광기 무효
  }

  // 선한 좌석(주정뱅이 포함)의 정보 수집 + 구조 검증 (깨어날 수 없었다면 그 주장은 참일 수 없다)
  const infos: GoodInfo[] = [];
  for (const s of goodSeats) {
    if (assignment[s] === "mutant" || assignment[s] === "lunatic") continue; // 광인·루나틱의 주장은 전부 날조 — 구조도 내용도 검증하지 않는다
    if (s === madSeat) continue; // 세레노부스 광기 — 주장 전체가 강제된 날조
    const becameAt = sc.becameDemonAt.get(s); // 팡 구 점프로 데몬이 된 선한 좌석
    for (const info of claimBySeat[s].info) {
      if (!info.data) continue;
      if (becameAt !== undefined && becameAt <= info.night) continue; // 데몬이 된 뒤의 주장은 날조
      // 정보를 받은 시점의 실제 역할이 주장(당시 역할 asRole 포함)과 일치해야 한다 —
      // 이발사 교환 세계에서 교환 이력이 없는 주장, 교환 없는 세계에서의 이력 주장을 함께 거른다.
      // 철학자의 획득 능력 정보(asRole)는 예외 — 토큰은 철학자 그대로다 (검증은 validatePuzzle).
      if (assignment[s] !== "drunk"
        && !(assignment[s] === "philosopher" && info.asRole !== undefined)
        && tokenRoleAt(assignment, sc, s, info.night) !== (info.asRole ?? claimBySeat[s].role)) {
        return null;
      }
      if (info.data.type === "artist" || info.data.type === "savant") {
        // 낮 정보 (night n = 낮 n) — 밤에 깨지 않으므로 그 낮의 생존만 요구한다
        if (!sched.aliveAfterNight(info.night)[s]) return null;
      } else if (!wakes(ctx, s, info.night)) return null;
      infos.push({ seat: s, night: info.night, data: info.data });
    }
  }

  // 뱀 조련사 교환의 옛 데몬: since부터 선한 조련사로서 진실을 주장한다 — 역할 이력과
  // 기상 가능성은 검증하되, 내용은 검사하지 않는다 (새 조련사는 영구 중독)
  if (snakeOldDemon !== null) {
    for (const info of claimBySeat[snakeOldDemon.seat].info) {
      if (!info.data) continue;
      if (tokenRoleAt(assignment, sc, snakeOldDemon.seat, info.night)
        !== (info.asRole ?? claimBySeat[snakeOldDemon.seat].role)) return null;
      if (!wakes(ctx, snakeOldDemon.seat, info.night)) return null;
    }
  }

  const soberInfos = infos.filter((i) => !isDrunk(ctx, i.seat));
  const poisonerSeat = assignment.indexOf("poisoner");
  const vortoxSeat = assignment.indexOf("vortox");
  const needsExactPoison = soberInfos.some((i) => i.data.type === "mathematician");
  // 독살 대상은 등록상 생존자여야 한다 — 단 가짜 죽음 좀부울은 실제로 살아 있어 대상이 될 수 있다
  const canBePoisonTarget = (night: number, target: Seat): boolean =>
    sched.aliveAtNightStart(night)[target] ||
    (sc.zombuulFakeDeadAt != null && target === sc.currentDemonSeat && sc.zombuulFakeDeadAt < night);
  // 비고르모르티스에게 죽은 독살범은 능력을 유지한다 — 죽어서도 밤마다 독살한다
  const poisonerAble = (night: number): boolean =>
    poisonerSeat >= 0 &&
    (sched.aliveAtNightStart(night)[poisonerSeat] ||
      (sc.vigorKeptSince?.get(poisonerSeat) ?? Infinity) <= night);

  if (!needsExactPoison) {
    // 빠른 경로: 술/독 없이 설명 안 되는 정보는 그 밤 그 좌석의 독살을 강제한다.
    // Vortox 세계에서는 반대로 "거짓일 수 없는" 정보가 독살을 강제한다 — 그 좌석의 독살,
    // 또는 Vortox 자신의 독살(그 밤 능력 정지 → 그 밤 정보 전체가 무제약, 관대한 근사).
    const required = new Map(sc.poisonRequired);
    if (vortoxSeat < 0) {
      for (const i of soberInfos) {
        if (sc.minstrelNights?.has(i.night)) continue; // 전원 취함 밤의 정보는 무제약
        if (isSweetDrunk(ctx, i.seat, i.night)) continue; // 스위트하트 취함 — 정보 무제약
        if (isExtraDrunk(ctx, i.seat, i.night)) continue; // 선원·여관주인·대신 취함 — 정보 무제약
        if (isNdPoisoned(ctx, i.seat, i.night)) continue; // 노 다시 이웃 독 가능 — 정보 무제약
        if (isPukkaPoisoned(ctx, i.seat, i.night)) continue; // 푸카 독 가능 — 정보 무제약
        if (isVigorPoisoned(ctx, i.seat, i.night)) continue; // 죽은 하수인의 이웃 독 가능 — 정보 무제약
        if (checkContent(ctx, i.seat, i.data, i.night)) continue;
        const existing = required.get(i.night);
        if (existing !== undefined && existing !== i.seat) return null;
        required.set(i.night, i.seat);
      }
    } else {
      const failing = new Map<number, Set<Seat>>();
      for (const i of soberInfos) {
        if (sc.minstrelNights?.has(i.night)) continue;
        if (isSweetDrunk(ctx, i.seat, i.night)) continue;
        if (isExtraDrunk(ctx, i.seat, i.night)) continue; // 이동식 취함 — 무제약
        if (required.get(i.night) === vortoxSeat) continue; // 그 밤 Vortox가 중독 — 무제약
        if (checkContentFalse(ctx, i.seat, i.data, i.night)) continue;
        if (!failing.has(i.night)) failing.set(i.night, new Set());
        failing.get(i.night)!.add(i.seat);
      }
      for (const [night, seatsFailing] of failing) {
        const uniq = [...seatsFailing];
        const ex = required.get(night);
        // 한 좌석 실패 → 그 좌석 또는 Vortox 독살, 여럿 실패 → Vortox 독살만이 전부를 구제
        const cands = ex !== undefined
          ? (uniq.length === 1 && ex === uniq[0] ? [ex] : [])
          : uniq.length === 1 ? [uniq[0], vortoxSeat] : [vortoxSeat];
        const pick = cands.find((t) =>
          poisonerSeat >= 0 &&
          !isSweetDrunk(ctx, poisonerSeat, night) &&
          sched.aliveAtNightStart(night)[poisonerSeat] &&
          sched.aliveAtNightStart(night)[t] &&
          !sc.poisonForbidden.get(night)?.has(t));
        if (pick === undefined) return null;
        required.set(night, pick);
      }
    }
    // 광기가 성립하려면 마지막 밤의 세레노부스가 중독되지 않았어야 한다
    if (madSeat !== null && required.get(pz.nights) === cerenoSeat) return null;
    for (const [night, target] of required) {
      if (poisonerSeat < 0) return null;
      if (isSweetDrunk(ctx, poisonerSeat, night)) return null; // 취한 독살범의 독은 듣지 않는다
      if (!poisonerAble(night)) return null;
      if (!canBePoisonTarget(night, target)) return null;
      if (sc.poisonForbidden.get(night)?.has(target)) return null;
    }
    const poisonTargets: (Seat | null)[] = new Array(pz.nights + 1).fill(null);
    for (const [night, target] of required) poisonTargets[night] = target;
    return { assignment: [...finalAssignment], currentDemonSeat: sc.currentDemonSeat, poisonTargets, redHerring, sweetheartDrunk: sweetDrunk?.target ?? null };
  }

  // 열거 경로 (수학자 포함 퍼즐): 밤별 독살 대상을 전수 열거
  const optionsPerNight: (Seat | null)[][] = [];
  for (let night = 1; night <= pz.nights; night++) {
    if (sc.minstrelNights?.has(night)) {
      optionsPerNight[night] = [null]; // 독살범도 취해 있던 밤
      continue;
    }
    const req = sc.poisonRequired.get(night);
    const forbidden = sc.poisonForbidden.get(night);
    if (req !== undefined) {
      if (!poisonerAble(night) || !canBePoisonTarget(night, req) || forbidden?.has(req)) {
        return null;
      }
      optionsPerNight[night] = [req];
    } else if (poisonerAble(night) && !isSweetDrunk(ctx, poisonerSeat, night)) {
      const alive = sched.aliveAtNightStart(night);
      const opts = alive
        .map((a, s) => (a && !forbidden?.has(s) ? s : null))
        .filter((s): s is Seat => s !== null);
      // 가짜 죽음 좀부울(등록상 사망, 실제 생존)도 독살 대상이 될 수 있다
      if (!alive[sc.currentDemonSeat] && canBePoisonTarget(night, sc.currentDemonSeat) && !forbidden?.has(sc.currentDemonSeat)) {
        opts.push(sc.currentDemonSeat);
      }
      optionsPerNight[night] = opts;
    } else {
      optionsPerNight[night] = [null];
    }
  }

  const vector: (Seat | null)[] = new Array(pz.nights + 1).fill(null);
  const tryNight = (night: number): World | null => {
    if (night > pz.nights) {
      // 광기가 성립하려면 마지막 밤의 세레노부스가 중독되지 않았어야 한다
      if (madSeat !== null && vector[pz.nights] === cerenoSeat) return null;
      const pctx: Ctx = { ...ctx, poison: vector };
      for (const i of soberInfos) {
        if (vector[i.night] === i.seat) continue; // 그 밤 중독 → 정보 무제약
        if (sc.minstrelNights?.has(i.night)) continue; // 전원 취함 밤
        if (isSweetDrunk(pctx, i.seat, i.night)) continue; // 스위트하트 취함
        if (isExtraDrunk(pctx, i.seat, i.night)) continue; // 선원·여관주인·대신 취함
        if (isNdPoisoned(pctx, i.seat, i.night)) continue; // 노 다시 이웃 독 가능
        if (isPukkaPoisoned(pctx, i.seat, i.night)) continue; // 푸카 독 가능
        if (isVigorPoisoned(pctx, i.seat, i.night)) continue; // 죽은 하수인의 이웃 독 가능
        if (vortoxSeat >= 0) {
          if (vector[i.night] === vortoxSeat) continue; // Vortox가 중독된 밤 — 무제약 (관대한 근사)
          if (!checkContentFalse(pctx, i.seat, i.data, i.night)) return null;
        } else if (!checkContent(pctx, i.seat, i.data, i.night)) return null;
      }
      return { assignment: [...finalAssignment], currentDemonSeat: sc.currentDemonSeat, poisonTargets: [...vector], redHerring, sweetheartDrunk: sweetDrunk?.target ?? null };
    }
    for (const opt of optionsPerNight[night]) {
      vector[night] = opt;
      const w = tryNight(night + 1);
      if (w) return w;
    }
    vector[night] = null;
    return null;
  };
  return tryNight(1);
}
