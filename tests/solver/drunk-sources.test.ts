// 2026-08-28 16차 확장: 이동식 취함 원천 — Sailor(선원)·Innkeeper(여관주인)·Courtier(대신).
// 구조: St.drunkNights(밤별 확정 취함) + doNight 진입 시 선택 분기(drunkSourceBranches).
// 확정 취함은 require_를 만족시키고 forbid_를 깨뜨리며, solve에서 그 밤 정보를 무제약으로 만든다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";
import { makePuzzle } from "./helpers";

describe("Sailor: 나 또는 대상이 취한다, 멀쩡하면 죽지 않는다", () => {
  const base: RoleId[] = ["imp", "spy", "sailor", "chef", "empath", "librarian", "washerwoman"];

  it("선원의 밤 사망은 '그 밤 자신이 취했다'로만 설명된다 (독살범 없음)", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy"], nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.extraDrunk?.[2]?.has(2))).toBe(true);
  });

  it("멀쩡한 선원은 킬 실패를 설명한다 — 선원이 없으면 조용한 밤이 모순", () => {
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["imp", "spy"], nights: 2 });
    expect(demonScenarios(pz, new Schedule(pz), base).length).toBeGreaterThan(0);
    const noSailor: RoleId[] = ["imp", "spy", "undertaker", "chef", "empath", "librarian", "washerwoman"];
    expect(demonScenarios(pz, new Schedule(pz), noSailor)).toHaveLength(0);
  });

  it("처형된 선원도 그 낮 취했거나 중독됐어야 한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    // 독살범이 없으니 밤1의 자기 취함만이 설명이다 (취함이 낮까지 지속)
    expect(scs.every((s) => s.extraDrunk?.[1]?.has(2))).toBe(true);
  });

  it("solve: 기록된 대상의 확정 취함이 거짓 정보를 설명한다 — 다른 대상 기록이면 설명되지 않는다", () => {
    const mk = (target: number): SolverPuzzle => ({
      playerCount: 7,
      rolePool: ["imp", "spy", "sailor", "chef", "empath", "librarian", "washerwoman", "undertaker", "soldier"],
      nights: 2,
      events: [],
      claims: [
        { seat: 0, role: "sailor", info: [{ night: 2, data: { type: "sailor", target } }] },
        { seat: 1, role: "empath", info: [{ night: 2, data: { type: "empath", count: 2 } }] },
        { seat: 2, role: "chef", info: [] },
        { seat: 3, role: "librarian", info: [] },
        { seat: 4, role: "washerwoman", info: [] },
        { seat: 5, role: "undertaker", info: [] },
        { seat: 6, role: "soldier", info: [] },
      ],
    });
    // 대상이 초공감자(1): 밤2에 확정 취함 → count 2가 무제약 — 정직한 선원·초공감자 세계가 성립
    const withEmpath = solve(mk(1));
    expect(withEmpath.some((w) => w.assignment[0] === "sailor" && w.assignment[1] === "empath")).toBe(true);
    // 대상이 다른 좌석(3): 초공감자의 거짓 count를 설명할 수단이 없다 (독살범 없음)
    const withOther = solve(mk(3));
    expect(withOther.some((w) => w.assignment[0] === "sailor" && w.assignment[1] === "empath")).toBe(false);
  });
});

describe("Innkeeper: 2명 보호 + 그중 1명 취함", () => {
  const base: RoleId[] = ["imp", "poisoner", "innkeeper", "chef", "empath", "librarian", "washerwoman"];
  const claims = (targets: [number, number]) => [
    { seat: 2, role: "innkeeper" as RoleId, info: [{ night: 2, data: { type: "innkeeper" as const, targets } }] },
  ];

  it("보호를 기록한 대상이 그 밤 죽었다면 여관주인의 중독이 강제된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      claims: claims([3, 4]),
      events: [{ type: "death", night: 2, seat: 3 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
    // 독살범이 없으면 설명이 없다
    const noPoisoner: RoleId[] = ["imp", "spy", "innkeeper", "chef", "empath", "librarian", "washerwoman"];
    expect(demonScenarios(pz, new Schedule(pz), noPoisoner)).toHaveLength(0);
  });

  it("효과가 성립한 밤에는 두 대상 중 정확히 하나가 취한다 (분기)", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      claims: claims([3, 4]),
      events: [{ type: "death", night: 2, seat: 5 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    const drunk3 = scs.some((s) => s.extraDrunk?.[2]?.has(3) && !s.extraDrunk?.[2]?.has(4));
    const drunk4 = scs.some((s) => s.extraDrunk?.[2]?.has(4) && !s.extraDrunk?.[2]?.has(3));
    expect(drunk3 && drunk4).toBe(true);
  });
});

describe("Courtier: 역할 하나를 3밤 3낮 취하게 한다", () => {
  const base: RoleId[] = ["imp", "spy", "courtier", "chef", "empath", "librarian", "washerwoman"];
  const claims = (role: RoleId, night = 1) => [
    { seat: 2, role: "courtier" as RoleId, info: [{ night, data: { type: "courtier" as const, role } }] },
  ];

  it("악마 역할을 고르면 3밤 동안 킬 실패가 설명된다 — 다른 설명 수단 없이", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy"], nights: 3,
      claims: claims("imp"),
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.extraDrunk?.[2]?.has(0) && s.extraDrunk?.[3]?.has(0))).toBe(true);
    // 게임에 없는 역할을 골랐다면 아무 일도 없다 — 조용한 밤이 설명되지 않는다
    const pz2 = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "monk"], nights: 3,
      claims: claims("monk"),
    });
    expect(demonScenarios(pz2, new Schedule(pz2), base)).toHaveLength(0);
  });

  it("취한 데몬은 킬할 수 없다 — 취함 창 안의 사망은 모순", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy"], nights: 2,
      claims: claims("imp"),
      events: [{ type: "death", night: 2, seat: 4 }],
    });
    // 밤1 사용 → 데몬이 밤1~3 취함 → 밤2 킬 불가. 다른 사망 수단도 없다 →
    // 대신이 무효였어야 하는데 독살범이 없어 그마저 불가 — 모순
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
    // 독살범이 있으면 '사용 밤에 대신이 중독됐다'(무효 분기)로 성립한다
    const withPoisoner: RoleId[] = ["imp", "poisoner", "courtier", "chef", "empath", "librarian", "washerwoman"];
    const pz2 = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      claims: claims("imp"),
      events: [{ type: "death", night: 2, seat: 4 }],
    });
    const scs = demonScenarios(pz2, new Schedule(pz2), withPoisoner);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);
  });
});
