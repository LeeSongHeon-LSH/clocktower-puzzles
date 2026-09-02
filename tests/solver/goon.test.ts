// 2026-09-02 25차 확장: Goon(건달) — 밤별 진영 상태.
// 매밤 자기 능력으로 건달을 고른 첫 사람이 그 밤과 다음 낮 동안 취하고, 건달은 그 사람의
// 진영이 된다. 솔버는 밤마다 '첫 선택자 F'를 분기로 열거하고(취함은 확정 취함 집합으로,
// 진영은 밤별 상태로), 진영을 묻는 판정(초공감자·요리사·찻집 여인 등)을 그 상태에 잇는다.
// 데몬이 건달을 고르면 데몬이 취해 킬이 실패한다 — 조용한 밤의 설명이 하나 늘어난다.
// 지금 악한 건달은 마을 사람을 사칭할 수 있어 숨은 외부인 슬롯으로도 열거된다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { Claim, RoleId, SolverPuzzle } from "@/lib/solver/types";

/** 밤에 플레이어를 고르는 역할이 하나도 없는 8인 대본 — '기록 없는 선택자'를 배제한다 */
const POOL: RoleId[] = [
  "imp", "poisoner", "goon", "chef", "empath", "undertaker",
  "librarian", "washerwoman", "mayor", "investigator",
];

function claims(): Claim[] {
  return [
    { seat: 0, role: "chef", info: [] },
    { seat: 1, role: "empath", info: [] },
    { seat: 2, role: "undertaker", info: [] },
    { seat: 3, role: "goon", info: [] },
    { seat: 4, role: "librarian", info: [] },
    { seat: 5, role: "washerwoman", info: [] },
    { seat: 6, role: "mayor", info: [] },
    { seat: 7, role: "investigator", info: [] },
  ];
}

function puzzle(overrides: Partial<SolverPuzzle> = {}): SolverPuzzle {
  return { playerCount: 8, nights: 2, rolePool: POOL, events: [], claims: claims(), ...overrides };
}

/** 독살범을 첩자로 바꾼 대본 — 그 퍼즐에는 독살·확정 취함 원천이 건달뿐이다 */
function noPoisoner(pool: RoleId[] = POOL): RoleId[] {
  return pool.map((r) => (r === "poisoner" ? "spy" : r));
}

describe("Goon: 데몬이 건달을 고르면 킬이 실패한다", () => {
  it("킬 부재의 유일한 설명이 되어 건달이 악해진다", () => {
    // 밤2에 아무도 죽지 않았다. 군인·수도사·독살범이 없으므로 남은 설명은
    // '데몬이 건달을 골라 취했다'뿐이고, 그러면 건달은 데몬의 진영이 된다.
    const worlds = solve(puzzle({ rolePool: noPoisoner() }));
    expect(worlds.length).toBeGreaterThan(0);
    expect(worlds.every((w) => w.goonEvil === true)).toBe(true);
  });

  it("대조군: 건달이 없으면 그 밤을 설명할 수 없다", () => {
    const pool = noPoisoner().map((r) => (r === "goon" ? "saint" : r));
    const cs = claims();
    cs[3] = { seat: 3, role: "saint", info: [] };
    expect(solve(puzzle({ rolePool: pool, claims: cs }))).toHaveLength(0);
  });
});

describe("Goon: 건달을 죽이려면 앞선 선택자가 있어야 한다", () => {
  it("앞선 선택자가 없으면 데몬이 스스로 취해 죽이지 못한다", () => {
    // 데몬이 건달을 고르는 순간 데몬이 취한다 — 먼저 고른 사람이 없으면 킬이 성립하지 않는다
    const worlds = solve(puzzle({
      rolePool: noPoisoner(),
      events: [{ type: "death", night: 2, seat: 3 }],
    }));
    expect(worlds).toHaveLength(0);
  });

  it("독살범이 먼저 골랐다면 죽일 수 있다", () => {
    const worlds = solve(puzzle({ events: [{ type: "death", night: 2, seat: 3 }] }));
    expect(worlds.some((w) => w.assignment[3] === "goon")).toBe(true);
  });
});

describe("Goon: 기록된 선택자", () => {
  /** 수도사(좌석 6)가 밤2에 건달(좌석 3)을 보호했다고 기록한 대본 */
  function monkPuzzle(pool: RoleId[]): SolverPuzzle {
    const cs = claims();
    cs[6] = { seat: 6, role: "monk", info: [{ night: 2, data: { type: "monk", target: 3 } }] };
    return puzzle({
      rolePool: [...pool.filter((r) => r !== "mayor"), "monk"],
      claims: cs,
      events: [{ type: "death", night: 2, seat: 3 }],
    });
  }

  it("수도사가 건달을 고르면 스스로 취해 보호가 풀린다", () => {
    // 보호 대상이 죽었으니 수도사는 비정상이었어야 한다 — 독살범이 없는 대본에서
    // 그 설명은 '수도사가 건달을 골라 취했다'뿐이다. 수도사는 선하므로 건달도 선을 유지한다.
    const worlds = solve(monkPuzzle(noPoisoner()));
    const hit = worlds.filter((w) => w.assignment[6] === "monk" && w.assignment[3] === "goon");
    expect(hit.length).toBeGreaterThan(0);
    expect(hit.every((w) => w.goonEvil === false)).toBe(true);
  });

  it("대조군: 보호 대상이 건달이 아니면 설명이 없다", () => {
    const pool = noPoisoner().map((r) => (r === "goon" ? "saint" : r));
    const cs = claims();
    cs[3] = { seat: 3, role: "saint", info: [] };
    cs[6] = { seat: 6, role: "monk", info: [{ night: 2, data: { type: "monk", target: 3 } }] };
    const worlds = solve(puzzle({
      rolePool: [...pool.filter((r) => r !== "mayor"), "monk"],
      claims: cs,
      events: [{ type: "death", night: 2, seat: 3 }],
    }));
    expect(worlds.some((w) => w.assignment[6] === "monk")).toBe(false);
  });
});

describe("Goon: 진영이 관측에 미치는 영향", () => {
  it("악해진 건달은 초공감자가 세는 '악'에 들어간다", () => {
    // 좌석 1(초공감자)의 이웃은 좌석 0과 2다. 건달을 좌석 0 자리에 두고 이웃 악 1을 주장한다.
    const cs = claims();
    cs[0] = { seat: 0, role: "goon", info: [] };
    cs[3] = { seat: 3, role: "chef", info: [] };
    cs[1] = { seat: 1, role: "empath", info: [{ night: 2, data: { type: "empath", count: 1 } }] };
    const worlds = solve(puzzle({ rolePool: noPoisoner(), claims: cs }));
    const honest = worlds.filter((w) => w.assignment[0] === "goon" && w.assignment[1] === "empath");
    expect(honest.length).toBeGreaterThan(0);
    // 좌석 0이 건달인 세계에서 이웃 악 1을 만들 수 있는 것은 악해진 건달뿐이다
    expect(honest.every((w) => w.goonEvil === true || w.assignment[2] === "imp" || w.assignment[2] === "spy")).toBe(true);
  });
});

describe("Goon: 숨은 건달", () => {
  it("악해질 길이 없으면 마을 사람을 사칭할 수 없다", () => {
    // 밤2에 데몬 킬이 있었으므로 데몬은 그 밤 건달을 고르지 않았다 —
    // 독살범도 없어 건달이 악해질 방법이 없다 → 사칭 세계가 성립하지 않는다
    const worlds = solve(puzzle({
      rolePool: noPoisoner(),
      events: [{ type: "death", night: 2, seat: 7 }],
    }));
    const cs = claims();
    expect(worlds.some((w) => w.assignment.some((r, i) => r === "goon" && cs[i].role !== "goon"))).toBe(false);
  });

  it("조용한 밤이 있으면 악해질 수 있어 사칭 세계가 생긴다", () => {
    // 밤3이 조용하다 — 데몬이 건달을 골라 취했을 수 있고, 그러면 건달은 악해진다
    const worlds = solve(puzzle({
      nights: 3,
      rolePool: noPoisoner(),
      events: [{ type: "death", night: 2, seat: 7 }],
    }));
    const cs = claims();
    const hidden = worlds.filter((w) => w.assignment.some((r, i) => r === "goon" && cs[i].role !== "goon"));
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.every((w) => w.goonEvil === true)).toBe(true);
  });
});

describe("Goon: 유일해 키", () => {
  it("그리모어가 같아도 건달의 진영이 다르면 다른 해다", () => {
    // 조용한 밤2의 설명이 둘이다: 데몬이 건달을 골라 취했거나(건달 → 악),
    // 독살범이 데몬을 중독시켰거나(아무도 건달을 고르지 않음 — 건달은 선 유지).
    // 그리모어는 같고 건달의 진영만 다르다.
    const worlds = solve(puzzle());
    const byGrimoire = new Map<string, Set<boolean | undefined>>();
    for (const w of worlds) {
      const key = `${w.assignment.join(",")}|${w.currentDemonSeat}`;
      if (!byGrimoire.has(key)) byGrimoire.set(key, new Set());
      byGrimoire.get(key)!.add(w.goonEvil);
    }
    expect([...byGrimoire.values()].some((s) => s.size === 2)).toBe(true);
  });
});

describe("Goon: 건전성 거부", () => {
  it("이발사와의 조합을 거부한다", () => {
    expect(() => solve(puzzle({ rolePool: [...POOL, "barber"] }))).toThrow(/이발사와/);
  });

  it("마귀할멈과의 조합을 거부한다", () => {
    const pool = POOL.map((r) => (r === "poisoner" ? "pithag" : r)); // 하수인은 마귀할멈 하나
    expect(() => solve(puzzle({ rolePool: pool }))).toThrow(/마귀할멈과/);
  });
});

describe("Goon: 검토에서 드러난 구멍", () => {
  it("푸카는 밤1부터 고르므로 건달이 밤1에 악해질 수 있다", () => {
    // 푸카는 밤1부터 깨어나 중독 대상을 고른다 (킬만 밤2부터다). 건달이 낮1에 처형돼
    // 밤2에는 아무도 고를 수 없으므로, 수학자가 밤1에 센 비정상 1명은 '푸카가 건달을
    // 골라 스스로 취했다'로만 설명된다. 밤2의 사망은 암살자가, 푸카의 밤2 킬 부재는
    // '밤1 선택이 무효였다'가 설명한다.
    const worlds = solve({
      playerCount: 8,
      nights: 2,
      events: [
        { type: "execution", day: 1, seat: 1 },
        { type: "death", night: 2, seat: 7 },
      ],
      rolePool: ["pukka", "assassin", "goon", "mathematician", "chef", "empath", "undertaker", "librarian", "washerwoman", "investigator"],
      claims: [
        { seat: 0, role: "mathematician", info: [{ night: 1, data: { type: "mathematician", count: 1 } }] },
        { seat: 1, role: "goon", info: [] },
        { seat: 2, role: "chef", info: [] },
        { seat: 3, role: "empath", info: [] },
        { seat: 4, role: "undertaker", info: [] },
        { seat: 5, role: "librarian", info: [] },
        { seat: 6, role: "washerwoman", info: [] },
        { seat: 7, role: "investigator", info: [] },
      ],
    });
    // 좌석 0이 진짜 수학자이고 좌석 1이 진짜 건달인 세계가 존재해야 한다
    const honest = worlds.filter((w) => w.assignment[0] === "mathematician" && w.assignment[1] === "goon");
    expect(honest.length).toBeGreaterThan(0);
    expect(honest.every((w) => w.goonEvil === true)).toBe(true);
  });

  it("기록 없는 선택자도 취하므로 수학자가 한 명을 더 셀 수 있다", () => {
    // 밤2에 데몬 킬이 있어 데몬은 첫 선택자가 아니고, 독살범도 없다. 수도사가 그 밤
    // 기록을 남기지 않았으므로 '누군지 모르는 선한 선택자'가 유일한 비정상 원천이다.
    const worlds = solve({
      playerCount: 8,
      nights: 2,
      events: [{ type: "death", night: 2, seat: 7 }],
      rolePool: ["imp", "spy", "goon", "mathematician", "monk", "chef", "empath", "undertaker", "librarian", "washerwoman"],
      claims: [
        { seat: 0, role: "mathematician", info: [{ night: 2, data: { type: "mathematician", count: 1 } }] },
        { seat: 1, role: "empath", info: [] },
        { seat: 2, role: "monk", info: [] },
        { seat: 3, role: "goon", info: [] },
        { seat: 4, role: "librarian", info: [] },
        { seat: 5, role: "washerwoman", info: [] },
        { seat: 6, role: "chef", info: [] },
        { seat: 7, role: "undertaker", info: [] },
      ],
    });
    expect(worlds.some((w) =>
      w.assignment[0] === "mathematician" && w.assignment[2] === "monk" && w.assignment[3] === "goon")).toBe(true);
  });

  it("독살범은 건달을 중독시키지 못한다 (고르는 순간 스스로 취한다)", () => {
    const worlds = solve(puzzle());
    expect(worlds.length).toBeGreaterThan(0);
    for (const w of worlds) {
      const g = w.assignment.indexOf("goon");
      expect(w.poisonTargets.includes(g), `좌석 ${g}이 독살 대상`).toBe(false);
    }
  });

  it("대신은 캐릭터를 고르므로 건달을 발동시키지 않는다 — 그 밤 건달만 취한다", () => {
    // 수도사가 밤2에 건달을 보호했다고 기록했고 그 밤 아무도 죽지 않았다. 킬 부재의
    // 설명은 '멀쩡한 수도사의 보호'뿐인데, 수도사가 건달을 골라 취했다면 그 설명이
    // 사라진다 — 대신이 건달을 취하게 해 능력을 끈 세계만 남는다.
    const worlds = solve({
      playerCount: 8,
      nights: 2,
      events: [],
      rolePool: ["imp", "spy", "goon", "monk", "courtier", "chef", "empath", "undertaker", "librarian", "washerwoman"],
      claims: [
        { seat: 0, role: "chef", info: [] },
        { seat: 1, role: "goon", info: [] },
        { seat: 2, role: "monk", info: [{ night: 2, data: { type: "monk", target: 1 } }] },
        { seat: 3, role: "courtier", info: [{ night: 2, data: { type: "courtier", role: "goon" } }] },
        { seat: 4, role: "librarian", info: [] },
        { seat: 5, role: "washerwoman", info: [] },
        { seat: 6, role: "empath", info: [] },
        { seat: 7, role: "undertaker", info: [] },
      ],
    });
    const hit = worlds.filter((w) =>
      w.assignment[1] === "goon" && w.assignment[2] === "monk" && w.assignment[3] === "courtier");
    expect(hit.length).toBeGreaterThan(0);
    expect(hit.every((w) => w.goonEvil === false)).toBe(true); // 능력이 꺼졌으니 진영은 그대로
  });
});
