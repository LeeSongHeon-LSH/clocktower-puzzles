// 사설 퍼즐 ↔ 공유 링크 코덱.
//
// 사설 퍼즐은 서버에 저장하지 않는다. 문제 전체를 압축해 URL 프래그먼트에 담고,
// 링크를 받은 사람의 브라우저가 그것을 풀어 그대로 푼다. 그래서 업로드 엔드포인트도,
// 저장소도, 스팸 대응도 필요 없다.
//
// 프래그먼트(#)를 쓰는 이유: 서버로 전송되지 않아 정적 배포·CDN 캐싱이 그대로 유지된다.
//
// decode 입력은 **신뢰할 수 없는 외부 입력**이다. 반드시 validate를 거친다.

import { ROLE_IDS, type Claim, type ClaimInfo, type GameEvent, type InfoData, type RoleId, type Seat } from "@/lib/solver/types";
import type { Difficulty, Puzzle, PuzzleEdition, PuzzleQuestion } from "./schema";

/** 링크 형식 버전. 형식이 바뀌면 올리고, 옛 링크는 안내 문구를 띄운다. */
export const SHARE_VERSION = 1;

export const LIMITS = {
  /** 솔버가 지원하는 인원수 */
  minPlayers: 5,
  maxPlayers: 10,
  maxNights: 5,
  maxTitle: 60,
  maxAuthor: 20,
  maxText: 300,
  maxHints: 2,
  maxWalkthrough: 12,
  maxQuestions: 5,
  maxInfoPerClaim: 5,
} as const;

/** 공유 링크에 실리는 퍼즐. 공식 퍼즐과 달리 해설·힌트는 선택이다. */
export interface SharedPuzzle {
  title: string;
  /** 작성자 별명 (선택) */
  author?: string;
  edition: PuzzleEdition;
  difficulty: Difficulty;
  playerCount: number;
  rolePool: RoleId[];
  nights: number;
  claims: Claim[];
  events: GameEvent[];
  questions: PuzzleQuestion[];
  solution: RoleId[];
  currentDemonSeat?: Seat;
  intro?: string;
  hints?: string[];
  walkthrough?: string[];
}

// ── 인코딩 ───────────────────────────────────────────────────────

async function squeeze(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unsqueeze(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** 퍼즐 → 링크 프래그먼트 문자열 */
export async function encodePuzzle(p: SharedPuzzle): Promise<string> {
  const payload = JSON.stringify({ v: SHARE_VERSION, p });
  return toBase64Url(await squeeze(payload));
}

/** 링크 프래그먼트 → 퍼즐. 형식이 틀리면 사람이 읽을 수 있는 오류를 던진다. */
export async function decodePuzzle(fragment: string): Promise<SharedPuzzle> {
  let json: string;
  try {
    json = await unsqueeze(fromBase64Url(fragment));
  } catch {
    throw new Error("링크가 손상됐습니다. 주소가 잘리지 않았는지 확인해 주세요.");
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(json);
  } catch {
    throw new Error("링크 내용을 읽을 수 없습니다.");
  }

  if (!isRecord(envelope)) throw new Error("링크 내용을 읽을 수 없습니다.");
  if (envelope.v !== SHARE_VERSION) {
    throw new Error(`이 링크는 다른 버전(v${String(envelope.v)})으로 만들어졌습니다. 만든 사람에게 새 링크를 요청하세요.`);
  }
  return validateShared(envelope.p);
}

// ── 검증 ─────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, max: number, field: string, required = true): string | undefined {
  if (v === undefined || v === null) {
    if (required) throw new Error(`${field}이(가) 없습니다.`);
    return undefined;
  }
  if (typeof v !== "string") throw new Error(`${field} 형식이 잘못됐습니다.`);
  const trimmed = v.trim();
  if (required && trimmed.length === 0) throw new Error(`${field}이(가) 비어 있습니다.`);
  if (trimmed.length > max) throw new Error(`${field}이(가) 너무 깁니다 (최대 ${max}자).`);
  return trimmed;
}

function int(v: unknown, min: number, max: number, field: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) {
    throw new Error(`${field} 값이 잘못됐습니다 (${min}~${max} 정수).`);
  }
  return v;
}

function roleId(v: unknown, field: string): RoleId {
  if (typeof v !== "string" || !(ROLE_IDS as readonly string[]).includes(v)) {
    throw new Error(`${field}: 알 수 없는 역할입니다.`);
  }
  return v as RoleId;
}

function strList(v: unknown, maxItems: number, field: string): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new Error(`${field} 형식이 잘못됐습니다.`);
  if (v.length > maxItems) throw new Error(`${field}이(가) 너무 많습니다 (최대 ${maxItems}개).`);
  return v.map((x, i) => str(x, LIMITS.maxText, `${field} ${i + 1}번`)!);
}

function seatPair(v: unknown, players: number, field: string): [Seat, Seat] {
  if (!Array.isArray(v) || v.length !== 2) throw new Error(`${field}: 좌석 2개가 필요합니다.`);
  return [int(v[0], 0, players - 1, `${field} 좌석`), int(v[1], 0, players - 1, `${field} 좌석`)];
}

function validateInfoData(v: unknown, players: number, where: string): InfoData {
  if (!isRecord(v)) throw new Error(`${where}: 정보 형식이 잘못됐습니다.`);
  const t = v.type;
  const count = (max: number) => int(v.count, 0, max, `${where} 숫자`);

  switch (t) {
    case "washerwoman":
    case "investigator":
      return { type: t, targets: seatPair(v.targets, players, where), shownRole: roleId(v.shownRole, where) };
    case "librarian":
      return v.targets === null
        ? { type: "librarian", targets: null }
        : { type: "librarian", targets: seatPair(v.targets, players, where), shownRole: roleId(v.shownRole, where) };
    case "chef":
      return { type: "chef", count: count(players) };
    case "empath":
      return { type: "empath", count: count(2) };
    case "fortuneteller":
      return { type: "fortuneteller", targets: seatPair(v.targets, players, where), yes: v.yes === true };
    case "undertaker":
      return { type: "undertaker", shownRole: roleId(v.shownRole, where) };
    case "ravenkeeper":
      return { type: "ravenkeeper", target: int(v.target, 0, players - 1, `${where} 좌석`), shownRole: roleId(v.shownRole, where) };
    case "clockmaker":
      return { type: "clockmaker", steps: int(v.steps, 0, players, `${where} 거리`) };
    case "seamstress":
      return { type: "seamstress", targets: seatPair(v.targets, players, where), sameTeam: v.sameTeam === true };
    case "juggler": {
      if (!Array.isArray(v.guesses) || v.guesses.length > 5) throw new Error(`${where}: 추측은 최대 5개입니다.`);
      const guesses = v.guesses.map((g, i) => {
        if (!isRecord(g)) throw new Error(`${where} 추측 ${i + 1}`);
        return { seat: int(g.seat, 0, players - 1, `${where} 추측 좌석`), role: roleId(g.role, `${where} 추측`) };
      });
      return { type: "juggler", guesses, correct: int(v.correct, 0, guesses.length, `${where} 맞힌 수`) };
    }
    case "mathematician":
      return { type: "mathematician", count: count(players) };
    case "chambermaid":
      return { type: "chambermaid", targets: seatPair(v.targets, players, where), count: count(2) };
    default:
      throw new Error(`${where}: 알 수 없는 정보 종류입니다.`);
  }
}

function validateClaim(v: unknown, players: number, nights: number): Claim {
  if (!isRecord(v)) throw new Error("주장 형식이 잘못됐습니다.");
  const seat = int(v.seat, 0, players - 1, "주장 좌석");
  const role = roleId(v.role, `좌석 ${seat} 주장`);
  if (!Array.isArray(v.info)) throw new Error(`좌석 ${seat}: 정보 목록이 없습니다.`);
  if (v.info.length > LIMITS.maxInfoPerClaim) {
    throw new Error(`좌석 ${seat}: 정보가 너무 많습니다 (최대 ${LIMITS.maxInfoPerClaim}건).`);
  }
  const info: ClaimInfo[] = v.info.map((raw) => {
    if (!isRecord(raw)) throw new Error(`좌석 ${seat}: 정보 형식이 잘못됐습니다.`);
    const night = int(raw.night, 1, nights, `좌석 ${seat} 정보의 밤`);
    return {
      night,
      text: str(raw.text, LIMITS.maxText, `좌석 ${seat} 밤 ${night} 서술`, false),
      data: raw.data === undefined ? undefined : validateInfoData(raw.data, players, `좌석 ${seat} 밤 ${night}`),
    };
  });
  return { seat, role, info };
}

function validateEvent(v: unknown, players: number, nights: number): GameEvent {
  if (!isRecord(v)) throw new Error("사건 형식이 잘못됐습니다.");
  const seat = int(v.seat, 0, players - 1, "사건 좌석");
  if (v.type === "execution") return { type: "execution", day: int(v.day, 1, nights, "처형한 낮"), seat };
  if (v.type === "death") return { type: "death", night: int(v.night, 2, nights, "사망한 밤"), seat };
  throw new Error("알 수 없는 사건 종류입니다.");
}

/** 신뢰할 수 없는 객체 → SharedPuzzle. 실패 시 사람이 읽을 수 있는 오류. */
export function validateShared(v: unknown): SharedPuzzle {
  if (!isRecord(v)) throw new Error("문제 데이터를 읽을 수 없습니다.");

  const playerCount = int(v.playerCount, LIMITS.minPlayers, LIMITS.maxPlayers, "인원수");
  const nights = int(v.nights, 1, LIMITS.maxNights, "밤 수");

  if (!Array.isArray(v.rolePool) || v.rolePool.length === 0) throw new Error("역할 풀이 비어 있습니다.");
  const rolePool = v.rolePool.map((r) => roleId(r, "역할 풀"));
  if (new Set(rolePool).size !== rolePool.length) throw new Error("역할 풀에 중복이 있습니다.");
  if (!rolePool.includes("imp")) throw new Error("역할 풀에 임프가 있어야 합니다.");

  if (!Array.isArray(v.claims) || v.claims.length !== playerCount) {
    throw new Error(`주장이 인원수(${playerCount}명)와 맞지 않습니다.`);
  }
  const claims = v.claims.map((c) => validateClaim(c, playerCount, nights));

  const events = Array.isArray(v.events) ? v.events.map((e) => validateEvent(e, playerCount, nights)) : [];

  if (!Array.isArray(v.questions) || v.questions.length === 0) throw new Error("질문이 없습니다.");
  if (v.questions.length > LIMITS.maxQuestions) throw new Error(`질문이 너무 많습니다 (최대 ${LIMITS.maxQuestions}개).`);
  const questions: PuzzleQuestion[] = v.questions.map((raw, i) => {
    if (!isRecord(raw)) throw new Error(`질문 ${i + 1} 형식이 잘못됐습니다.`);
    const qid = raw.id === "demon" ? ("demon" as const) : roleId(raw.id, `질문 ${i + 1}`);
    if (!Array.isArray(raw.answerSeats) || raw.answerSeats.length === 0) {
      throw new Error(`질문 ${i + 1}: 정답 좌석이 없습니다.`);
    }
    return {
      id: qid,
      text: str(raw.text, LIMITS.maxText, `질문 ${i + 1}`)!,
      answerSeats: raw.answerSeats.map((s) => int(s, 0, playerCount - 1, `질문 ${i + 1} 정답 좌석`)),
    };
  });

  if (!Array.isArray(v.solution) || v.solution.length !== playerCount) {
    throw new Error(`정답 배치가 인원수(${playerCount}명)와 맞지 않습니다.`);
  }
  const solution = v.solution.map((r) => roleId(r, "정답 배치"));
  if (solution.filter((r) => r === "imp").length !== 1) throw new Error("정답 배치에 임프가 정확히 1명이어야 합니다.");
  for (const r of solution) {
    if (!rolePool.includes(r)) throw new Error(`정답 배치의 ${r}이(가) 역할 풀에 없습니다.`);
  }

  return {
    title: str(v.title, LIMITS.maxTitle, "제목")!,
    author: str(v.author, LIMITS.maxAuthor, "별명", false),
    edition: (["tb", "bmr", "sv", "mixed"] as const).includes(v.edition as PuzzleEdition)
      ? (v.edition as PuzzleEdition)
      : "mixed",
    difficulty: (["easy", "normal", "hard"] as const).includes(v.difficulty as Difficulty)
      ? (v.difficulty as Difficulty)
      : "normal",
    playerCount,
    rolePool,
    nights,
    claims,
    events,
    questions,
    solution,
    currentDemonSeat:
      v.currentDemonSeat === undefined ? undefined : int(v.currentDemonSeat, 0, playerCount - 1, "현재 악마 좌석"),
    intro: str(v.intro, LIMITS.maxText, "도입 서술", false),
    hints: strList(v.hints, LIMITS.maxHints, "힌트"),
    walkthrough: strList(v.walkthrough, LIMITS.maxWalkthrough, "해설"),
  };
}

/** 공유 퍼즐 → 풀이 화면이 쓰는 Puzzle 형태 */
export function toPuzzle(shared: SharedPuzzle, id: string): Puzzle {
  return {
    ...shared,
    id,
    source: "community",
    hints: shared.hints ?? [],
    walkthrough: shared.walkthrough ?? [],
  };
}
