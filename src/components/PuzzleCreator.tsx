"use client";

// 사설 퍼즐 에디터.
//
// 핵심: 브라우저가 직접 솔버를 돌려 **유일해일 때만 공유 링크를 발급한다.**
// "모든 퍼즐은 유일해가 증명돼야 한다"는 규칙이 사람 검수 없이 사설 문제에도 적용된다.
// 실측상 솔버는 최악의 경우도 15ms 미만이라 동기 실행으로 충분하다.

import { useMemo, useState } from "react";
import { EDITION_LABELS, ROLES, TEAM_LABELS, roleLabel } from "@/data/roles";
import { LIMITS, encodePuzzle, toPuzzle, type SharedPuzzle } from "@/lib/puzzles/codec";
import { seatName, type Difficulty } from "@/lib/puzzles/schema";
import { solve } from "@/lib/solver/solve";
import {
  ROLE_IDS,
  SOLVER_ROLES,
  type Edition,
  type InfoData,
  type RoleId,
  type Seat,
  type Team,
} from "@/lib/solver/types";
import { renderInfo } from "@/lib/render";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "쉬움" },
  { value: "normal", label: "보통" },
  { value: "hard", label: "어려움" },
];

/** 주장할 수 없는 역할: 주정뱅이(자신을 모름)와 악마 */
const UNCLAIMABLE: RoleId[] = ["drunk", ...(ROLE_IDS as readonly RoleId[]).filter((r) => ROLES[r].team === "demon")];

/** 그리모어 순서 — 규칙 문서(/rules)와 같은 배열을 쓴다 */
const TEAM_ORDER: Team[] = ["townsfolk", "outsider", "minion", "demon"];

const POOL_BY_TEAM = TEAM_ORDER.map((team) => ({
  team,
  roles: (ROLE_IDS as readonly RoleId[]).filter((r) => ROLES[r].team === team),
}));

/** 진영색은 팔레트의 team 토큰을 그대로 쓴다 — 마을 광장·규칙 문서와 같은 색이다. */
const TEAM_STYLE: Record<Team, { rail: string; text: string; chipOn: string }> = {
  townsfolk: {
    rail: "border-team-townsfolk/40",
    text: "text-team-townsfolk",
    chipOn: "border-team-townsfolk bg-team-townsfolk/15 text-parchment",
  },
  outsider: {
    rail: "border-team-outsider/40",
    text: "text-team-outsider",
    chipOn: "border-team-outsider bg-team-outsider/15 text-parchment",
  },
  minion: {
    rail: "border-team-minion/40",
    text: "text-team-minion",
    chipOn: "border-team-minion bg-team-minion/15 text-parchment",
  },
  demon: {
    rail: "border-team-demon/40",
    text: "text-team-demon",
    chipOn: "border-team-demon bg-team-demon/15 text-parchment",
  },
};

const EDITIONS: Edition[] = ["tb", "bmr", "sv"];

/** 정보를 만들어 내는 역할 = 정보 입력칸이 있는 역할 */
const INFO_ROLES: RoleId[] = [
  "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller",
  "undertaker", "ravenkeeper", "clockmaker", "seamstress", "mathematician", "chambermaid",
];

interface DraftInfo {
  night: number;
  data: InfoData;
}

interface DraftClaim {
  role: RoleId;
  info: DraftInfo[];
}

type Verdict =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "multiple"; count: number }
  | { kind: "none" }
  | { kind: "unsupported"; roles: RoleId[] }
  | { kind: "unique"; link: string };

/** 역할에 맞는 기본 정보값 */
function blankInfo(role: RoleId, night: number, players: number): DraftInfo | null {
  const pair: [Seat, Seat] = [0, Math.min(1, players - 1)];
  switch (role) {
    case "washerwoman": return { night, data: { type: "washerwoman", targets: pair, shownRole: "librarian" } };
    case "librarian": return { night, data: { type: "librarian", targets: pair, shownRole: "drunk" } };
    case "investigator": return { night, data: { type: "investigator", targets: pair, shownRole: "poisoner" } };
    case "chef": return { night, data: { type: "chef", count: 0 } };
    case "empath": return { night, data: { type: "empath", count: 0 } };
    case "fortuneteller": return { night, data: { type: "fortuneteller", targets: pair, yes: false } };
    case "undertaker": return { night, data: { type: "undertaker", shownRole: "imp" } };
    case "ravenkeeper": return { night, data: { type: "ravenkeeper", target: 0, shownRole: "imp" } };
    case "clockmaker": return { night, data: { type: "clockmaker", steps: 1 } };
    case "seamstress": return { night, data: { type: "seamstress", targets: pair, sameTeam: true } };
    case "mathematician": return { night, data: { type: "mathematician", count: 0 } };
    case "chambermaid": return { night, data: { type: "chambermaid", targets: pair, count: 0 } };
    default: return null;
  }
}

const field = "rounded border border-panel-edge bg-ink px-2 py-1 text-sm text-parchment";
const label = "block text-xs text-faded";

export function PuzzleCreator() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [playerCount, setPlayerCount] = useState(7);
  const [nights, setNights] = useState(2);
  const [pool, setPool] = useState<RoleId[]>([
    "imp", "poisoner", "scarletwoman", "washerwoman", "librarian", "investigator", "chef", "empath", "drunk",
  ]);
  const [claims, setClaims] = useState<DraftClaim[]>(() =>
    Array.from({ length: 7 }, () => ({ role: "chef" as RoleId, info: [] })),
  );
  const [solution, setSolution] = useState<RoleId[]>(() => Array.from({ length: 7 }, () => "chef" as RoleId));
  const [execDay, setExecDay] = useState<string>("");
  const [execSeat, setExecSeat] = useState(0);
  const [deathNight, setDeathNight] = useState<string>("");
  const [deathSeat, setDeathSeat] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>({ kind: "idle" });
  /** 역할 풀 표시 필터. 사전이 72종이라 판본으로 좁혀 보여준다 (고른 역할은 항상 보인다). */
  const [poolEdition, setPoolEdition] = useState<Edition | "all">("tb");

  const seats = useMemo(() => Array.from({ length: playerCount }, (_, i) => i), [playerCount]);
  const claimable = useMemo(() => pool.filter((r) => !UNCLAIMABLE.includes(r)), [pool]);

  /** 인원수가 바뀌면 좌석 배열들을 맞춘다 */
  function resizeTo(n: number) {
    setPlayerCount(n);
    setClaims((prev) =>
      Array.from({ length: n }, (_, i) => prev[i] ?? { role: claimable[0] ?? "chef", info: [] }),
    );
    setSolution((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? "chef"));
    setVerdict({ kind: "idle" });
  }

  /**
   * 역할 풀에서 뺀 역할이 주장·정답에 남아 있으면 솔버가 거부한다.
   * 사용자가 원인을 찾기 어려우므로 뺄 때 함께 정리한다.
   */
  function togglePool(role: RoleId) {
    setPool((prev) => {
      if (!prev.includes(role)) return [...prev, role];
      const next = prev.filter((r) => r !== role);
      const fallbackClaim = next.find((r) => !UNCLAIMABLE.includes(r));
      const fallbackRole = next[0];
      setClaims((cs) =>
        cs.map((c) => (c.role === role && fallbackClaim ? { role: fallbackClaim, info: [] } : c)),
      );
      setSolution((sol) => sol.map((r) => (r === role && fallbackRole ? fallbackRole : r)));
      return next;
    });
    setVerdict({ kind: "idle" });
  }

  function buildShared(): SharedPuzzle {
    const events = [];
    if (execDay !== "") events.push({ type: "execution" as const, day: Number(execDay), seat: execSeat });
    if (deathNight !== "") events.push({ type: "death" as const, night: Number(deathNight), seat: deathSeat });

    const demonSeat = solution.findIndex((r) => ROLES[r].team === "demon");
    return {
      title: title.trim() || "이름 없는 문제",
      author: author.trim() || undefined,
      edition: "mixed",
      difficulty,
      playerCount,
      rolePool: pool,
      nights,
      claims: claims.map((c, seat) => ({ seat, role: c.role, info: c.info })),
      events,
      questions: [{ id: "demon" as const, text: "지금 이 순간의 악마는 누구인가?", answerSeats: [demonSeat] }],
      solution,
    };
  }

  async function verify() {
    let shared: SharedPuzzle;
    try {
      shared = buildShared();
    } catch (e) {
      setVerdict({ kind: "error", message: e instanceof Error ? e.message : "문제를 만들 수 없습니다." });
      return;
    }

    // 솔버가 능력을 모르는 역할이 좌석에 배정되면 그 능력을 없는 셈 치고 세게 된다.
    // 그러면 "유일해"라는 결론 자체가 거짓이 되므로, 세는 대신 어떤 역할이 걸렸는지 알린다.
    const unmodeled = [
      ...new Set([
        ...pool.filter((r) => ROLES[r].team === "minion"),
        ...(pool.includes("drunk") ? (["drunk"] as RoleId[]) : []),
        ...claims.map((c) => c.role),
        ...shared.solution,
      ]),
    ].filter((r) => !SOLVER_ROLES.includes(r));
    if (unmodeled.length > 0) {
      setVerdict({ kind: "unsupported", roles: unmodeled });
      return;
    }

    const demons = shared.solution.filter((r) => ROLES[r].team === "demon");
    if (demons.length !== 1) {
      setVerdict({ kind: "error", message: "정답 배치에 악마가 정확히 1명 있어야 합니다." });
      return;
    }
    let worlds;
    try {
      worlds = solve(toPuzzle(shared, "draft"));
    } catch (e) {
      setVerdict({ kind: "error", message: e instanceof Error ? e.message : "검증에 실패했습니다." });
      return;
    }

    if (worlds.length === 0) {
      setVerdict({ kind: "none" });
      return;
    }
    if (worlds.length > 1) {
      setVerdict({ kind: "multiple", count: worlds.length });
      return;
    }
    // 유일해가 작성자가 의도한 배치와 같은지도 확인한다
    const found = worlds[0].assignment;
    if (found.join(",") !== shared.solution.join(",")) {
      setVerdict({
        kind: "error",
        message:
          "해는 하나인데 입력한 정답 배치와 다릅니다. 솔버가 찾은 배치: " +
          found.map((r, i) => `${seatName(i)}=${ROLES[r].ko}`).join(", "),
      });
      return;
    }

    // CompressionStream이 없는 구형 브라우저에서는 링크를 만들 수 없다.
    try {
      const fragment = await encodePuzzle(shared);
      setVerdict({ kind: "unique", link: `${window.location.origin}/play#${fragment}` });
    } catch {
      setVerdict({
        kind: "error",
        message:
          "답은 하나로 확인됐지만 이 브라우저에서는 링크를 만들 수 없습니다. 최신 크롬·사파리·파이어폭스에서 다시 시도해 주세요.",
      });
    }
  }

  return (
    <div className="space-y-8 text-sm">
      {/* ── 기본 정보 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">1. 기본 정보</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="title">제목</label>
            <input id="title" className={`${field} w-full`} value={title} maxLength={LIMITS.maxTitle}
              onChange={(e) => setTitle(e.target.value)} placeholder="예: 장의사의 거짓말" />
          </div>
          <div>
            <label className={label} htmlFor="author">별명 (선택)</label>
            <input id="author" className={`${field} w-full`} value={author} maxLength={LIMITS.maxAuthor}
              onChange={(e) => setAuthor(e.target.value)} placeholder="만든 사람" />
          </div>
          <div>
            <label className={label} htmlFor="difficulty">난이도</label>
            <select id="difficulty" className={`${field} w-full`} value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={label} htmlFor="players">인원수</label>
              <select id="players" className={`${field} w-full`} value={playerCount}
                onChange={(e) => resizeTo(Number(e.target.value))}>
                {Array.from({ length: LIMITS.maxPlayers - LIMITS.minPlayers + 1 }, (_, i) => LIMITS.minPlayers + i)
                  .map((n) => <option key={n} value={n}>{n}명</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className={label} htmlFor="nights">경과한 밤</label>
              <select id="nights" className={`${field} w-full`} value={nights}
                onChange={(e) => { setNights(Number(e.target.value)); setVerdict({ kind: "idle" }); }}>
                {Array.from({ length: LIMITS.maxNights }, (_, i) => i + 1)
                  .map((n) => <option key={n} value={n}>밤 {n}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── 역할 풀 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">2. 역할 풀</h2>
        <p className="text-xs text-faded">
          이 문제에 등장할 수 있는 역할입니다. <strong className="text-parchment">좁게 잡을수록 추리가 선명해집니다.</strong>{" "}
          악마는 최소 1종 넣어야 합니다.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="판본 필터">
          {(["all", ...EDITIONS] as const).map((e) => (
            <button key={e} type="button" onClick={() => setPoolEdition(e)} aria-pressed={poolEdition === e}
              className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                poolEdition === e
                  ? "border-brass bg-brass/15 text-parchment"
                  : "border-panel-edge text-faded hover:text-parchment"
              }`}>
              {e === "all" ? "전체" : EDITION_LABELS[e].ko}
            </button>
          ))}
        </div>

        <p className="text-xs text-faded">
          <span className="mr-1.5 inline-block rounded-full border border-dashed border-faded px-2 py-0.5 align-middle text-[11px]">
            점선
          </span>
          은 솔버가 아직 능력을 모르는 역할입니다. 풀에 넣어도 되지만, 그 역할이 좌석에 배정되면
          유일해 검증과 공유 링크가 나오지 않습니다.
        </p>

        <div className="space-y-3" role="group" aria-label="역할 풀">
          {POOL_BY_TEAM.map(({ team, roles }) => {
            const picked = roles.filter((r) => pool.includes(r)).length;
            // 고른 역할을 숨기면 풀에 뭐가 들었는지 모르게 된다 — 필터는 안 고른 역할만 접는다.
            const shown = roles.filter(
              (r) => poolEdition === "all" || ROLES[r].edition === poolEdition || pool.includes(r),
            );
            const style = TEAM_STYLE[team];
            return (
              <div key={team} className={`border-l-2 pl-3 ${style.rail}`}>
                <div className="flex items-baseline gap-2">
                  <h3 className={`font-display text-sm font-bold ${style.text}`}>{TEAM_LABELS[team].ko}</h3>
                  <span className="text-[11px] text-faded">{TEAM_LABELS[team].en}</span>
                  <span className={`ml-auto text-[11px] tabular-nums ${picked > 0 ? style.text : "text-faded"}`}>
                    {picked}/{roles.length}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {shown.map((r) => {
                    const on = pool.includes(r);
                    const modeled = SOLVER_ROLES.includes(r);
                    return (
                      <button key={r} type="button" onClick={() => togglePool(r)} aria-pressed={on}
                        aria-label={modeled ? ROLES[r].ko : `${ROLES[r].ko} (솔버 미구현)`}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                          modeled ? "" : "border-dashed"
                        } ${on ? style.chipOn : "border-panel-edge text-faded hover:text-parchment"}`}>
                        {ROLES[r].ko}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!pool.some((r) => ROLES[r].team === "demon") && (
          <p className="text-xs text-blood">악마가 하나도 없습니다.</p>
        )}
      </section>

      {/* ── 좌석별 주장 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">3. 좌석별 공개 주장</h2>
        <p className="text-xs text-faded">
          모든 좌석이 빠짐없이 무언가를 주장해야 합니다. 주정뱅이와 악마는 주장할 수 없습니다
          (주정뱅이는 자기가 주민이라 믿으므로 그 주민 역할을 주장합니다).
        </p>
        {seats.map((seat) => {
          const claim = claims[seat];
          if (!claim) return null;
          return (
            <div key={seat} className="rounded border border-panel-edge bg-panel p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-base font-bold">{seatName(seat)}</span>
                <select className={field} value={claim.role}
                  onChange={(e) => {
                    const role = e.target.value as RoleId;
                    setClaims((prev) => prev.map((c, i) => (i === seat ? { role, info: [] } : c)));
                    setVerdict({ kind: "idle" });
                  }}>
                  {claimable.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
                {INFO_ROLES.includes(claim.role) && claim.info.length < LIMITS.maxInfoPerClaim && (
                  <button type="button"
                    className="rounded border border-brass/60 px-2 py-1 text-xs text-brass hover:bg-brass/10"
                    onClick={() => {
                      const added = blankInfo(claim.role, Math.min(claim.info.length + 1, nights), playerCount);
                      if (!added) return;
                      setClaims((prev) => prev.map((c, i) => (i === seat ? { ...c, info: [...c.info, added] } : c)));
                      setVerdict({ kind: "idle" });
                    }}>
                    + 정보 추가
                  </button>
                )}
              </div>

              {claim.info.map((inf, idx) => (
                <InfoEditor key={idx} info={inf} seats={seats} nights={nights} pool={pool}
                  onChange={(next) => {
                    setClaims((prev) => prev.map((c, i) =>
                      i === seat ? { ...c, info: c.info.map((x, j) => (j === idx ? next : x)) } : c));
                    setVerdict({ kind: "idle" });
                  }}
                  onRemove={() => {
                    setClaims((prev) => prev.map((c, i) =>
                      i === seat ? { ...c, info: c.info.filter((_, j) => j !== idx) } : c));
                    setVerdict({ kind: "idle" });
                  }} />
              ))}
            </div>
          );
        })}
      </section>

      {/* ── 사건 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">4. 사건</h2>
        <p className="text-xs text-faded">처형은 낮에, 밤 사망은 밤 2 이후에 일어납니다. 없으면 비워 두세요.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-panel-edge bg-panel p-3">
            <p className="mb-2 text-xs text-faded">처형</p>
            <div className="flex gap-2">
              <select className={field} value={execDay} onChange={(e) => { setExecDay(e.target.value); setVerdict({ kind: "idle" }); }}>
                <option value="">없음</option>
                {Array.from({ length: Math.max(0, nights - 1) }, (_, i) => i + 1)
                  .map((d) => <option key={d} value={d}>낮 {d}</option>)}
              </select>
              <select className={field} value={execSeat} disabled={execDay === ""}
                onChange={(e) => { setExecSeat(Number(e.target.value)); setVerdict({ kind: "idle" }); }}>
                {seats.map((s) => <option key={s} value={s}>{seatName(s)}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded border border-panel-edge bg-panel p-3">
            <p className="mb-2 text-xs text-faded">밤 사망</p>
            <div className="flex gap-2">
              <select className={field} value={deathNight} onChange={(e) => { setDeathNight(e.target.value); setVerdict({ kind: "idle" }); }}>
                <option value="">없음</option>
                {Array.from({ length: Math.max(0, nights - 1) }, (_, i) => i + 2)
                  .map((n) => <option key={n} value={n}>밤 {n}</option>)}
              </select>
              <select className={field} value={deathSeat} disabled={deathNight === ""}
                onChange={(e) => { setDeathSeat(Number(e.target.value)); setVerdict({ kind: "idle" }); }}>
                {seats.map((s) => <option key={s} value={s}>{seatName(s)}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── 정답 배치 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">5. 정답 그리모어</h2>
        <p className="text-xs text-faded">
          좌석별 <strong className="text-parchment">실제</strong> 역할입니다. 악마는 정확히 1명이어야 합니다.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {seats.map((seat) => (
            <div key={seat} className="flex items-center gap-2">
              <span className="font-display w-5 font-bold">{seatName(seat)}</span>
              <select className={`${field} flex-1`} value={solution[seat] ?? "chef"}
                onChange={(e) => {
                  const role = e.target.value as RoleId;
                  setSolution((prev) => prev.map((r, i) => (i === seat ? role : r)));
                  setVerdict({ kind: "idle" });
                }}>
                {pool.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* ── 검증 ── */}
      <section className="space-y-3 border-t border-panel-edge pt-6">
        <button type="button" onClick={verify}
          className="rounded-md bg-blood px-5 py-2.5 font-bold text-parchment transition-colors hover:bg-blood-deep">
          유일해 검증하고 링크 만들기
        </button>

        {verdict.kind === "error" && (
          <p className="rounded border border-blood/60 bg-panel p-3 text-blood">{verdict.message}</p>
        )}
        {verdict.kind === "unsupported" && (
          <div className="space-y-2 rounded border border-brass/60 bg-panel p-3">
            <p className="font-bold text-brass">솔버가 아직 모르는 역할이 있습니다.</p>
            <ul className="flex flex-wrap gap-1.5">
              {verdict.roles.map((r) => (
                <li key={r} className="rounded-full border border-brass/50 px-2.5 py-0.5 text-xs text-brass">
                  {roleLabel(r)}
                </li>
              ))}
            </ul>
            <p className="max-w-prose text-faded">
              이 역할들의 능력이 솔버에 들어가기 전까지는 답이 하나인지 증명할 수 없어서 링크를 내주지
              않습니다. 능력을 모르는 채로 세면 “유일해”가 거짓이 되기 때문입니다. 지금 입력한 내용은
              그대로 두고 위 역할만 검증되는 역할로 바꾸면 바로 확인할 수 있습니다.
            </p>
          </div>
        )}
        {verdict.kind === "none" && (
          <div className="rounded border border-blood/60 bg-panel p-3">
            <p className="font-bold text-blood">해가 없습니다.</p>
            <p className="mt-1 text-faded">
              주장·사건·정답 배치가 서로 모순됩니다. 정답 배치를 기준으로 각 주장이 실제로 나올 수 있는
              정보인지 하나씩 확인해 보세요.
            </p>
          </div>
        )}
        {verdict.kind === "multiple" && (
          <div className="rounded border border-brass/60 bg-panel p-3">
            <p className="font-bold text-brass">해가 {verdict.count}개입니다 — 아직 문제가 아닙니다.</p>
            <p className="mt-1 text-faded">
              단서가 부족해 답을 하나로 좁힐 수 없습니다. 정보를 더 넣거나 역할 풀을 좁혀 보세요.
            </p>
          </div>
        )}
        {verdict.kind === "unique" && (
          <div className="space-y-2 rounded border border-brass bg-panel p-3">
            <p className="font-bold text-brass">유일해입니다 — 문제로 성립합니다.</p>
            <p className="text-faded">아래 링크를 공유하면 누구나 바로 풀 수 있습니다. 서버에 저장되지 않습니다.</p>
            <textarea readOnly value={verdict.link} rows={3}
              className={`${field} w-full font-mono text-xs`}
              onFocus={(e) => e.currentTarget.select()} />
            <div className="flex flex-wrap gap-2">
              <button type="button"
                className="rounded border border-brass/60 px-3 py-1.5 text-xs text-brass hover:bg-brass/10"
                onClick={() => navigator.clipboard?.writeText(verdict.link)}>
                링크 복사
              </button>
              <a href={verdict.link} target="_blank" rel="noopener noreferrer"
                className="rounded border border-panel-edge px-3 py-1.5 text-xs text-faded hover:text-parchment">
                새 탭에서 풀어 보기
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── 정보 한 건 편집 ──────────────────────────────────────────────

function InfoEditor({
  info, seats, nights, pool, onChange, onRemove,
}: {
  info: DraftInfo;
  seats: Seat[];
  nights: number;
  pool: RoleId[];
  onChange: (next: DraftInfo) => void;
  onRemove: () => void;
}) {
  const d = info.data;
  const set = (data: InfoData) => onChange({ ...info, data });

  const seatSelect = (value: Seat, onPick: (s: Seat) => void, key?: string) => (
    <select key={key} className={field} value={value} onChange={(e) => onPick(Number(e.target.value))}>
      {seats.map((s) => <option key={s} value={s}>{seatName(s)}</option>)}
    </select>
  );

  const roleSelect = (value: RoleId, onPick: (r: RoleId) => void) => (
    <select className={field} value={value} onChange={(e) => onPick(e.target.value as RoleId)}>
      {(ROLE_IDS as readonly RoleId[]).map((r) => <option key={r} value={r}>{ROLES[r].ko}</option>)}
    </select>
  );

  const numberSelect = (value: number, max: number, onPick: (n: number) => void) => (
    <select className={field} value={value} onChange={(e) => onPick(Number(e.target.value))}>
      {Array.from({ length: max + 1 }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );

  const pair = "targets" in d && Array.isArray(d.targets) ? (d.targets as [Seat, Seat]) : null;

  return (
    <div className="mt-2 space-y-1.5 border-l border-panel-edge pl-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={field} value={info.night}
          onChange={(e) => onChange({ ...info, night: Number(e.target.value) })}>
          {Array.from({ length: nights }, (_, i) => i + 1).map((n) => <option key={n} value={n}>밤 {n}</option>)}
        </select>

        {pair && (d.type === "washerwoman" || d.type === "investigator" || d.type === "librarian") && (
          <>
            {seatSelect(pair[0], (s) => set({ ...d, targets: [s, pair[1]] } as InfoData), "a")}
            <span className="text-xs text-faded">또는</span>
            {seatSelect(pair[1], (s) => set({ ...d, targets: [pair[0], s] } as InfoData), "b")}
            <span className="text-xs text-faded">중 하나가</span>
            {roleSelect(("shownRole" in d ? d.shownRole : "chef") as RoleId,
              (r) => set({ ...d, shownRole: r } as InfoData))}
          </>
        )}

        {d.type === "librarian" && (
          <button type="button" className="text-xs text-brass underline"
            onClick={() => set(d.targets === null
              ? { type: "librarian", targets: [seats[0], seats[1]], shownRole: "drunk" }
              : { type: "librarian", targets: null })}>
            {d.targets === null ? "외지인 지목으로" : "‘외지인 없음’으로"}
          </button>
        )}

        {(d.type === "chef" || d.type === "empath" || d.type === "mathematician") && (
          <>
            <span className="text-xs text-faded">숫자</span>
            {numberSelect(d.count, d.type === "empath" ? 2 : seats.length, (n) => set({ ...d, count: n }))}
          </>
        )}

        {d.type === "clockmaker" && (
          <>
            <span className="text-xs text-faded">거리</span>
            {numberSelect(d.steps, seats.length, (n) => set({ type: "clockmaker", steps: n }))}
          </>
        )}

        {d.type === "fortuneteller" && pair && (
          <>
            {seatSelect(pair[0], (s) => set({ ...d, targets: [s, pair[1]] }), "a")}
            {seatSelect(pair[1], (s) => set({ ...d, targets: [pair[0], s] }), "b")}
            <button type="button" className="rounded border border-panel-edge px-2 py-1 text-xs text-parchment"
              onClick={() => set({ ...d, yes: !d.yes })}>
              {d.yes ? "악마 있음" : "악마 없음"}
            </button>
          </>
        )}

        {d.type === "seamstress" && pair && (
          <>
            {seatSelect(pair[0], (s) => set({ ...d, targets: [s, pair[1]] }), "a")}
            {seatSelect(pair[1], (s) => set({ ...d, targets: [pair[0], s] }), "b")}
            <button type="button" className="rounded border border-panel-edge px-2 py-1 text-xs text-parchment"
              onClick={() => set({ ...d, sameTeam: !d.sameTeam })}>
              {d.sameTeam ? "같은 편" : "다른 편"}
            </button>
          </>
        )}

        {d.type === "chambermaid" && pair && (
          <>
            {seatSelect(pair[0], (s) => set({ ...d, targets: [s, pair[1]] }), "a")}
            {seatSelect(pair[1], (s) => set({ ...d, targets: [pair[0], s] }), "b")}
            <span className="text-xs text-faded">중 깨어난 수</span>
            {numberSelect(d.count, 2, (n) => set({ ...d, count: n }))}
          </>
        )}

        {d.type === "undertaker" && (
          <>
            <span className="text-xs text-faded">본 토큰</span>
            {roleSelect(d.shownRole, (r) => set({ type: "undertaker", shownRole: r }))}
          </>
        )}

        {d.type === "ravenkeeper" && (
          <>
            {seatSelect(d.target, (s) => set({ ...d, target: s }))}
            <span className="text-xs text-faded">는</span>
            {roleSelect(d.shownRole, (r) => set({ ...d, shownRole: r }))}
          </>
        )}

        <button type="button" onClick={onRemove}
          className="ml-auto text-xs text-faded hover:text-blood">삭제</button>
      </div>
      <p className="text-xs text-brass">{renderInfo(d)}</p>
      {"shownRole" in d && d.shownRole && !pool.includes(d.shownRole) && (
        <p className="text-xs text-faded">
          참고: {ROLES[d.shownRole].ko}은(는) 역할 풀에 없습니다 — 거짓 정보로는 가능합니다.
        </p>
      )}
    </div>
  );
}
