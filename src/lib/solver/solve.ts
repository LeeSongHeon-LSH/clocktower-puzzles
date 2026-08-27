// 전수 탐색 엔진.
//
// 핵심 아이디어: 선한 생존 정직 플레이어의 토큰은 주장 역할로 고정되므로,
// 자유도는 (악역 좌석·역할, 주정뱅이 좌석, 데몬 승계, 독살 대상, 레드 헤링)뿐이다.
// 독살은 "정보가 술/독 없이 설명 안 되는 (좌석, 밤) 쌍"으로 역산한다(빠른 경로).
// 수학자(정확한 독살 벡터 필요)가 있는 퍼즐만 독살 벡터를 전수 열거한다.

import { ROLES } from "@/data/roles";
import { composition } from "./composition";
import { checkContent } from "./roles";
import { Ctx, isDrunk, isSweetDrunk, wakes } from "./ctx";
import { DemonScenario, demonScenarios, Schedule, SweetheartCase } from "./timeline";
import type { Claim, InfoData, RoleId, Seat, SolverPuzzle, World } from "./types";
import { SOLVER_ROLES, worldKey } from "./types";

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
 * "유일해"라는 결론 자체가 거짓이 된다. 그래서 세는 대신 거부한다.
 */
function assignableRoles(pz: SolverPuzzle): RoleId[] {
  const out = new Set<RoleId>(pz.rolePool.filter((r) => ROLES[r].team === "minion"));
  for (const c of pz.claims) out.add(c.role);
  if (pz.rolePool.includes("drunk")) out.add("drunk");
  out.add("imp"); // 데몬 자리는 항상 임프로 탐색한다
  return [...out];
}

function validatePuzzle(pz: SolverPuzzle): Claim[] {
  const claimBySeat: Claim[] = [];
  if (new Set(pz.rolePool).size !== pz.rolePool.length) throw new Error("역할 풀에 중복이 있습니다");
  if (!pz.rolePool.includes("imp")) throw new Error("역할 풀에 임프가 없습니다");
  const unmodeled = assignableRoles(pz).filter((r) => !SOLVER_ROLES.includes(r));
  if (unmodeled.length > 0) {
    throw new Error(`솔버가 아직 모르는 역할입니다: ${unmodeled.map((r) => ROLES[r].ko).join(", ")}`);
  }
  for (const c of pz.claims) {
    if (c.seat < 0 || c.seat >= pz.playerCount) throw new Error(`잘못된 좌석: ${c.seat}`);
    if (claimBySeat[c.seat]) throw new Error(`좌석 ${c.seat}의 주장이 중복`);
    if (!pz.rolePool.includes(c.role)) throw new Error(`풀에 없는 역할 주장: ${c.role}`);
    if (c.role === "drunk" || ROLES[c.role].team === "demon") {
      throw new Error(`주장할 수 없는 역할: ${c.role}`);
    }
    for (const info of c.info) {
      if (info.night < 1 || info.night > pz.nights) throw new Error(`좌석 ${c.seat}: 정보 밤 범위 밖 (밤 ${info.night})`);
      if (info.data && info.data.type !== c.role) {
        throw new Error(`좌석 ${c.seat}: 주장 역할(${c.role})과 정보 타입(${info.data.type}) 불일치`);
      }
    }
    claimBySeat[c.seat] = c;
  }
  for (let s = 0; s < pz.playerCount; s++) {
    if (!claimBySeat[s]) throw new Error(`좌석 ${s}의 주장이 없습니다 (전원 공개 주장 형식)`);
  }
  return claimBySeat;
}

interface GoodInfo {
  seat: Seat;
  night: number;
  data: InfoData;
}

export function solve(pz: SolverPuzzle): World[] {
  const claimBySeat = validatePuzzle(pz);
  const sched = new Schedule(pz);
  const N = pz.playerCount;
  const seats = Array.from({ length: N }, (_, i) => i);
  const minionsInPool = pz.rolePool.filter((r) => ROLES[r].team === "minion");
  const baseComp = composition(N, false);
  const found = new Map<string, World>();

  for (const demonSeat of seats) {
    const nonDemon = seats.filter((s) => s !== demonSeat);
    for (const minionSeats of combinations(nonDemon, baseComp.minion)) {
      for (const minionRoles of permutations(minionsInPool, minionSeats.length)) {
        // 구성 변형: 남작 +2 외부인, 대부 ±1 외부인 (텔러 선택 — 두 경우 모두 탐색)
        let deltas = [0];
        if (minionRoles.includes("baron")) deltas = deltas.map((d) => d + 2);
        if (minionRoles.includes("godfather")) deltas = deltas.flatMap((d) => [d + 1, d - 1]);
        for (const delta of new Set(deltas)) {
          const comp = { ...baseComp, outsider: baseComp.outsider + delta, townsfolk: baseComp.townsfolk - delta };
          if (comp.outsider < 0 || comp.townsfolk < 0) continue;
          const evil = new Set<Seat>([demonSeat, ...minionSeats]);
          const goodSeats = seats.filter((s) => !evil.has(s));
          const outsiderClaims = goodSeats.filter((s) => ROLES[claimBySeat[s].role].team === "outsider");
          const need = comp.outsider - outsiderClaims.length;
          if (need < 0 || need > 1) continue;
          if (need === 1 && !pz.rolePool.includes("drunk")) continue;
          const drunkChoices: (Seat | null)[] = need === 1
            ? goodSeats.filter((s) => ROLES[claimBySeat[s].role].team === "townsfolk")
            : [null];

          for (const drunkSeat of drunkChoices) {
            const assignment: RoleId[] = new Array(N);
            assignment[demonSeat] = "imp";
            minionSeats.forEach((s, i) => { assignment[s] = minionRoles[i]; });
            for (const s of goodSeats) assignment[s] = s === drunkSeat ? "drunk" : claimBySeat[s].role;

            const goodTokens = goodSeats.map((s) => assignment[s]);
            if (new Set(goodTokens).size !== goodTokens.length) continue; // 실물 토큰 중복 불가
            const tfCount = goodSeats.filter((s) => ROLES[assignment[s]].team === "townsfolk").length;
            if (tfCount !== comp.townsfolk) continue;

            for (const sweet of sweetheartCases(pz, sched, assignment, seats)) {
              for (const sc of demonScenarios(pz, sched, assignment, sweet)) {
                const ftSeat = assignment.indexOf("fortuneteller");
                const rhChoices: (Seat | null)[] = ftSeat >= 0 ? goodSeats : [null];
                for (const rh of rhChoices) {
                  const world = tryWorld(pz, sched, claimBySeat, assignment, sc, sweet, rh, goodSeats);
                  if (world) found.set(worldKey(world), world);
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
): World | null {
  const sweetDrunk = sweet !== null && sweet.target !== null ? { target: sweet.target, since: sweet.since } : null;
  const ctx: Ctx = { pz, sched, assignment, claimBySeat, sc, redHerring, poison: null, sweet: sweetDrunk };

  // 선한 좌석(주정뱅이 포함)의 정보 수집 + 구조 검증 (깨어날 수 없었다면 그 주장은 참일 수 없다)
  const infos: GoodInfo[] = [];
  for (const s of goodSeats) {
    for (const info of claimBySeat[s].info) {
      if (!info.data) continue;
      if (!wakes(ctx, s, info.night)) return null;
      infos.push({ seat: s, night: info.night, data: info.data });
    }
  }

  const soberInfos = infos.filter((i) => !isDrunk(ctx, i.seat));
  const poisonerSeat = assignment.indexOf("poisoner");
  const needsExactPoison = soberInfos.some((i) => i.data.type === "mathematician");

  if (!needsExactPoison) {
    // 빠른 경로: 술/독 없이 설명 안 되는 정보는 그 밤 그 좌석의 독살을 강제한다
    const required = new Map(sc.poisonRequired);
    for (const i of soberInfos) {
      if (sc.minstrelNights?.has(i.night)) continue; // 전원 취함 밤의 정보는 무제약
      if (isSweetDrunk(ctx, i.seat, i.night)) continue; // 스위트하트 취함 — 정보 무제약
      if (checkContent(ctx, i.seat, i.data, i.night)) continue;
      const existing = required.get(i.night);
      if (existing !== undefined && existing !== i.seat) return null;
      required.set(i.night, i.seat);
    }
    for (const [night, target] of required) {
      if (poisonerSeat < 0) return null;
      if (isSweetDrunk(ctx, poisonerSeat, night)) return null; // 취한 독살범의 독은 듣지 않는다
      if (!sched.aliveAtNightStart(night)[poisonerSeat]) return null;
      if (!sched.aliveAtNightStart(night)[target]) return null;
      if (sc.poisonForbidden.get(night)?.has(target)) return null;
    }
    const poisonTargets: (Seat | null)[] = new Array(pz.nights + 1).fill(null);
    for (const [night, target] of required) poisonTargets[night] = target;
    return { assignment: [...assignment], currentDemonSeat: sc.currentDemonSeat, poisonTargets, redHerring, sweetheartDrunk: sweetDrunk?.target ?? null };
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
      if (poisonerSeat < 0 || !sched.aliveAtNightStart(night)[poisonerSeat] || !sched.aliveAtNightStart(night)[req] || forbidden?.has(req)) {
        return null;
      }
      optionsPerNight[night] = [req];
    } else if (poisonerSeat >= 0 && sched.aliveAtNightStart(night)[poisonerSeat] && !isSweetDrunk(ctx, poisonerSeat, night)) {
      const alive = sched.aliveAtNightStart(night);
      optionsPerNight[night] = alive
        .map((a, s) => (a && !forbidden?.has(s) ? s : null))
        .filter((s): s is Seat => s !== null);
    } else {
      optionsPerNight[night] = [null];
    }
  }

  const vector: (Seat | null)[] = new Array(pz.nights + 1).fill(null);
  const tryNight = (night: number): World | null => {
    if (night > pz.nights) {
      const pctx: Ctx = { ...ctx, poison: vector };
      for (const i of soberInfos) {
        if (vector[i.night] === i.seat) continue; // 그 밤 중독 → 정보 무제약
        if (sc.minstrelNights?.has(i.night)) continue; // 전원 취함 밤
        if (isSweetDrunk(pctx, i.seat, i.night)) continue; // 스위트하트 취함
        if (!checkContent(pctx, i.seat, i.data, i.night)) return null;
      }
      return { assignment: [...assignment], currentDemonSeat: sc.currentDemonSeat, poisonTargets: [...vector], redHerring, sweetheartDrunk: sweetDrunk?.target ?? null };
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
