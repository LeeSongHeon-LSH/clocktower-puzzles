// 솔버 도메인 타입. 퍼즐 스키마(사람용 필드 포함)는 src/lib/puzzles/schema.ts 참조.

export type Team = "townsfolk" | "outsider" | "minion" | "demon";
export type Edition = "tb" | "bmr" | "sv";

export const ROLE_IDS = [
  // TB 정보 역할
  "washerwoman",
  "librarian",
  "investigator",
  "chef",
  "empath",
  "fortuneteller",
  "undertaker",
  "ravenkeeper",
  // TB 외부인/악역
  "drunk",
  "recluse",
  "poisoner",
  "spy",
  "baron",
  "scarletwoman",
  "imp",
  // SV/BMR (어려움 문제용)
  "clockmaker",
  "seamstress",
  "juggler",
  "mathematician",
  "chambermaid",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

/** 좌석 번호 = players 배열 인덱스 (0-based, 원형 순서) */
export type Seat = number;

// ── 밤 정보 (솔버용 구조화 데이터) ────────────────────────────────
// 각 정보 역할이 "받았다고 주장하는" 정보의 형태.

export type InfoData =
  | { type: "washerwoman"; targets: [Seat, Seat]; shownRole: RoleId }
  | { type: "librarian"; targets: [Seat, Seat]; shownRole: RoleId }
  | { type: "librarian"; targets: null } // "외부인이 없다"
  | { type: "investigator"; targets: [Seat, Seat]; shownRole: RoleId }
  | { type: "chef"; count: number }
  | { type: "empath"; count: number }
  | { type: "fortuneteller"; targets: [Seat, Seat]; yes: boolean }
  | { type: "undertaker"; shownRole: RoleId }
  | { type: "ravenkeeper"; target: Seat; shownRole: RoleId }
  | { type: "clockmaker"; steps: number }
  | { type: "seamstress"; targets: [Seat, Seat]; sameTeam: boolean }
  | { type: "juggler"; guesses: { seat: Seat; role: RoleId }[]; correct: number }
  | { type: "mathematician"; count: number }
  | { type: "chambermaid"; targets: [Seat, Seat]; count: number };

/** 특정 밤에 받았다고 주장하는 정보 한 건 */
export interface ClaimInfo {
  night: number; // 1-based
  text: string; // 사람이 읽는 서술 (UI 표시용)
  data?: InfoData; // 솔버 입력. 정보성 주장엔 필수, 순수 서사엔 생략 가능
}

/** 좌석 하나의 공개 주장: 역할 + 밤 정보들 */
export interface Claim {
  seat: Seat;
  role: RoleId; // 주장하는 역할 (술꾼은 자신이 믿는 마을 사람 역할을 주장)
  info: ClaimInfo[];
}

// ── 이벤트 타임라인 ──────────────────────────────────────────────

export type GameEvent =
  | { type: "execution"; day: number; seat: Seat }
  | { type: "death"; night: number; seat: Seat }; // 밤 사망 (데몬 킬)

// ── 솔버 입력 ────────────────────────────────────────────────────

export interface SolverPuzzle {
  playerCount: number;
  /** 이 퍼즐에 등장할 수 있는 역할 풀 (탐색 공간 통제) */
  rolePool: RoleId[];
  claims: Claim[];
  events: GameEvent[];
  /** 경과한 밤 수. 현재 시점은 nights일차 낮(밤 nights 직후)이다. */
  nights: number;
}

// ── 월드 (탐색 결과) ─────────────────────────────────────────────

/**
 * 하나의 완전한 가설: 좌석별 실제 역할 + 숨은 비결정 변수들.
 * 유일해 판정은 (assignment, currentDemonSeat) 기준으로 한다 —
 * 독살 대상·레드 헤링 등이 달라도 그리모어가 같으면 같은 해로 본다.
 */
export interface World {
  assignment: RoleId[]; // 좌석 → 실제 역할 (술꾼은 "drunk")
  currentDemonSeat: Seat; // 현재(승계 반영) 데몬 좌석
  poisonTargets: (Seat | null)[]; // 밤 n(1-based)의 독살 대상, [0]은 미사용
  redHerring: Seat | null; // 점쟁이 레드 헤링 (점쟁이 있을 때만)
}

/** 유일해 비교용 직렬화 키 */
export function worldKey(w: World): string {
  return w.assignment.join(",") + "|demon:" + w.currentDemonSeat;
}
