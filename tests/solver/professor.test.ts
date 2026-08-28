// 2026-08-28 17차 확장: Professor(교수) — 1회, 밤에 죽은 좌석을 골라 마을 사람이면 부활.
// 부활이 일어난 게임은 이 스키마에 입력될 수 없다 (죽음 이벤트 번복 불가 — 샤바로스 역류
// 선례). 따라서 시도 기록은 항상 '부활하지 않았다'는 뜻이고, 대상이 반드시 마을 사람으로
// 등록되는 시신이면 교수의 그 밤 비정상이 강제된다. 첩자 시신은 하수인 등록(∃)으로 자유다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";
import { makePuzzle } from "./helpers";

const base: RoleId[] = ["imp", "poisoner", "professor", "chef", "empath", "librarian", "washerwoman"];
const profClaim = (target: number) => [
  { seat: 2, role: "professor" as RoleId, info: [{ night: 3, data: { type: "professor" as const, target } }] },
];

describe("Professor: 부활 시도 기록", () => {
  it("마을 사람 시신을 골랐는데 부활이 없었다 → 교수의 그 밤 중독이 강제된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 3,
      claims: profClaim(3), // 요리사(3)의 시신
      events: [
        { type: "death", night: 2, seat: 3 },
        { type: "death", night: 3, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(3) === 2)).toBe(true);
    // 독살범이 없으면 설명이 없다 — 세계 전체가 모순
    const noPoisoner: RoleId[] = ["imp", "spy", "professor", "chef", "empath", "librarian", "washerwoman"];
    expect(demonScenarios(pz, new Schedule(pz), noPoisoner)).toHaveLength(0);
  });

  it("첩자 시신은 하수인으로 등록될 수 있어 (∃) 시도 실패가 자유다", () => {
    const withSpy: RoleId[] = ["imp", "spy", "professor", "chef", "empath", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy"], nights: 3,
      claims: profClaim(1), // 첩자(1)의 시신
      events: [
        { type: "death", night: 2, seat: 1 },
        { type: "death", night: 3, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withSpy);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.some((s) => !s.poisonRequired.has(3))).toBe(true);
  });

  it("solve 통합: 산 사람을 고른 기록은 구조 위반 — 진짜 교수 세계가 배제된다", () => {
    const pz: SolverPuzzle = {
      playerCount: 7,
      rolePool: ["imp", "poisoner", "professor", "chef", "empath", "librarian", "washerwoman", "undertaker", "soldier"],
      nights: 2,
      events: [{ type: "death", night: 2, seat: 4 }],
      claims: [
        { seat: 0, role: "chef", info: [] },
        { seat: 1, role: "empath", info: [] },
        { seat: 2, role: "professor", info: [{ night: 2, data: { type: "professor", target: 5 } }] }, // 5는 생존
        { seat: 3, role: "librarian", info: [] },
        { seat: 4, role: "washerwoman", info: [] },
        { seat: 5, role: "undertaker", info: [] },
        { seat: 6, role: "soldier", info: [] },
      ],
    };
    const worlds = solve(pz);
    // 산 사람 선택은 정상 상태에서 불가능 — 진짜 교수 세계는 그 밤 중독이 강제된다
    // (행동 기록의 구조 위반을 중독으로 설명하는 것은 수도사 기록과 같은 관례)
    expect(worlds.some((w) => w.assignment[2] === "professor")).toBe(true);
    expect(worlds.every((w) => w.assignment[2] !== "professor" || w.poisonTargets[2] === 2)).toBe(true);
  });

  it("solve 통합: 시도 실패 기록이 시신의 정체를 좁힌다", () => {
    // 교수가 밤3에 좌석 4의 시신을 골랐는데 부활이 없었다 (독살범이 밤3에 다른 곳을 노렸음이
    // 다른 정보로 강제되진 않는 순수 사례) — 좌석 4가 마을 사람인 세계는 교수 중독을 요구한다
    const mk = (): SolverPuzzle => ({
      playerCount: 7,
      rolePool: ["imp", "spy", "professor", "chef", "empath", "librarian", "washerwoman", "undertaker", "soldier"],
      nights: 3,
      events: [
        { type: "death", night: 2, seat: 4 },
        { type: "death", night: 3, seat: 5 },
      ],
      claims: [
        { seat: 0, role: "chef", info: [] },
        { seat: 1, role: "empath", info: [] },
        { seat: 2, role: "professor", info: [{ night: 3, data: { type: "professor", target: 4 } }] },
        { seat: 3, role: "librarian", info: [] },
        { seat: 4, role: "washerwoman", info: [] },
        { seat: 5, role: "undertaker", info: [] },
        { seat: 6, role: "soldier", info: [] },
      ],
    });
    const worlds = solve(mk());
    expect(worlds.length).toBeGreaterThan(0);
    // 독살범이 풀에 없으므로(하수인은 첩자) 교수의 비정상은 불가능 —
    // 진짜 교수 세계에서 좌석 4(빨래꾼 주장)의 시신은 마을 사람일 수 없다
    // (죽은 첩자, 또는 스타 패스로 승계를 넘긴 죽은 임프)
    const profWorlds = worlds.filter((w) => w.assignment[2] === "professor");
    expect(profWorlds.length).toBeGreaterThan(0);
    expect(profWorlds.every((w) => w.assignment[4] === "spy" || w.assignment[4] === "imp")).toBe(true);
  });
});
