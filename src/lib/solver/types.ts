// 솔버 도메인 타입. 퍼즐 스키마(사람용 필드 포함)는 src/lib/puzzles/schema.ts 참조.

export type Team = "townsfolk" | "outsider" | "minion" | "demon";
export type Edition = "tb" | "bmr" | "sv";

// 역할 사전 전체 (3개 기본 판본, 여행자 제외). 표기는 src/data/roles.ts.
export const ROLE_IDS = [
  // ── 점철되는 혼란 (Trouble Brewing) ──
  "washerwoman",
  "librarian",
  "investigator",
  "chef",
  "empath",
  "fortuneteller",
  "undertaker",
  "monk",
  "ravenkeeper",
  "virgin",
  "slayer",
  "soldier",
  "mayor",
  "butler",
  "drunk",
  "recluse",
  "saint",
  "poisoner",
  "spy",
  "scarletwoman",
  "baron",
  "imp",
  // ── 피로 물든 달 (Bad Moon Rising) ──
  "grandmother",
  "sailor",
  "chambermaid",
  "exorcist",
  "innkeeper",
  "gambler",
  "gossip",
  "courtier",
  "professor",
  "minstrel",
  "tealady",
  "pacifist",
  "fool",
  "tinker",
  "moonchild",
  "goon",
  "lunatic",
  "godfather",
  "devilsadvocate",
  "assassin",
  "mastermind",
  "zombuul",
  "pukka",
  "shabaloth",
  "po",
  // ── 화단에 꽃피운 이단 (Sects & Violets) ──
  "clockmaker",
  "dreamer",
  "snakecharmer",
  "mathematician",
  "flowergirl",
  "towncrier",
  "oracle",
  "savant",
  "seamstress",
  "philosopher",
  "artist",
  "juggler",
  "sage",
  "mutant",
  "sweetheart",
  "barber",
  "klutz",
  "eviltwin",
  "witch",
  "cerenovus",
  "pithag",
  "fanggu",
  "vigormortis",
  "nodashii",
  "vortox",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

/**
 * 솔버가 능력을 실제로 모델링하는 역할.
 *
 * ROLE_IDS는 사전 전체(편집기에서 고를 수 있는 역할)이고, 이쪽은 그중 **검증이 성립하는**
 * 부분집합이다. 여기 없는 역할이 배정될 수 있는 자리에 들어가면 solve()가 거부한다 —
 * 모르는 능력을 없는 셈 치고 세면 "유일해"가 거짓이 되기 때문이다 (solve.ts의 validatePuzzle).
 * 능력을 구현할 때마다 여기에 한 줄씩 추가한다.
 */
export const SOLVER_ROLES: readonly RoleId[] = [
  // ── TB ──
  "washerwoman",
  "librarian",
  "investigator",
  "chef",
  "empath",
  "fortuneteller",
  "undertaker",
  "monk", // 보호 행동 주장 → 킬 실패 설명·보호 위반 시 중독 강제 (timeline.ts)
  "ravenkeeper",
  "soldier", // 킬 실패 설명. 밤에 죽었다면 그 밤 중독이 강제된다
  "mayor", // 능력이 진행 중 게임에 관측 가능한 흔적을 남기지 않는다 — 구성 전용.
  //         (킬 튕김은 "임프가 그 좌석을 직접 노렸다"와 관측상 동치라 별도 모델 불요)
  "butler", // 밤마다 깨어난다(주인 지목) — 객실 청소부·수학자 판정에만 영향
  "drunk",
  "recluse",
  "saint", // 처형됐다면 그 밤 중독이 강제된다 (멀쩡한 성자 처형 = 게임 종료)
  "poisoner",
  "spy",
  "baron",
  "scarletwoman",
  "imp",
  // ── BMR ──
  "grandmother", // 밤1 손주 정보 + 손주가 임프에게 죽으면 연쇄 사망
  "exorcist", // 악마 지목 시 그 밤 악마가 깨어나지 못한다
  "godfather", // 외부인 ±1 구성 + 낮에 외부인이 처형돼 죽으면 그 밤 킬
  "assassin", // 1회, 밤에 무조건 킬 (보호 무시) — 한 밤 2사망의 주 설명 수단
  // ── SV ──
  "clockmaker",
  "dreamer",
  "oracle",
  "seamstress",
  "juggler",
  "mathematician",
  "chambermaid",
];

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
  | { type: "chambermaid"; targets: [Seat, Seat]; count: number }
  // 행동 기록 (정보가 아니라 선택의 기록 — 참/거짓 판정 대상이 아니고 제약은 timeline이 소비)
  | { type: "monk"; target: Seat }
  | { type: "exorcist"; target: Seat }
  // 추가 정보 역할
  | { type: "dreamer"; target: Seat; goodRole: RoleId; evilRole: RoleId }
  | { type: "oracle"; count: number }
  | { type: "grandmother"; target: Seat; shownRole: RoleId };

/** 특정 밤에 받았다고 주장하는 정보 한 건 */
export interface ClaimInfo {
  night: number; // 1-based
  /** 사람이 읽는 서술. 생략하면 UI가 data에서 자동 생성한다 (역할명 사전과 항상 동기화) */
  text?: string;
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
