// 2026-08-28 21차 확장: Snake Charmer(뱀 조련사) — 데몬 승계형 역할·진영 교환.
// 멀쩡한 조련사가 데몬을 지목하면 그 밤부터 조련사가 데몬이 되고(승계 + roleSwap 토큰 교환),
// 옛 데몬은 선한 뱀 조련사가 되어 영구 중독된다. 교환 세계는 옛 데몬 좌석이 최종적으로
// 뱀 조련사를 주장할 때만 성립한다 (자기 배제). 미교환 지목 적중은 조련사의 비정상을 강제한다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";

function puzzle(overrides: Partial<SolverPuzzle> = {}): SolverPuzzle {
  return {
    playerCount: 7,
    nights: 3,
    rolePool: ["imp", "poisoner", "snakecharmer", "chef", "empath", "librarian", "washerwoman", "soldier", "undertaker"],
    events: [{ type: "death", night: 3, seat: 5 }],
    claims: [
      { seat: 0, role: "chef", info: [] },
      {
        seat: 1,
        role: "snakecharmer",
        info: [
          { night: 1, data: { type: "snakecharmer", target: 4 } },
          { night: 2, data: { type: "snakecharmer", target: 2 } },
        ],
      },
      { seat: 2, role: "snakecharmer", info: [] }, // 옛 데몬의 고백 주장 (교환 세계에서만 진실)
      { seat: 3, role: "empath", info: [] },
      { seat: 4, role: "librarian", info: [] },
      { seat: 5, role: "washerwoman", info: [] },
      { seat: 6, role: "soldier", info: [] },
    ],
    ...overrides,
  };
}

describe("Snake Charmer: 데몬 교환", () => {
  it("지목 적중 → 교환 세계가 성립한다: 조련사가 새 데몬, 옛 데몬은 고백하는 조련사", () => {
    const worlds = solve(puzzle());
    // 교환 세계: 셋업은 1=조련사·2=임프, 밤2 교환으로 현재 데몬은 1
    expect(worlds.some(
      (w) => w.assignment[1] === "snakecharmer" && w.assignment[2] === "imp" && w.currentDemonSeat === 1,
    )).toBe(true);
    // 고백이 연극(1·2가 악역 콤비 등)인 세계도 공존한다
    expect(worlds.some((w) => w.currentDemonSeat !== 1)).toBe(true);
  });

  it("옛 데몬이 교환 전의 행동을 주장하면 교환 세계가 죽는다 (당시엔 데몬이었다)", () => {
    const pz = puzzle();
    pz.claims[2].info = [{ night: 1, data: { type: "snakecharmer", target: 0 } }]; // 밤1 = 교환 전
    const worlds = solve(pz);
    expect(worlds.some((w) => w.assignment[1] === "snakecharmer" && w.currentDemonSeat === 1)).toBe(false);
  });

  it("미교환 적중은 조련사의 비정상을 강제한다 — 독살범이 없으면 그 세계가 모순", () => {
    const pz = puzzle();
    pz.claims[2] = { seat: 2, role: "undertaker", info: [] }; // 고백 없음 — 교환 세계 자체가 없다
    const worlds = solve(pz);
    const hit = worlds.filter((w) => w.assignment[1] === "snakecharmer" && w.assignment[2] === "imp");
    expect(hit.length).toBeGreaterThan(0);
    expect(hit.every((w) => w.poisonTargets[2] === 1)).toBe(true); // 밤2 적중 → 조련사 중독
    // 독살범 없는 풀에서는 그 세계가 아예 없다
    const noPoisoner = puzzle({
      rolePool: ["imp", "spy", "snakecharmer", "chef", "empath", "librarian", "washerwoman", "soldier", "undertaker"],
    });
    noPoisoner.claims[2] = { seat: 2, role: "undertaker", info: [] };
    const worlds2 = solve(noPoisoner);
    expect(worlds2.some((w) => w.assignment[1] === "snakecharmer" && w.assignment[2] === "imp")).toBe(false);
  });

  it("건전성 거부: 이발사와의 조합", () => {
    expect(() => solve(puzzle({ rolePool: [...puzzle().rolePool, "barber"] })))
      .toThrow(/뱀 조련사와/);
  });
});
