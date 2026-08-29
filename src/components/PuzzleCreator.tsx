"use client";

// 사설 퍼즐 에디터.
//
// 핵심: 브라우저가 직접 솔버를 돌려 **유일해일 때만 공유 링크를 발급한다.**
// "모든 퍼즐은 유일해가 증명돼야 한다"는 규칙이 사람 검수 없이 사설 문제에도 적용된다.
// 실측상 솔버는 최악(10인·전체 대본·다중 사망)에도 ~150ms라 동기 실행으로 충분하다.

import { useMemo, useState } from "react";
import { ROLES, TEAM_LABELS, roleLabel } from "@/data/roles";
import { LIMITS, encodePuzzle, toPuzzle, type SharedPuzzle } from "@/lib/puzzles/codec";
import { seatName, type Difficulty } from "@/lib/puzzles/schema";
import { solve } from "@/lib/solver/solve";
import {
  ROLE_IDS,
  SOLVER_ROLES,
  SWAPPABLE_ROLES,
  type GameEvent,
  type InfoData,
  type Prop,
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

/**
 * 대본 후보. 실험적 역할은 따로 담아 기본값으로 접어 둔다 — 솔버가 능력을 모르는 데다
 * 수가 많아서 기본 판본 역할과 한 줄로 섞으면 고르기가 어려워진다.
 */
const POOL_BY_TEAM = TEAM_ORDER.map((team) => ({
  team,
  roles: (ROLE_IDS as readonly RoleId[]).filter((r) => ROLES[r].team === team && ROLES[r].edition !== "exp"),
  experimental: (ROLE_IDS as readonly RoleId[]).filter((r) => ROLES[r].team === team && ROLES[r].edition === "exp"),
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

/** 정보를 만들어 내는 역할 = 정보 입력칸이 있는 역할 */
const INFO_ROLES: RoleId[] = [
  "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller",
  "undertaker", "ravenkeeper", "clockmaker", "seamstress", "mathematician", "chambermaid",
  "monk", "exorcist", "dreamer", "oracle", "grandmother", "gambler", "sage",
  "flowergirl", "towncrier", "sailor", "innkeeper", "courtier", "professor", "artist", "savant",
  "snakecharmer", "philosopher",
];

interface DraftInfo {
  night: number;
  data: InfoData;
  /** 이 정보를 받을 당시의 역할 (이발사 교환 이력) — 데이터 타입은 이 역할을 따른다 */
  asRole?: RoleId;
}

interface DraftClaim {
  role: RoleId;
  info: DraftInfo[];
}

type Verdict =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "multiple"; count: number; example: string }
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
    case "monk": return { night: Math.max(2, night), data: { type: "monk", target: 0 } };
    case "exorcist": return { night: Math.max(2, night), data: { type: "exorcist", target: 0 } };
    case "dreamer": return { night, data: { type: "dreamer", target: 0, goodRole: "chef", evilRole: "imp" } };
    case "oracle": return { night: Math.max(2, night), data: { type: "oracle", count: 0 } };
    case "grandmother": return { night: 1, data: { type: "grandmother", target: 0, shownRole: "chef" } };
    case "gambler": return { night: Math.max(2, night), data: { type: "gambler", target: 0, role: "chef" } };
    case "sage": return { night: Math.max(2, night), data: { type: "sage", targets: pair } };
    case "flowergirl": return { night: Math.max(2, night), data: { type: "flowergirl", yes: false } };
    case "towncrier": return { night: Math.max(2, night), data: { type: "towncrier", yes: false } };
    case "sailor": return { night, data: { type: "sailor", target: 0 } };
    case "innkeeper": return { night: Math.max(2, night), data: { type: "innkeeper", targets: pair } };
    case "courtier": return { night, data: { type: "courtier", role: "imp" } };
    case "professor": return { night: Math.max(2, night), data: { type: "professor", target: 0 } };
    case "snakecharmer": return { night, data: { type: "snakecharmer", target: 0 } };
    case "philosopher": return { night, data: { type: "philosopher", role: "empath" } };
    case "artist": return { night, data: { type: "artist", question: { kind: "isDemon", seat: 0 }, yes: false } };
    case "savant":
      return { night, data: { type: "savant", statements: [{ kind: "isEvil", seat: 0 }, { kind: "roleInPlay", role: "drunk" }] } };
    default: return null;
  }
}

// ── 사건 원장: 밤1 → 낮1 → 밤2 → … → 지금 ────────────────────────
//
// 화면과 buildShared가 같은 함수를 쓴다. 여기서 이미 죽은 좌석을 걸러 내므로
// 인원수·밤 수를 줄였다 늘려도 솔버가 거부할 상태를 만들 수 없다.

/** 낮 공개 행동 초안 (day는 행이 안다) */
type DraftDayAction =
  | { type: "slayerShot"; seat: Seat; target: Seat; died: boolean }
  | { type: "nomination"; nominator: Seat; nominee: Seat }
  | { type: "virginTrigger"; nominator: Seat; nominee: Seat };

type LedgerRow =
  | { kind: "night"; index: number; label: string; picked: Seat[]; selectable: boolean[]; alive: number }
  | {
      kind: "day"; index: number; label: string; picked: Seat | null; selectable: boolean[]; alive: number;
      actions: DraftDayAction[]; virginExec: Seat | null; // 처녀 발동이 있으면 그 지명자가 그날의 처형이다
    }
  | { kind: "now"; index: number; label: string; alive: number; actions: DraftDayAction[]; selectable: boolean[] };

/** 죽은 참여자·자기 지명 등 무효 행동을 거르고, 낮의 죽음(총격·처녀 발동)을 반영한다 */
function applyDraftActions(
  raw: DraftDayAction[],
  alive: boolean[],
  playerCount: number,
  allowExecution: boolean,
): { actions: DraftDayAction[]; virginExec: Seat | null } {
  const actions: DraftDayAction[] = [];
  let virginExec: Seat | null = null;
  for (const act of raw) {
    const involved = act.type === "slayerShot" ? [act.seat, act.target] : [act.nominator, act.nominee];
    if (involved.some((s) => s >= playerCount || !alive[s])) continue;
    if (act.type !== "slayerShot" && act.nominator === act.nominee) continue;
    if (act.type === "virginTrigger") {
      if (!allowExecution || virginExec !== null) continue; // 처형(=발동)은 하루 한 번, 마지막 낮엔 불가
      virginExec = act.nominator;
      alive[act.nominator] = false;
    } else if (act.type === "slayerShot" && act.died) {
      alive[act.target] = false;
    }
    actions.push(act);
  }
  return { actions, virginExec };
}

function buildLedger(
  nights: number,
  playerCount: number,
  deaths: Record<number, Seat[]>,
  executions: Record<number, Seat>,
  dayActs: Record<number, DraftDayAction[]>,
): LedgerRow[] {
  const rows: LedgerRow[] = [];
  const alive = Array.from({ length: playerCount }, () => true);
  const count = () => alive.filter(Boolean).length;

  for (let n = 1; n <= nights; n++) {
    const selectable = [...alive];
    // 밤 1엔 악마가 죽이지 않는다 — 입력 자체를 받지 않는다
    const picked = n === 1 ? [] : (deaths[n] ?? []).filter((s) => s < playerCount && alive[s]);
    for (const s of picked) alive[s] = false;
    rows.push({ kind: "night", index: n, label: `밤 ${n}`, picked, selectable, alive: count() });

    if (n === nights) break;
    const daySelectable = [...alive];
    const { actions, virginExec } = applyDraftActions(dayActs[n] ?? [], alive, playerCount, true);
    // 처녀 발동이 있으면 그것이 그날의 처형 — 별도 처형은 무시된다
    const ex = virginExec !== null ? undefined : executions[n];
    const picked2 = ex !== undefined && ex < playerCount && alive[ex] ? ex : null;
    if (picked2 !== null) alive[picked2] = false;
    rows.push({
      kind: "day", index: n, label: `낮 ${n}`, picked: picked2, selectable: daySelectable,
      alive: count(), actions, virginExec,
    });
  }
  const nowSelectable = [...alive];
  // 현재 낮: 처형 전이므로 처녀 발동(=처형)은 없고, 총격·지명만 가능하다
  const { actions } = applyDraftActions(dayActs[nights] ?? [], alive, playerCount, false);
  rows.push({ kind: "now", index: nights, label: `낮 ${nights}`, alive: count(), actions, selectable: nowSelectable });
  return rows;
}

function ledgerEvents(rows: LedgerRow[]): GameEvent[] {
  const events: GameEvent[] = [];
  for (const row of rows) {
    if (row.kind === "night") {
      for (const seat of row.picked) events.push({ type: "death", night: row.index, seat });
      continue;
    }
    for (const act of row.actions) events.push({ ...act, day: row.index });
    if (row.kind === "day" && row.picked !== null) {
      events.push({ type: "execution", day: row.index, seat: row.picked });
    }
  }
  return events;
}

/** 낮 행동 한 건이 문제에 실릴 문장. 풀이 화면의 타임라인과 같은 말을 쓴다. */
function actionLine(act: DraftDayAction): string {
  if (act.type === "slayerShot") {
    return act.died
      ? `${seatName(act.seat)}가 사냥꾼을 자처하며 ${seatName(act.target)}를 쐈다 — ${seatName(act.target)}가 죽었다!`
      : `${seatName(act.seat)}가 사냥꾼을 자처하며 ${seatName(act.target)}를 쐈지만, 아무 일도 일어나지 않았다.`;
  }
  if (act.type === "nomination") {
    return `${seatName(act.nominator)}가 ${seatName(act.nominee)}를 지명했지만, 아무 일도 일어나지 않았다.`;
  }
  return `${seatName(act.nominator)}가 ${seatName(act.nominee)}를 지명한 순간, ${seatName(act.nominator)}가 그 자리에서 처형됐다!`;
}

/** 원장 한 줄이 문제에 실릴 문장. 풀이 화면의 타임라인과 같은 말을 쓴다. */
function ledgerLine(row: LedgerRow): string {
  if (row.kind === "now") return "지금 — 처형 전, 여기서 추리가 시작된다.";
  if (row.kind === "day") {
    if (row.virginExec !== null) return `처녀 발동 — ${seatName(row.virginExec)}가 처형으로 죽었다.`;
    return row.picked === null ? "처형이 없었다." : `마을은 ${seatName(row.picked)}를 처형했다.`;
  }
  if (row.index === 1) return "첫 밤 — 악마는 죽이지 않는다.";
  return row.picked.length === 0
    ? "아무도 죽지 않았다."
    : `${row.picked.map(seatName).join(", ")}가 죽은 채 발견됐다.`;
}

const CHIP_BASE =
  "rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";
const CHIP_OFF = "border-panel-edge text-faded hover:text-parchment";
const CHIP_DEAD = "cursor-not-allowed border-panel-edge/50 text-faded/40 line-through";
const CHIP_DEATH_ON = "border-blood bg-blood/20 text-parchment";
const CHIP_EXEC_ON = "border-brass bg-brass/15 text-parchment";
const CHIP_NONE_ON = "border-faded/70 text-parchment";

/** 킬 실패를 설명할 수 있는 역할들 — 솔버의 임프 킬 부재 분기와 같은 목록 (timeline.ts) */
const KILL_FAIL_ROLES: RoleId[] = ["poisoner", "soldier", "monk", "exorcist", "tealady", "fool", "minstrel", "sailor", "innkeeper", "courtier"];
/** 한 밤 2인 이상 사망을 설명할 수 있는 역할들 */
const MULTI_KILL_ROLES: RoleId[] = ["assassin", "godfather", "grandmother", "gambler", "tinker"];

const field = "rounded border border-panel-edge bg-ink px-2 py-1 text-sm text-parchment";
const label = "block text-xs text-faded";

/** 낮 공개 행동(총격·지명·처녀 발동) 목록 + 추가 폼. day 행과 now 행이 함께 쓴다 */
function DayActionEditor({
  row,
  onAdd,
  onRemove,
}: {
  row: Extract<LedgerRow, { kind: "day" | "now" }>;
  onAdd: (act: DraftDayAction) => void;
  onRemove: (act: DraftDayAction) => void;
}) {
  const [type, setType] = useState<DraftDayAction["type"]>("nomination");
  const [actor, setActor] = useState<Seat>(0);
  const [target, setTarget] = useState<Seat>(1);
  const [died, setDied] = useState(false);
  const aliveSeats = row.selectable
    .map((ok, s) => (ok ? s : null))
    .filter((s): s is Seat => s !== null);
  const canAdd =
    aliveSeats.includes(actor) && aliveSeats.includes(target) && (type === "slayerShot" || actor !== target);

  function add() {
    if (!canAdd) return;
    if (type === "slayerShot") onAdd({ type, seat: actor, target, died });
    else onAdd({ type, nominator: actor, nominee: target });
  }

  return (
    <div className="space-y-1">
      {row.actions.map((act, i) => (
        <p key={i} className="flex items-baseline justify-between gap-2 text-xs text-parchment">
          <span>{actionLine(act)}</span>
          <button type="button" onClick={() => onRemove(act)} className="shrink-0 text-faded underline hover:text-blood">
            삭제
          </button>
        </p>
      ))}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <select
          aria-label="낮 행동 종류"
          className={field}
          value={type}
          onChange={(e) => setType(e.target.value as DraftDayAction["type"])}
        >
          <option value="nomination">지명 (아무 일 없음)</option>
          {row.kind === "day" && <option value="virginTrigger">처녀 발동 (지명자 즉시 처형)</option>}
          <option value="slayerShot">사냥꾼 총격</option>
        </select>
        <select aria-label={type === "slayerShot" ? "총격자" : "지명자"} className={field} value={actor} onChange={(e) => setActor(Number(e.target.value))}>
          {aliveSeats.map((s) => (
            <option key={s} value={s}>{seatName(s)}</option>
          ))}
        </select>
        <span className="text-faded">→</span>
        <select aria-label="대상" className={field} value={target} onChange={(e) => setTarget(Number(e.target.value))}>
          {aliveSeats.map((s) => (
            <option key={s} value={s}>{seatName(s)}</option>
          ))}
        </select>
        {type === "slayerShot" && (
          <select aria-label="총격 결과" className={field} value={died ? "died" : "missed"} onChange={(e) => setDied(e.target.value === "died")}>
            <option value="missed">불발 — 아무 일 없음</option>
            <option value="died">명중 — 대상 사망</option>
          </select>
        )}
        <button
          type="button"
          disabled={!canAdd}
          onClick={add}
          className={`${CHIP_BASE} ${canAdd ? CHIP_OFF : CHIP_DEAD}`}
        >
          낮 행동 추가
        </button>
      </div>
    </div>
  );
}

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
  const [deaths, setDeaths] = useState<Record<number, Seat[]>>({});
  const [executions, setExecutions] = useState<Record<number, Seat>>({});
  const [dayActs, setDayActs] = useState<Record<number, DraftDayAction[]>>({});
  const [votes, setVotes] = useState<Record<number, Seat[]>>({});
  const [verdict, setVerdict] = useState<Verdict>({ kind: "idle" });
  const [showExperimental, setShowExperimental] = useState(false);

  const seats = useMemo(() => Array.from({ length: playerCount }, (_, i) => i), [playerCount]);
  const ledger = useMemo(
    () => buildLedger(nights, playerCount, deaths, executions, dayActs),
    [nights, playerCount, deaths, executions, dayActs],
  );
  /** 킬 실패(아무도 안 죽은 밤)를 설명할 수 있는 역할이 대본에 있는가 */
  const hasKillFailExplainer = KILL_FAIL_ROLES.some((r) => pool.includes(r));
  /** 한 밤 2인 이상 사망을 설명할 수 있는 역할이 대본에 있는가 */
  const hasMultiKill = MULTI_KILL_ROLES.some((r) => pool.includes(r));
  const minionKinds = pool.filter((r) => ROLES[r].team === "minion").length;
  /** 대본이 공개되므로 좌석 수에 비해 좁으면 그 자체가 답을 좁힌다 */
  const narrowPool = pool.length < playerCount + 4;

  /** 솔버가 능력을 아는 역할 전부 — 검증되는 가장 넓은 대본이다 */
  function fillSolverPool() {
    setPool([...SOLVER_ROLES]);
    setVerdict({ kind: "idle" });
  }

  const claimable = useMemo(() => pool.filter((r) => !UNCLAIMABLE.includes(r)), [pool]);

  function toggleDeath(night: number, seat: Seat) {
    setDeaths((prev) => {
      const cur = prev[night] ?? [];
      const next = cur.includes(seat) ? cur.filter((s) => s !== seat) : [...cur, seat].sort((a, b) => a - b);
      return { ...prev, [night]: next };
    });
    setVerdict({ kind: "idle" });
  }

  function clearNight(night: number) {
    setDeaths((prev) => ({ ...prev, [night]: [] }));
    setVerdict({ kind: "idle" });
  }

  function pickExecution(day: number, seat: Seat | null) {
    setExecutions((prev) => {
      const next = { ...prev };
      if (seat === null) delete next[day];
      else next[day] = seat;
      return next;
    });
    setVerdict({ kind: "idle" });
  }

  function addDayAction(day: number, act: DraftDayAction) {
    setDayActs((prev) => ({ ...prev, [day]: [...(prev[day] ?? []), act] }));
    setVerdict({ kind: "idle" });
  }

  /** 화면에 보이는(=유효한) 행동 목록 기준 인덱스로 지운다 */
  function removeDayAction(day: number, act: DraftDayAction) {
    setDayActs((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((a) => a !== act) }));
    setVerdict({ kind: "idle" });
  }

  /** 투표 기록 토글 — 유령 투표가 있어 죽은 좌석도 기록될 수 있다 */
  function toggleVote(day: number, seat: Seat) {
    setVotes((prev) => {
      const cur = prev[day] ?? [];
      const next = cur.includes(seat) ? cur.filter((s) => s !== seat) : [...cur, seat].sort((a, b) => a - b);
      return { ...prev, [day]: next };
    });
    setVerdict({ kind: "idle" });
  }

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
    const events: GameEvent[] = [
      ...ledgerEvents(ledger),
      ...Object.entries(votes).flatMap(([day, vs]) =>
        Number(day) <= nights
          ? vs.filter((s) => s < playerCount).map((seat) => ({ type: "vote" as const, day: Number(day), seat }))
          : [],
      ),
    ];

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
      // 반례를 그대로 보여준다 — 작성자가 어디서 새는지 찾는 가장 빠른 길이다
      const intended = shared.solution.join(",");
      const intendedDemon = shared.currentDemonSeat ?? shared.solution.findIndex((r) => ROLES[r].team === "demon");
      const other = worlds.find((w) => w.assignment.join(",") !== intended || w.currentDemonSeat !== intendedDemon) ?? worlds[0];
      setVerdict({
        kind: "multiple",
        count: worlds.length,
        example:
          other.assignment.map((r, i) => `${seatName(i)}=${ROLES[r].ko}`).join(", ") +
          ` (현재 악마: ${seatName(other.currentDemonSeat)})`,
      });
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
        <h2 className="font-display text-lg font-bold">2. 대본 (역할 풀)</h2>
        <p className="text-xs text-faded">
          이 문제에 등장할 수 있는 역할이고, <strong className="text-parchment">푸는 사람에게 그대로 공개됩니다.</strong>{" "}
          실제 게임의 대본처럼 인원수보다 넉넉하게 담으세요 — 정답은 이 중 {playerCount}종만 씁니다.
          악마는 최소 1종 넣어야 합니다.
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <span className={narrowPool ? "text-brass" : "text-faded"}>
            선택 <strong className="tabular-nums text-parchment">{pool.length}</strong>종 · 좌석{" "}
            <strong className="tabular-nums text-parchment">{playerCount}</strong>명
          </span>
          <button
            type="button"
            onClick={fillSolverPool}
            className="rounded border border-brass/60 px-2 py-1 text-brass hover:bg-brass/10"
          >
            검증되는 {SOLVER_ROLES.length}종 모두 담기
          </button>
          <button
            type="button"
            onClick={() => setShowExperimental((v) => !v)}
            aria-pressed={showExperimental}
            className="rounded border border-panel-edge px-2 py-1 text-faded hover:text-parchment"
          >
            실험적 역할 {showExperimental ? "숨기기" : "보기"}
          </button>
        </div>
        {narrowPool && (
          <p className="text-xs text-brass">
            대본이 좁습니다. {playerCount}자리에 {pool.length}종이면 어떤 역할이 쓰였는지 거의 다
            드러나서, 공개된 대본만 보고도 답이 좁혀집니다.
          </p>
        )}
        {minionKinds === 1 && (
          <p className="text-xs text-brass">
            하수인이 한 종뿐입니다 — 대본이 공개되므로 하수인의 정체를 알려주는 셈이 됩니다.
          </p>
        )}

        <p className="text-xs text-faded">
          <span className="mr-1.5 inline-block rounded-full border border-dashed border-faded px-2 py-0.5 align-middle text-[11px]">
            점선
          </span>
          은 솔버가 아직 능력을 모르는 역할입니다. 풀에 넣어도 되지만, 그 역할이 좌석에 배정되면
          유일해 검증과 공유 링크가 나오지 않습니다.
        </p>

        <p className="max-w-prose rounded border border-brass/50 bg-panel p-3 text-xs text-brass">
          <strong>실험적 역할</strong>을 선택하시면 유일해 검증이 되지 않아 미검증 태그로 퀴즈가
          등록되게 됩니다. 실험적 역할은 공식 알마낙에서 능력이 추후 변경될 수 있습니다.
          <span className="mt-1 block text-faded">
            미검증 등록 경로는 준비 중입니다 — 지금은 실험적 역할이 좌석에 배정되면 공유 링크가
            나오지 않습니다.
          </span>
        </p>

        <div className="space-y-3" role="group" aria-label="역할 풀">
          {POOL_BY_TEAM.map(({ team, roles: base, experimental }) => {
            // 접어 둔 상태에서도 이미 고른 실험적 역할은 남겨 둔다 — 안 보이는데 풀에 있으면 뺄 수가 없다.
            const roles = [
              ...base,
              ...(showExperimental ? experimental : experimental.filter((r) => pool.includes(r))),
            ];
            const picked = roles.filter((r) => pool.includes(r)).length;
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
                  {roles.map((r) => {
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

      {/* ── 사건 원장 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">4. 밤과 낮에 일어난 일</h2>
        <p className="text-xs text-faded">
          경과한 밤을 늘리면 칸도 따라 늘어납니다.{" "}
          <strong className="text-parchment">아무 일도 없던 밤과 낮 역시 하나의 단서입니다</strong> — 비워 두면
          “아무도 죽지 않았다”, “처형이 없었다”로 문제에 그대로 실립니다. 밤에는 여러 명을 고를 수 있습니다.
          낮에는 공개 행동(지명·처녀 발동·사냥꾼 총격)을 추가할 수 있고, 처녀 발동이 있는 낮은 그
          지명자가 처형으로 죽어 별도 처형을 고를 수 없습니다.
        </p>

        <ol className="overflow-hidden rounded border border-panel-edge bg-panel">
          {ledger.map((row, i) => {
            const last = i === ledger.length - 1;
            const marker =
              row.kind === "now"
                ? "h-2.5 w-2.5 rounded-full border-2 border-brass"
                : row.kind === "night"
                  ? `h-2 w-2 rounded-full ${row.picked.length > 0 ? "bg-blood" : "border border-panel-edge bg-panel"}`
                  : `h-2 w-2 rotate-45 ${row.picked !== null ? "bg-brass" : "border border-panel-edge bg-panel"}`;
            return (
              <li
                key={row.kind === "now" ? "now" : `${row.kind}-${row.index}`}
                className={`flex gap-2 px-3 py-3 ${i > 0 ? "border-t border-panel-edge/60" : ""} ${
                  row.kind === "day" ? "bg-ink/40" : ""
                }`}
              >
                <span
                  className={`w-10 shrink-0 pt-px text-right font-display text-xs font-bold ${
                    row.kind === "now" ? "text-brass" : "text-faded"
                  }`}
                >
                  {row.label}
                </span>
                <span aria-hidden className="flex w-2 shrink-0 flex-col items-center pt-1.5">
                  <span className={marker} />
                  {!last && <span className="mt-1 w-px flex-1 bg-panel-edge" />}
                </span>

                <div className="min-w-0 flex-1 space-y-1.5">
                  {row.kind === "night" && row.index > 1 && (
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`밤 ${row.index}에 죽은 좌석`}>
                      <button
                        type="button"
                        aria-pressed={row.picked.length === 0}
                        onClick={() => clearNight(row.index)}
                        className={`${CHIP_BASE} ${row.picked.length === 0 ? CHIP_NONE_ON : CHIP_OFF}`}
                      >
                        없음
                      </button>
                      {seats.map((seat) => {
                        const on = row.picked.includes(seat);
                        const dead = !row.selectable[seat];
                        return (
                          <button
                            key={seat}
                            type="button"
                            disabled={dead}
                            aria-pressed={on}
                            aria-label={dead ? `${seatName(seat)} — 이미 사망` : seatName(seat)}
                            onClick={() => toggleDeath(row.index, seat)}
                            className={`${CHIP_BASE} ${dead ? CHIP_DEAD : on ? CHIP_DEATH_ON : CHIP_OFF}`}
                          >
                            {seatName(seat)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {row.kind === "day" && row.virginExec === null && (
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`낮 ${row.index}에 처형된 좌석`}>
                      <button
                        type="button"
                        aria-pressed={row.picked === null}
                        onClick={() => pickExecution(row.index, null)}
                        className={`${CHIP_BASE} ${row.picked === null ? CHIP_NONE_ON : CHIP_OFF}`}
                      >
                        없음
                      </button>
                      {seats.map((seat) => {
                        const on = row.picked === seat;
                        const dead = !row.selectable[seat];
                        return (
                          <button
                            key={seat}
                            type="button"
                            disabled={dead}
                            aria-pressed={on}
                            aria-label={dead ? `${seatName(seat)} — 이미 사망` : seatName(seat)}
                            onClick={() => pickExecution(row.index, on ? null : seat)}
                            className={`${CHIP_BASE} ${dead ? CHIP_DEAD : on ? CHIP_EXEC_ON : CHIP_OFF}`}
                          >
                            {seatName(seat)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {(row.kind === "day" || row.kind === "now") && (
                    <DayActionEditor
                      row={row}
                      onAdd={(act) => addDayAction(row.index, act)}
                      onRemove={(act) => removeDayAction(row.index, act)}
                    />
                  )}

                  {(row.kind === "day" || row.kind === "now") && pool.includes("flowergirl") && (
                    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`낮 ${row.index}에 투표한 좌석`}>
                      <span className="text-[11px] text-faded">투표 기록 (죽은 좌석도 유령 투표 가능)</span>
                      {seats.map((seat) => {
                        const on = (votes[row.index] ?? []).includes(seat);
                        return (
                          <button
                            key={seat}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleVote(row.index, seat)}
                            className={`${CHIP_BASE} ${on ? CHIP_EXEC_ON : CHIP_OFF}`}
                          >
                            {seatName(seat)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
                    <span className={row.kind === "now" ? "text-parchment" : "text-brass"}>{ledgerLine(row)}</span>
                    <span className="tabular-nums text-faded">생존 {row.alive}명</span>
                  </p>

                  {row.kind === "night" && row.picked.length > 1 && !hasMultiKill && (
                    <p className="text-[11px] text-blood">
                      한 밤에 두 명 이상이 죽으려면{" "}
                      {MULTI_KILL_ROLES.map(roleLabel).join("·")} 중 하나가 대본에 있어야 합니다 —
                      지금 대본으로는 “해가 없습니다”가 나옵니다.
                    </p>
                  )}
                  {row.kind === "night" && row.index > 1 && row.picked.length === 0 && !hasKillFailExplainer && (
                    <p className="text-[11px] text-faded">
                      악마의 킬이 실패하려면 {KILL_FAIL_ROLES.map(roleLabel).join("·")} 중 하나가
                      대본에 있어야 합니다 — 지금 대본에 없습니다.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── 정답 배치 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">5. 정답 그리모어</h2>
        <p className="text-xs text-faded">
          좌석별 <strong className="text-parchment">실제</strong> 역할입니다. 대본 {pool.length}종 중
          이 {playerCount}자리에 쓰인 것만 고릅니다 — 나머지는 쓰이지 않은 채 대본에만 남습니다.
          악마는 정확히 1명이어야 합니다.
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
              단서가 부족해 답을 하나로 좁힐 수 없습니다. 예컨대 입력한 정답 말고 이 배치도 모든
              주장·사건과 정합합니다:
            </p>
            <p className="mt-2 rounded bg-ink/60 px-3 py-2 font-mono text-xs text-parchment">{verdict.example}</p>
            <p className="mt-2 text-faded">
              두 배치를 가르는 정보를 더 넣거나, 사건을 추가해 보세요. 역할 풀 좁히기는 대본이 공개되는
              만큼 마지막 수단입니다.
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

  const roleSelect = (value: RoleId, onPick: (r: RoleId) => void, teams?: Team[]) => (
    <select className={field} value={value} onChange={(e) => onPick(e.target.value as RoleId)}>
      {(ROLE_IDS as readonly RoleId[])
        .filter((r) => !teams || teams.includes(ROLES[r].team))
        .map((r) => <option key={r} value={r}>{ROLES[r].ko}</option>)}
    </select>
  );

  const numberSelect = (value: number, max: number, onPick: (n: number) => void) => (
    <select className={field} value={value} onChange={(e) => onPick(Number(e.target.value))}>
      {Array.from({ length: max + 1 }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );

  const pair = "targets" in d && Array.isArray(d.targets) ? (d.targets as [Seat, Seat]) : null;

  /** 구조화 명제 편집 (화가 질문·학자 진술) */
  const propEditor = (p: Prop, onPick: (next: Prop) => void, key: string) => (
    <span key={key} className="inline-flex flex-wrap items-center gap-1">
      <select
        className={field}
        value={p.kind}
        onChange={(e) => {
          const kind = e.target.value as Prop["kind"];
          if (kind === "isDemon" || kind === "isEvil") onPick({ kind, seat: "seat" in p ? p.seat : 0 });
          else if (kind === "isRole") onPick({ kind, seat: "seat" in p ? p.seat : 0, role: "role" in p ? p.role : "imp" });
          else onPick({ kind: "roleInPlay", role: "role" in p ? p.role : "imp" });
        }}
      >
        <option value="isDemon">~는 악마다</option>
        <option value="isEvil">~는 악하다</option>
        <option value="isRole">~는 특정 역할이다</option>
        <option value="roleInPlay">역할이 판에 있다</option>
      </select>
      {(p.kind === "isDemon" || p.kind === "isEvil" || p.kind === "isRole") &&
        seatSelect(p.seat, (s) => onPick({ ...p, seat: s }))}
      {(p.kind === "isRole" || p.kind === "roleInPlay") &&
        roleSelect(p.role, (r) => onPick({ ...p, role: r }))}
    </span>
  );

  return (
    <div className="mt-2 space-y-1.5 border-l border-panel-edge pl-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={field} value={info.night}
          onChange={(e) => onChange({ ...info, night: Number(e.target.value) })}>
          {Array.from({ length: nights }, (_, i) => i + 1).map((n) => <option key={n} value={n}>밤 {n}</option>)}
        </select>
        {pool.includes("barber") && (
          <select
            className={field}
            aria-label="당시 역할 (이발사 교환 이력)"
            value={info.asRole ?? ""}
            onChange={(e) => {
              const r = e.target.value as RoleId | "";
              if (r === "") {
                onChange({ night: info.night, data: info.data });
              } else {
                // 데이터 타입은 당시 역할을 따른다 — 그 역할의 기본 정보로 교체
                const blank = blankInfo(r, info.night, seats.length);
                if (blank) onChange({ night: info.night, data: blank.data, asRole: r });
              }
            }}
          >
            <option value="">현재 역할로서</option>
            {SWAPPABLE_ROLES.filter((r) => pool.includes(r)).map((r) => (
              <option key={r} value={r}>당시 {ROLES[r].ko}로서</option>
            ))}
          </select>
        )}

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

        {(d.type === "monk" || d.type === "exorcist" || d.type === "sailor" || d.type === "professor" || d.type === "snakecharmer") && (
          <>
            {seatSelect(d.target, (s) => set({ ...d, target: s }))}
            <span className="text-xs text-faded">
              {d.type === "monk" ? "를 보호"
                : d.type === "exorcist" ? "를 지목"
                : d.type === "sailor" ? "를 선택 (나 또는 그가 취한다)"
                : d.type === "professor" ? "의 시신을 선택 (마을 사람이면 부활)"
                : "를 지목 (악마라면 역할·진영 교환)"}
            </span>
          </>
        )}

        {d.type === "innkeeper" && (
          <>
            {seatSelect(d.targets[0], (a) => set({ type: "innkeeper", targets: [a, d.targets[1]] }), "a")}
            {seatSelect(d.targets[1], (b) => set({ type: "innkeeper", targets: [d.targets[0], b] }), "b")}
            <span className="text-xs text-faded">를 보호 (하나가 취한다)</span>
          </>
        )}

        {d.type === "courtier" && (
          <>
            {roleSelect(d.role, (r) => set({ type: "courtier", role: r }))}
            <span className="text-xs text-faded">이(가) 3일 밤낮 취한다</span>
          </>
        )}

        {d.type === "philosopher" && (
          <>
            {roleSelect(d.role, (r) => set({ type: "philosopher", role: r }), ["townsfolk"])}
            <span className="text-xs text-faded">의 능력을 얻는다 (원주인은 영구 취함)</span>
          </>
        )}

        {d.type === "dreamer" && (
          <>
            {seatSelect(d.target, (s) => set({ ...d, target: s }))}
            <span className="text-xs text-faded">는</span>
            {roleSelect(d.goodRole, (r) => set({ ...d, goodRole: r }), ["townsfolk", "outsider"])}
            <span className="text-xs text-faded">아니면</span>
            {roleSelect(d.evilRole, (r) => set({ ...d, evilRole: r }), ["minion", "demon"])}
          </>
        )}

        {d.type === "oracle" && (
          <>
            <span className="text-xs text-faded">죽은 악인</span>
            {numberSelect(d.count, seats.length, (n) => set({ type: "oracle", count: n }))}
          </>
        )}

        {d.type === "artist" && (
          <>
            <span className="text-xs text-faded">낮에 물었다:</span>
            {propEditor(d.question, (q) => set({ ...d, question: q }), "q")}
            <button type="button" className="rounded border border-panel-edge px-2 py-1 text-xs text-parchment"
              onClick={() => set({ ...d, yes: !d.yes })}>
              {d.yes ? "답: 그렇다" : "답: 아니다"}
            </button>
          </>
        )}

        {d.type === "savant" && (
          <>
            <span className="text-xs text-faded">진술 1:</span>
            {propEditor(d.statements[0], (p) => set({ ...d, statements: [p, d.statements[1]] }), "s1")}
            <span className="text-xs text-faded">진술 2:</span>
            {propEditor(d.statements[1], (p) => set({ ...d, statements: [d.statements[0], p] }), "s2")}
            <span className="text-xs text-faded">(하나는 참, 하나는 거짓)</span>
          </>
        )}

        {(d.type === "flowergirl" || d.type === "towncrier") && (
          <button type="button" className="rounded border border-panel-edge px-2 py-1 text-xs text-parchment"
            onClick={() => set({ ...d, yes: !d.yes })}>
            {d.type === "flowergirl"
              ? (d.yes ? "어제 악마가 투표했다" : "어제 악마는 투표하지 않았다")
              : (d.yes ? "어제 하수인이 지명했다" : "어제 하수인은 지명하지 않았다")}
          </button>
        )}

        {d.type === "gambler" && (
          <>
            {seatSelect(d.target, (s) => set({ ...d, target: s }))}
            <span className="text-xs text-faded">를</span>
            {roleSelect(d.role, (r) => set({ ...d, role: r }))}
            <span className="text-xs text-faded">로 추측</span>
          </>
        )}

        {d.type === "sage" && (
          <>
            <span className="text-xs text-faded">죽는 순간:</span>
            {seatSelect(d.targets[0], (a) => set({ type: "sage", targets: [a, d.targets[1]] }), "a")}
            {seatSelect(d.targets[1], (b) => set({ type: "sage", targets: [d.targets[0], b] }), "b")}
            <span className="text-xs text-faded">중 하나가 악마</span>
          </>
        )}

        {d.type === "grandmother" && (
          <>
            <span className="text-xs text-faded">손주</span>
            {seatSelect(d.target, (s) => set({ ...d, target: s }))}
            <span className="text-xs text-faded">=</span>
            {roleSelect(d.shownRole, (r) => set({ ...d, shownRole: r }), ["townsfolk", "outsider"])}
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
