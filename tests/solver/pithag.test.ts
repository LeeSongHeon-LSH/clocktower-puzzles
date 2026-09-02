// 2026-09-02 24차 확장: Pit-Hag(마귀할멈) — 결정적 역할 변신 타임라인.
// 마귀할멈은 밤2부터 한 명을 판에 없는 캐릭터로 바꾼다 (진영은 그대로).
// 변신한 사람은 새 역할을 통보받으므로 정직한 선인이라면 이력을 밝힌다 — 이력을 밝히지
// 않은 선한 좌석은 변신하지 않았다 (자기 배제, 이발사 20차 선례). 이력은 분기가 아니라
// 결정적이므로 solve가 셋업 배정을 만들고, timeline이 그 밤에 마귀할멈이 살아 있고
// 멀쩡했는지, 새 역할이 그때 판에 없었는지만 검사한다.
// 마귀할멈 자신의 변신은 주장에 드러나지 않으므로 등록 ∃로 흡수한다 (첩자 선례).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { Claim, RoleId, SolverPuzzle } from "@/lib/solver/types";

const POOL: RoleId[] = [
  "imp", "pithag", "washerwoman", "chef", "empath", "undertaker", "librarian",
  "soldier", "mayor", "butler", "courtier", "fortuneteller", "ravenkeeper",
];

/** 8인 3밤: 좌석 1이 밤2에 초공감자 → 장의사로 변신했다고 주장한다 */
function puzzle(overrides: Partial<SolverPuzzle> = {}): SolverPuzzle {
  const claims: Claim[] = [
    { seat: 0, role: "chef", info: [] },
    {
      seat: 1,
      role: "undertaker",
      roleChange: { night: 2, from: "empath" },
      info: [
        { night: 1, asRole: "empath", data: { type: "empath", count: 0 } },
        { night: 3, data: { type: "undertaker", shownRole: "washerwoman" } },
      ],
    },
    { seat: 2, role: "librarian", info: [] },
    { seat: 3, role: "soldier", info: [] },
    { seat: 4, role: "courtier", info: [] },
    { seat: 5, role: "butler", info: [] },
    { seat: 6, role: "washerwoman", info: [] },
    { seat: 7, role: "mayor", info: [] },
  ];
  return {
    playerCount: 8,
    nights: 3,
    rolePool: POOL,
    events: [{ type: "execution", day: 2, seat: 6 }],
    claims,
    ...overrides,
  };
}

/** 변신을 밤3으로 미룬 주장 (밤1 정보만 남긴다) */
function lateChangeClaims(base: SolverPuzzle): Claim[] {
  return base.claims.map((c) =>
    c.seat === 1
      ? {
          ...c,
          roleChange: { night: 3, from: "empath" as RoleId },
          info: [{ night: 1, asRole: "empath" as RoleId, data: { type: "empath" as const, count: 0 } }],
        }
      : c,
  );
}

/** 밤3 변신 + 밤2에 좌석 7이 죽는다 (죽은 마귀할멈 검사용) */
function lateChangeWithDeath(): SolverPuzzle {
  const base = puzzle();
  return { ...base, events: [{ type: "death", night: 2, seat: 7 }], claims: lateChangeClaims(base) };
}

/** 밤3 변신 + 사건 없음 — 밤2·밤3의 킬 부재는 군인(좌석 3)이 설명한다 */
function lateChangeQuiet(): SolverPuzzle {
  const base = puzzle();
  return { ...base, events: [], claims: lateChangeClaims(base) };
}

describe("Pit-Hag: 역할 변신", () => {
  it("변신 이력 세계가 성립한다 — 최종 그리모어는 주장대로, 셋업은 변신 전 역할", () => {
    const worlds = solve(puzzle());
    expect(worlds.some((w) => w.assignment[1] === "undertaker")).toBe(true);
    // 마귀할멈은 언제나 배정된다 (대본의 유일한 하수인)
    expect(worlds.every((w) => w.assignment.includes("pithag"))).toBe(true);
  });

  it("새 역할이 그때 판에 있으면 변신할 수 없다", () => {
    const pz = puzzle();
    pz.claims[2] = { seat: 2, role: "undertaker", info: [] }; // 밤2 시점에 장의사 토큰을 들고 있다
    const worlds = solve(pz);
    expect(worlds.some((w) => w.assignment[1] === "undertaker")).toBe(false);
    expect(worlds.length).toBeGreaterThan(0); // 좌석 1이 악역인 세계는 남는다
  });

  it("죽은 마귀할멈은 변신시키지 못한다", () => {
    const worlds = solve(lateChangeWithDeath());
    // 좌석 7은 밤2에 죽어 밤3에 능력이 없다
    expect(worlds.every((w) => !(w.assignment[7] === "pithag" && w.assignment[1] === "undertaker"))).toBe(true);
    expect(worlds.some((w) => w.assignment[1] === "undertaker")).toBe(true); // 살아 있는 마귀할멈이면 성립
  });

  it("취한 마귀할멈은 변신시키지 못한다 (대신이 마귀할멈을 골랐다)", () => {
    const drunkPz = lateChangeQuiet();
    drunkPz.claims[4] = {
      seat: 4,
      role: "courtier",
      info: [{ night: 2, data: { type: "courtier", role: "pithag" } }],
    };
    const worlds = solve(drunkPz);
    expect(worlds.every((w) => !(w.assignment[4] === "courtier" && w.assignment[1] === "undertaker"))).toBe(true);

    // 대조군: 대신이 다른 역할을 골랐다면 두 좌석이 함께 정직한 세계가 있다
    const controlPz = lateChangeQuiet();
    controlPz.claims[4] = {
      seat: 4,
      role: "courtier",
      info: [{ night: 2, data: { type: "courtier", role: "mayor" } }],
    };
    const control = solve(controlPz);
    expect(control.some((w) => w.assignment[4] === "courtier" && w.assignment[1] === "undertaker")).toBe(true);
  });

  it("한 밤에 두 명을 바꾸지는 못한다", () => {
    const same = puzzle();
    same.claims[2] = { seat: 2, role: "librarian", roleChange: { night: 2, from: "fortuneteller" }, info: [] };
    const worlds = solve(same);
    expect(worlds.some((w) => w.assignment[1] === "undertaker" && w.assignment[2] === "librarian")).toBe(false);

    // 다른 밤이면 둘 다 성립한다
    const split = puzzle();
    split.claims[2] = { seat: 2, role: "librarian", roleChange: { night: 3, from: "fortuneteller" }, info: [] };
    const ok = solve(split);
    expect(ok.some((w) => w.assignment[1] === "undertaker" && w.assignment[2] === "librarian")).toBe(true);
  });

  it("즉시형 정보 역할로 변신하면 그 밤에 한 번 정보를 받는다", () => {
    const onTime = puzzle();
    onTime.claims[0] = { seat: 0, role: "ravenkeeper", info: [] }; // 요리사 토큰을 비워 둔다
    onTime.claims[1] = {
      seat: 1,
      role: "chef",
      roleChange: { night: 2, from: "empath" },
      info: [
        { night: 1, asRole: "empath", data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "chef", count: 0 } },
      ],
    };
    expect(solve(onTime).some((w) => w.assignment[1] === "chef")).toBe(true);

    // 변신한 밤이 아니면 요리사는 깨어나지 않는다
    const late = puzzle();
    late.claims[0] = { seat: 0, role: "ravenkeeper", info: [] };
    late.claims[1] = {
      seat: 1,
      role: "chef",
      roleChange: { night: 2, from: "empath" },
      info: [
        { night: 1, asRole: "empath", data: { type: "empath", count: 0 } },
        { night: 3, data: { type: "chef", count: 0 } },
      ],
    };
    expect(solve(late).some((w) => w.assignment[1] === "chef")).toBe(false);
  });

  it("마귀할멈의 자기 변신은 등록 ∃로 흡수된다 — 시신이 마을 사람으로 보인다", () => {
    const pz = puzzle();
    // 아무도 주장하지 않은 역할로 시신이 보였다 — 자기를 바꾼 마귀할멈만이 그렇게 보일 수 있다
    pz.claims[1].info[1] = { night: 3, data: { type: "undertaker", shownRole: "ravenkeeper" } };
    // 좌석 1이 정직한(= 장의사인) 세계에서는 시신이 마귀할멈이어야만 한다
    const honest = solve(pz).filter((w) => w.assignment[1] === "undertaker");
    expect(honest.length).toBeGreaterThan(0);
    expect(honest.every((w) => w.assignment[6] === "pithag")).toBe(true);

    // 그 역할을 판에 있는 좌석이 들고 있으면 자기 변신이 불가능하다 —
    // 좌석 0은 좌석 1의 밤1 정보(초공감자 0)가 선으로 못박으므로 시체 오등록이 사라진다
    const inPlay = puzzle();
    inPlay.claims[0] = { seat: 0, role: "ravenkeeper", info: [] };
    inPlay.claims[1].info[1] = { night: 3, data: { type: "undertaker", shownRole: "ravenkeeper" } };
    expect(solve(inPlay).some((w) => w.assignment[1] === "undertaker")).toBe(false);
  });
});

describe("Pit-Hag: 건전성 거부", () => {
  it("하수인이 마귀할멈 하나가 아니면 거부한다", () => {
    expect(() => solve(puzzle({ rolePool: [...POOL, "poisoner"] }))).toThrow(/하수인이 마귀할멈 하나뿐/);
  });

  it("악마가 두 종류면 거부한다", () => {
    expect(() => solve(puzzle({ rolePool: [...POOL, "vortox"] }))).toThrow(/악마가 한 종류/);
  });

  it("10인 이상은 거부한다", () => {
    expect(() => solve(puzzle({ playerCount: 10 }))).toThrow(/9인 이하/);
  });

  it("주장을 날조하는 역할·역할 타임라인 역할과의 조합을 거부한다", () => {
    for (const bad of ["drunk", "mutant", "lunatic", "goon", "barber", "snakecharmer", "philosopher"] as RoleId[]) {
      expect(() => solve(puzzle({ rolePool: [...POOL, bad] })), bad).toThrow(/마귀할멈과/);
    }
  });

  it("변신 이력의 밤·역할 범위를 검사한다", () => {
    const night1 = puzzle();
    night1.claims[1] = { ...night1.claims[1], roleChange: { night: 1, from: "empath" } };
    expect(() => solve(night1)).toThrow(/변신한 밤이 범위 밖/);

    const notInPool = puzzle();
    // 시계공은 교환 가능 역할이지만 이 대본에 없다 — 셋업에 배정될 수 없다
    notInPool.claims[1] = { ...notInPool.claims[1], roleChange: { night: 2, from: "clockmaker" } };
    expect(() => solve(notInPool)).toThrow(/변신 전 역할이 대본에 없습니다/);

    const badFrom = puzzle();
    badFrom.claims[1] = { ...badFrom.claims[1], roleChange: { night: 2, from: "soldier" } };
    expect(() => solve(badFrom)).toThrow(/변신 이력에 쓸 수 없는 역할/);
  });

  it("변신 후의 정보에는 당시 역할을 붙일 수 없다", () => {
    const pz = puzzle();
    pz.claims[1] = {
      ...pz.claims[1],
      info: [
        { night: 1, asRole: "empath", data: { type: "empath", count: 0 } },
        { night: 3, asRole: "empath", data: { type: "empath", count: 0 } },
      ],
    };
    expect(() => solve(pz)).toThrow(/변신 전 정보만/);
  });

  it("변신 전의 정보에는 당시 역할을 밝혀야 한다", () => {
    const pz = puzzle();
    pz.claims[1] = {
      ...pz.claims[1],
      info: [{ night: 1, data: { type: "undertaker", shownRole: "washerwoman" } }],
    };
    expect(() => solve(pz)).toThrow(/당시 역할을 밝혀야 합니다/);
  });

  it("마귀할멈이 없으면 변신 이력을 쓸 수 없다", () => {
    const pz = puzzle({
      rolePool: ["imp", "poisoner", "washerwoman", "chef", "empath", "undertaker", "librarian", "soldier", "mayor", "butler"],
    });
    expect(() => solve(pz)).toThrow(/마귀할멈이 풀에 있을 때만/);
  });
});
