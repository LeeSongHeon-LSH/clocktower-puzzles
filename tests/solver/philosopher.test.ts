// 2026-08-28 22차 확장: Philosopher(철학자) — 획득형 타임라인.
// 1회, 밤에 선한 능력을 획득 (행동 기록 {night, role} + 이후 정보는 asRole "획득한 능력으로서").
// 토큰·등록은 철학자 그대로, 기상 판정만 획득 역할로 위임한다. 그 역할이 판에 있으면
// 원주인이 그 밤부터 영구 취함 (drunkNights 재사용). 사용 밤에 중독이면 무효 —
// 능력을 얻지 못했고 이후 철학자의 획득 능력 정보는 전부 가짜다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";

function puzzle(overrides: Partial<SolverPuzzle> = {}): SolverPuzzle {
  return {
    playerCount: 7,
    nights: 3,
    rolePool: ["imp", "spy", "philosopher", "empath", "chef", "librarian", "washerwoman", "soldier", "undertaker"],
    events: [
      { type: "death", night: 2, seat: 6 },
      { type: "death", night: 3, seat: 5 },
    ],
    claims: [
      { seat: 0, role: "chef", info: [] },
      {
        seat: 1,
        role: "philosopher",
        info: [
          { night: 2, data: { type: "philosopher", role: "empath" } },
          { night: 2, asRole: "empath", data: { type: "empath", count: 1 } },
          { night: 3, asRole: "empath", data: { type: "empath", count: 1 } },
        ],
      },
      { seat: 2, role: "librarian", info: [] },
      {
        seat: 3,
        role: "empath",
        info: [{ night: 3, data: { type: "empath", count: 2 } }], // 양옆(2·4)이 선인이면 거짓
      },
      { seat: 4, role: "soldier", info: [] },
      { seat: 5, role: "washerwoman", info: [] },
      { seat: 6, role: "undertaker", info: [] },
    ],
    ...overrides,
  };
}

describe("Philosopher: 능력 획득", () => {
  it("원주인 영구 취함이 진짜 초공감자의 거짓 정보를 설명한다 — 유일한 취함 원천", () => {
    const worlds = solve(puzzle());
    // 철학자(1)가 초공감자 능력을 얻어 원주인(3)이 취한 세계:
    // 3의 거짓 count 2가 무제약이 되고, 철학자의 count 1은 이웃(0=임프)과 맞는다
    expect(worlds.some(
      (w) => w.assignment[1] === "philosopher" && w.assignment[3] === "empath" && w.assignment[0] === "imp",
    )).toBe(true);
    // 독살범이 없는 풀 — 3이 선한 초공감자인 세계는 철학자의 취함 없이는 성립하지 않는다
    expect(worlds.every(
      (w) => w.assignment[3] !== "empath" || w.assignment[1] === "philosopher",
    )).toBe(true);
  });

  it("사용 밤에 중독이면 무효 — 이후 획득 능력 정보가 전부 가짜가 된다", () => {
    // 철학자의 밤3 정보가 어떤 이웃 구성과도 안 맞게 만들어도, 무효 분기(사용 밤 중독)가 구제한다
    const pz = puzzle({
      rolePool: ["imp", "poisoner", "philosopher", "empath", "chef", "librarian", "washerwoman", "soldier", "undertaker"],
    });
    const worlds = solve(pz);
    // 사용 밤(2)에 철학자가 중독된 세계: 능력 미획득 — 밤2·3의 획득 정보가 무제약
    expect(worlds.some(
      (w) => w.assignment[1] === "philosopher" && w.poisonTargets[2] === 1,
    )).toBe(true);
  });

  it("검증: 획득 불가 역할·기록 없는 asRole·기록 불일치는 거부된다", () => {
    const badRole = puzzle();
    badRole.claims[1].info[0] = { night: 2, data: { type: "philosopher", role: "soldier" } };
    expect(() => solve(badRole)).toThrow(/획득할 수 없는|일치해야/);

    const noRec = puzzle();
    noRec.claims[1].info = [{ night: 2, asRole: "empath", data: { type: "empath", count: 1 } }];
    expect(() => solve(noRec)).toThrow(/사용 기록/);

    const early = puzzle();
    early.claims[1].info = [
      { night: 2, data: { type: "philosopher", role: "empath" } },
      { night: 1, asRole: "empath", data: { type: "empath", count: 1 } }, // 획득 전
    ];
    expect(() => solve(early)).toThrow(/사용 기록/);
  });

  it("획득 즉시형 정보: 빨래꾼 능력을 밤2에 얻으면 그 밤 한 번 정보를 받는다", () => {
    const pz = puzzle();
    pz.claims[1].info = [
      { night: 2, data: { type: "philosopher", role: "washerwoman" } },
      { night: 2, asRole: "washerwoman", data: { type: "washerwoman", targets: [3, 4], shownRole: "soldier" } },
    ];
    const worlds = solve(pz);
    // 4가 진짜 군인인 세계에서 정보가 참 — 성립한다 (원주인 5=빨래꾼은 영구 취함)
    expect(worlds.some(
      (w) => w.assignment[1] === "philosopher" && w.assignment[4] === "soldier",
    )).toBe(true);
    // 획득한 밤이 아닌 시점의 즉시형 정보는 구조 위반 — 그 세계가 없다
    const late = puzzle();
    late.claims[1].info = [
      { night: 2, data: { type: "philosopher", role: "washerwoman" } },
      { night: 3, asRole: "washerwoman", data: { type: "washerwoman", targets: [3, 4], shownRole: "soldier" } },
    ];
    expect(solve(late).every((w) => w.assignment[1] !== "philosopher")).toBe(true);
  });
});
