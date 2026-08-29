// 시나리오 검증 하네스 (일회성 점검 도구).
//
// 네 가지를 본다.
//   A 수록 퍼즐 회귀      — 지금 실려 있는 퍼즐이 여전히 유일해인가
//   B 모델링 역할 커버리지 — SOLVER_ROLES 70종이 실제로 한 번씩은 돌아가는가
//   C 단서 민감도          — 정보를 하나 빼면 답이 흔들리는가 (안 흔들리면 그 단서는 군더더기)
//   D 점선 역할 시나리오   — 68종 각각으로 미검증 레인 퍼즐을 만들어 링크까지 뽑히는가
//
// 결과는 JSON으로 떨어뜨린다. 사람이 읽는 보고서는 그걸 보고 따로 쓴다.
//   npx tsx scripts/verify-scenarios.ts <출력경로.json>

import { writeFileSync } from "node:fs";
import { ROLES } from "@/data/roles";
import { PUZZLES } from "@/data/puzzles";
import { encodePuzzle, decodePuzzle, toPuzzle, type SharedPuzzle } from "@/lib/puzzles/codec";
import { analyze } from "@/lib/solver/solve";
import { ROLE_IDS, SOLVER_ROLES, type Claim, type RoleId, type Seat, type SolverPuzzle } from "@/lib/solver/types";

const out: Record<string, unknown> = { ranAt: new Date().toISOString() };
const ms = (t0: number) => Math.round((performance.now() - t0) * 10) / 10;

// ── A. 수록 퍼즐 회귀 ────────────────────────────────────────────

const regression = PUZZLES.map((p) => {
  const t0 = performance.now();
  let worlds = -1;
  let error: string | null = null;
  try {
    worlds = analyze(p).worlds.length;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return {
    id: p.id,
    players: p.playerCount,
    nights: p.nights,
    pool: p.rolePool.length,
    worlds,
    unique: worlds === 1,
    matchesSolution: worlds === 1 && analyze(p).worlds[0].assignment.join(",") === p.solution.join(","),
    error,
    ms: ms(t0),
  };
});
out.regression = regression;

// ── B. 모델링 역할 커버리지 ──────────────────────────────────────
//
// 수록 퍼즐이 실제로 건드리는 역할과, 한 번도 안 건드리는 역할을 가른다.
// 안 건드리는 역할은 최소 시나리오를 만들어 적어도 예외 없이 도는지 확인한다.

const exercised = new Set<RoleId>();
for (const p of PUZZLES) {
  for (const r of p.solution) exercised.add(r);
  for (const c of p.claims) exercised.add(c.role);
}

/** 좌석에 앉힐 수 없는 역할 (자기 정체를 모르거나 감춘다 — 주장으로 쓸 수 없다) */
const UNCLAIMABLE: RoleId[] = ["drunk", "mutant", "lunatic"];
const isClaimable = (r: RoleId) => !UNCLAIMABLE.includes(r) && ROLES[r].team !== "demon";

/** 정보 없는 단순 주장만으로 이루어진 최소 시나리오 — 구조가 성립하는지만 본다 */
function minimalScenario(subject: RoleId): SolverPuzzle | null {
  const team = ROLES[subject].team;
  const players = 7;
  // 선한 채움용: 정보를 안 내도 되는 모델링된 마을 사람
  const fillers: RoleId[] = ["soldier", "mayor", "chef", "empath", "monk", "ravenkeeper", "virgin"];
  const minion: RoleId = team === "minion" ? subject : "poisoner";
  const demon: RoleId = team === "demon" ? subject : "imp";

  const good: RoleId[] = [];
  if (team === "townsfolk" || team === "outsider") good.push(subject);
  for (const f of fillers) {
    if (good.length >= players - 2) break;
    if (f !== subject) good.push(f);
  }
  if (good.length < players - 2) return null;

  const solution: RoleId[] = [...good, minion, demon];
  const claims: Claim[] = solution.map((r, seat) => ({
    seat: seat as Seat,
    // 악역과 주장 불가 역할은 모델링된 마을 사람을 사칭한다
    role: isClaimable(r) && ROLES[r].team !== "minion" ? r : "soldier",
    info: [],
  }));
  // 사칭이 겹치면(soldier 둘) 구조상 문제는 없지만 사람이 읽기 나쁘니 하나만 soldier로 둔다
  // 이발사·뱀 조련사는 특정 역할과 한 퍼즐에 못 들어간다(문서화된 미지원 조합).
  // 하네스가 그 조합을 만들면 솔버 결함처럼 보이므로 애초에 넣지 않는다.
  const extras: RoleId[] = subject === "barber" || subject === "snakecharmer"
    ? ["soldier", "recluse"]
    : ["soldier", "drunk", "recluse", "baron"];
  const pool = [...new Set<RoleId>([...solution, ...extras])];
  return { playerCount: players, nights: 1, rolePool: pool, claims, events: [] };
}

const coverage = (SOLVER_ROLES as readonly RoleId[]).map((r) => {
  const inPuzzles = exercised.has(r);
  let smokeWorlds: number | null = null;
  let smokeError: string | null = null;
  const pz = minimalScenario(r);
  if (pz) {
    try {
      smokeWorlds = analyze(pz).worlds.length;
    } catch (e) {
      smokeError = e instanceof Error ? e.message : String(e);
    }
  }
  return { role: r, ko: ROLES[r].ko, team: ROLES[r].team, edition: ROLES[r].edition, inPuzzles, smokeWorlds, smokeError };
});
out.coverage = coverage;

// ── C. 단서 민감도 ───────────────────────────────────────────────
//
// 정보를 하나 빼면 답이 흔들려야 한다. 빼도 유일해면 그 단서는 없어도 되는 것이고,
// 퍼즐이 필요 이상으로 많은 정보를 주고 있다는 뜻이다.

const sensitivity = PUZZLES.flatMap((p) =>
  p.claims.flatMap((c, ci) =>
    c.info.map((_, ii) => {
      const claims = p.claims.map((cc, i) =>
        i === ci ? { ...cc, info: cc.info.filter((_, j) => j !== ii) } : cc,
      );
      let worlds = -1;
      let error: string | null = null;
      try {
        worlds = analyze({ ...p, claims }).worlds.length;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      return {
        puzzle: p.id,
        seat: c.seat,
        role: c.role,
        infoIndex: ii,
        night: c.info[ii].night,
        worldsWithout: worlds,
        redundant: worlds === 1, // 빼도 유일해 = 없어도 되는 단서
        error,
      };
    }),
  ),
);
out.sensitivity = sensitivity;

/**
 * 하나씩 빼는 검사는 "이 단서 하나 없어도 되는가"만 답한다. 여러 개를 동시에 빼도
 * 유일해가 유지되는지는 따로 봐야 한다 — 유일해가 깨질 때까지 탐욕적으로 계속 뺀다.
 * 남은 개수가 그 퍼즐을 풀기 위해 실제로 필요한 단서의 상한이다.
 */
const minimalClues = PUZZLES.map((p) => {
  let claims = p.claims.map((c) => ({ ...c, info: [...c.info] }));
  const total = claims.reduce((n, c) => n + c.info.length, 0);
  const dropped: string[] = [];
  let progress = true;
  while (progress) {
    progress = false;
    for (let ci = 0; ci < claims.length && !progress; ci++) {
      for (let ii = 0; ii < claims[ci].info.length; ii++) {
        const trial = claims.map((cc, i) =>
          i === ci ? { ...cc, info: cc.info.filter((_, j) => j !== ii) } : cc,
        );
        let ok = false;
        try {
          const w = analyze({ ...p, claims: trial }).worlds;
          ok = w.length === 1 && w[0].assignment.join(",") === p.solution.join(",");
        } catch {
          ok = false;
        }
        if (ok) {
          dropped.push(`${claims[ci].seat}:${claims[ci].role}#${claims[ci].info[ii].night}`);
          claims = trial;
          progress = true;
          break;
        }
      }
    }
  }
  const kept = claims.reduce((n, c) => n + c.info.length, 0);
  return { puzzle: p.id, total, kept, dropped: dropped.length, droppedList: dropped };
});
out.minimalClues = minimalClues;

// ── D. 점선 역할 시나리오 → 미검증 레인 → 링크 ───────────────────

const DASHED = (ROLE_IDS as readonly RoleId[]).filter((r) => !SOLVER_ROLES.includes(r));

/** 이웃 좌석 (원형) */
const nb = (s: Seat, n: number): [Seat, Seat] => [((s + n - 1) % n) as Seat, ((s + 1) % n) as Seat];

/**
 * 점선 역할 하나를 좌석에 앉힌 7인 시나리오.
 * 정보는 의도한 배치에서 실제로 참인 값으로 채운다 — 미검증 레인은 내용을 검사하지
 * 않지만, 사람이 열어 봤을 때 말이 되는 문제여야 보고서에 의미가 있다.
 */
function dashedScenario(subject: RoleId): SharedPuzzle | null {
  const team = ROLES[subject].team;
  const players = 7;
  const minion: RoleId = team === "minion" ? subject : "poisoner";
  const demon: RoleId = team === "demon" ? subject : "imp";

  // 좌석 0..4 선, 5 하수인, 6 데몬
  const goodBase: RoleId[] = ["chef", "empath", "fortuneteller", "soldier", "mayor"];
  const good = [...goodBase];
  if (team === "townsfolk" || team === "outsider") good[0] = subject; // 좌석 0에 앉힌다
  const solution: RoleId[] = [...good, minion, demon];
  if (solution.length !== players) return null;

  const evil = new Set<Seat>([5, 6]);
  const isEvil = (s: number) => evil.has(s as Seat);

  // 사칭: 악역 두 좌석은 모델링된 마을 사람을 댄다 (대본에 있고 주장 가능해야 한다)
  const bluffs: RoleId[] = ["undertaker", "librarian"];
  const claimRole = (s: number): RoleId => {
    if (s === 5) return bluffs[0];
    if (s === 6) return bluffs[1];
    const r = solution[s];
    return isClaimable(r) ? r : "soldier";
  };

  // 참인 정보 — 의도한 배치에서 실제로 성립하는 값
  const empathCount = (s: Seat) => nb(s, players).filter(isEvil).length;
  const chefPairs = solution.reduce((n, _, s) => n + (isEvil(s) && isEvil((s + 1) % players) ? 1 : 0), 0);

  const info = (s: number): Claim["info"] => {
    const role = claimRole(s);
    switch (role) {
      case "chef": return [{ night: 1, data: { type: "chef", count: chefPairs } }];
      case "empath": return [{ night: 1, data: { type: "empath", count: empathCount(s as Seat) } }];
      case "fortuneteller": return [{ night: 1, data: { type: "fortuneteller", targets: [5, 6], yes: true } }];
      // 사칭 좌석은 그럴듯한 거짓 정보를 낸다 (미검증 레인이라 내용 검사는 없다)
      case "undertaker": return [];
      case "librarian": return [{ night: 1, data: { type: "librarian", targets: [1, 2], shownRole: "drunk" } }];
      default: return [];
    }
  };

  const claims: Claim[] = Array.from({ length: players }, (_, s) => ({
    seat: s as Seat,
    role: claimRole(s),
    info: info(s),
  }));

  const pool = [...new Set<RoleId>([
    ...solution, ...bluffs, "chef", "empath", "fortuneteller", "soldier", "mayor",
    "monk", "ravenkeeper", "drunk", "recluse", "baron", "scarletwoman", "imp",
  ])];

  return {
    title: `${ROLES[subject].ko} 시나리오`,
    author: "검증 하네스",
    edition: "mixed",
    difficulty: "easy",
    playerCount: players,
    rolePool: pool,
    nights: 1,
    claims,
    events: [],
    questions: [{ id: "demon", text: "지금 이 순간의 악마는 누구인가?", answerSeats: [6] }],
    solution,
    walkthrough: [
      `① 이 문제에는 검증기가 능력을 모르는 ${ROLES[subject].ko}(${ROLES[subject].en})이(가) 들어 있다.`,
      "② 그래서 유일해 탐색을 돌리지 않았고, 답이 하나라는 보장이 없다.",
      "③ 의도한 배치는 F가 독살자, G가 임프다.",
    ],
  };
}

async function main() {
const dashedResults: unknown[] = [];
for (const r of DASHED) {
  const row: Record<string, unknown> = { role: r, ko: ROLES[r].ko, team: ROLES[r].team, edition: ROLES[r].edition };
  const shared = dashedScenario(r);
  if (!shared) {
    row.built = false;
    dashedResults.push(row);
    continue;
  }
  row.built = true;
  try {
    const pz = toPuzzle(shared, "harness");
    const a = analyze(pz);
    row.structuralOk = true;
    row.unmodeled = a.unmodeled;
    row.flagsSubject = a.unmodeled.includes(r);
    row.skippedSearch = a.worlds.length === 0;
    row.walkthroughSteps = shared.walkthrough?.length ?? 0;

    // 링크 왕복 — 에디터가 하는 것과 같은 경로
    const fragment = await encodePuzzle(shared);
    row.linkChars = `https://clocktower-fan-puzzles.vercel.app/play#${fragment}`.length;
    const round = await decodePuzzle(fragment);
    const a2 = analyze(toPuzzle(round, "harness-round"));
    row.roundTripOk = a2.unmodeled.join(",") === a.unmodeled.join(",");
    row.fragment = fragment;
  } catch (e) {
    row.structuralOk = false;
    row.error = e instanceof Error ? e.message : String(e);
  }
  dashedResults.push(row);
}
out.dashed = dashedResults;

// 수록 퍼즐을 링크로 내보내면 얼마나 긴가 — 메신저가 자르는 한계와 견줘 본다
const puzzleLinks: unknown[] = [];
for (const p of PUZZLES) {
  const { id: _id, source: _s, ...rest } = p;
  void _id; void _s;
  const fragment = await encodePuzzle(rest as SharedPuzzle);
  puzzleLinks.push({
    id: p.id,
    clues: p.claims.reduce((n, c) => n + c.info.length, 0),
    linkChars: `https://clocktower-fan-puzzles.vercel.app/play#${fragment}`.length,
  });
}
out.puzzleLinks = puzzleLinks;

// ── 요약 ─────────────────────────────────────────────────────────

out.summary = {
  puzzles: regression.length,
  puzzlesUnique: regression.filter((r) => r.unique && r.matchesSolution).length,
  solverRoles: SOLVER_ROLES.length,
  rolesInPuzzles: coverage.filter((c) => c.inPuzzles).length,
  smokeErrors: coverage.filter((c) => c.smokeError).length,
  clues: sensitivity.length,
  redundantClues: sensitivity.filter((s) => s.redundant).length,
  dashedRoles: DASHED.length,
  dashedBuilt: dashedResults.filter((d) => (d as { built: boolean }).built).length,
  dashedFlagged: dashedResults.filter((d) => (d as { flagsSubject?: boolean }).flagsSubject).length,
  dashedLinked: dashedResults.filter((d) => (d as { roundTripOk?: boolean }).roundTripOk).length,
  cluesKeptAfterGreedyTrim: minimalClues.reduce((n, m) => n + m.kept, 0),
};

const path = process.argv[2] ?? "verify-scenarios.json";
writeFileSync(path, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
}

void main();
