// 2026-08-28 15차 확장: Flowergirl(꽃파는 소녀)·Town Crier(마을 서기) — 부분 기록 + ∃ 의미론.
// "예(악마 투표/하수인 지명)"는 미기록 사건이 있을 수 있어 항상 성립하고 (관대한 방향),
// "아니오"가 그날 기록된 투표자(vote 이벤트)/지명자(nomination·virginTrigger)를 물어뜯는다:
// 반드시 악마/하수인으로 등록되는 좌석이 기록에 있으면 그 정보는 참일 수 없다 → 중독 강제.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";

function puzzle(overrides: Partial<SolverPuzzle> & { rolePool: RoleId[] }): SolverPuzzle {
  return {
    playerCount: 7,
    nights: 2,
    events: [],
    claims: [
      { seat: 0, role: "soldier", info: [] },
      { seat: 1, role: "flowergirl", info: [] },
      { seat: 2, role: "chef", info: [] },
      { seat: 3, role: "empath", info: [] },
      { seat: 4, role: "librarian", info: [] },
      { seat: 5, role: "washerwoman", info: [] },
      { seat: 6, role: "undertaker", info: [] },
    ],
    ...overrides,
  };
}

const POOL: RoleId[] = [
  "imp", "poisoner", "flowergirl", "towncrier", "soldier", "chef", "empath",
  "librarian", "washerwoman", "undertaker",
];

describe("Flowergirl: 어제 악마가 투표했는가", () => {
  it("'투표하지 않았다' + 기록된 투표자가 실제 악마면 소녀의 중독이 강제된다", () => {
    const pz = puzzle({
      rolePool: POOL,
      events: [
        { type: "vote", day: 1, seat: 0 },
        { type: "death", night: 2, seat: 5 },
      ],
    });
    pz.claims[1].info = [{ night: 2, data: { type: "flowergirl", yes: false } }];
    const worlds = solve(pz);
    expect(worlds.length).toBeGreaterThan(0);
    // 투표가 기록된 좌석 0이 악마인 세계: 진짜 소녀(1)는 그 밤 중독됐어야 한다
    const demonVoted = worlds.filter((w) => w.assignment[0] === "imp" && w.assignment[1] === "flowergirl");
    expect(demonVoted.length).toBeGreaterThan(0);
    expect(demonVoted.every((w) => w.poisonTargets[2] === 1)).toBe(true);
    // 악마가 다른 좌석인 세계는 중독 없이 성립한다
    expect(worlds.some((w) => w.assignment[0] !== "imp" && w.assignment[1] === "flowergirl" && w.poisonTargets[2] === null)).toBe(true);
  });

  it("'투표했다'는 미기록 투표로 항상 성립한다 (관대한 방향)", () => {
    const pz = puzzle({
      rolePool: POOL,
      events: [{ type: "death", night: 2, seat: 5 }], // 투표 기록 없음
    });
    pz.claims[1].info = [{ night: 2, data: { type: "flowergirl", yes: true } }];
    const worlds = solve(pz);
    expect(worlds.some((w) => w.assignment[1] === "flowergirl" && w.poisonTargets[2] === null)).toBe(true);
  });

  it("밤1 정보는 구조적으로 불가능하다 — 진짜 소녀 세계가 전부 배제된다", () => {
    const pz = puzzle({
      rolePool: POOL,
      events: [{ type: "death", night: 2, seat: 5 }],
    });
    pz.claims[1].info = [{ night: 1, data: { type: "flowergirl", yes: false } }];
    const worlds = solve(pz);
    expect(worlds.every((w) => w.assignment[1] !== "flowergirl")).toBe(true);
  });
});

describe("Town Crier: 어제 하수인이 지명했는가", () => {
  it("'지명하지 않았다' + 기록된 지명자가 실제 하수인이면 서기의 중독이 강제된다", () => {
    const pz = puzzle({
      rolePool: POOL,
      events: [
        { type: "nomination", day: 1, nominator: 0, nominee: 3 },
        { type: "death", night: 2, seat: 5 },
      ],
    });
    pz.claims[1] = {
      seat: 1, role: "towncrier",
      info: [{ night: 2, data: { type: "towncrier", yes: false } }],
    };
    const worlds = solve(pz);
    expect(worlds.length).toBeGreaterThan(0);
    const minionNominated = worlds.filter((w) => w.assignment[0] === "poisoner" && w.assignment[1] === "towncrier");
    expect(minionNominated.length).toBeGreaterThan(0);
    expect(minionNominated.every((w) => w.poisonTargets[2] === 1)).toBe(true);
    expect(worlds.some((w) => w.assignment[0] !== "poisoner" && w.assignment[1] === "towncrier" && w.poisonTargets[2] === null)).toBe(true);
  });

  it("첩자 지명자는 선으로 등록될 수 있어 '지명 없음'에 걸리지 않는다", () => {
    const withSpy: RoleId[] = ["imp", "spy", "towncrier", "soldier", "chef", "empath", "librarian", "washerwoman", "undertaker"];
    const pz = puzzle({
      rolePool: withSpy,
      events: [
        { type: "nomination", day: 1, nominator: 0, nominee: 3 },
        { type: "death", night: 2, seat: 5 },
      ],
    });
    pz.claims[1] = {
      seat: 1, role: "towncrier",
      info: [{ night: 2, data: { type: "towncrier", yes: false } }],
    };
    const worlds = solve(pz);
    // 좌석 0이 첩자인 세계: 선 등록 (∃) — 중독 없이 성립한다
    expect(worlds.some((w) => w.assignment[0] === "spy" && w.assignment[1] === "towncrier" && w.poisonTargets[2] === null)).toBe(true);
  });

  it("처녀 발동의 지명자도 지명 기록으로 센다", () => {
    // 발동 지명자는 주민 등록이 강제되므로 '하수인 지명 없음'과 충돌하지 않는다 —
    // 두 제약이 한 세계에서 공존함을 확인한다
    const withVirgin: RoleId[] = ["imp", "poisoner", "towncrier", "virgin", "soldier", "chef", "empath", "librarian", "washerwoman", "undertaker"];
    const pz: SolverPuzzle = {
      playerCount: 7,
      nights: 2,
      rolePool: withVirgin,
      events: [
        { type: "virginTrigger", day: 1, nominator: 0, nominee: 3 },
        { type: "death", night: 2, seat: 5 },
      ],
      claims: [
        { seat: 0, role: "soldier", info: [] },
        { seat: 1, role: "towncrier", info: [{ night: 2, data: { type: "towncrier", yes: false } }] },
        { seat: 2, role: "chef", info: [] },
        { seat: 3, role: "virgin", info: [] },
        { seat: 4, role: "librarian", info: [] },
        { seat: 5, role: "washerwoman", info: [] },
        { seat: 6, role: "undertaker", info: [] },
      ],
    };
    const worlds = solve(pz);
    expect(worlds.some((w) => w.assignment[1] === "towncrier" && w.assignment[3] === "virgin" && w.poisonTargets[2] === null)).toBe(true);
  });
});
