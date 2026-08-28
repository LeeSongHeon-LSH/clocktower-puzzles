// 통합 테스트: 손으로 전수 도출한 월드 집합과 엔진 출력이 정확히 일치해야 한다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { SolverPuzzle } from "@/lib/solver/types";

function keys(pz: SolverPuzzle): string[] {
  return solve(pz)
    .map((w) => `${w.assignment.join(",")}|d${w.currentDemonSeat}`)
    .sort();
}

describe("solve: 탕녀 5인 (독살 없음)", () => {
  // 선한 좌석의 주장이 모두 술/독 없이 성립해야 하는 구성.
  // 수기 도출: 악역 {3,4}(데몬 양쪽 가능) + 악역 {0,1}(데몬은 1만 — 점쟁이 [0,2] '없음' 때문) → 월드 3개.
  const pz: SolverPuzzle = {
    playerCount: 5,
    rolePool: ["imp", "scarletwoman", "washerwoman", "empath", "chef", "fortuneteller", "librarian"],
    nights: 1,
    events: [],
    claims: [
      { seat: 0, role: "washerwoman", info: [{ night: 1, text: "", data: { type: "washerwoman", targets: [1, 2], shownRole: "empath" } }] },
      { seat: 1, role: "empath", info: [{ night: 1, text: "", data: { type: "empath", count: 0 } }] },
      { seat: 2, role: "chef", info: [{ night: 1, text: "", data: { type: "chef", count: 1 } }] },
      { seat: 3, role: "fortuneteller", info: [{ night: 1, text: "", data: { type: "fortuneteller", targets: [0, 2], yes: false } }] },
      { seat: 4, role: "librarian", info: [{ night: 1, text: "", data: { type: "librarian", targets: null } }] },
    ],
  };
  it("월드는 정확히 3개", () => {
    expect(keys(pz)).toEqual([
      "washerwoman,empath,chef,imp,scarletwoman|d3",
      "washerwoman,empath,chef,scarletwoman,imp|d4",
      "scarletwoman,imp,chef,fortuneteller,librarian|d1",
    ].sort());
  });
});

describe("solve: 독살범 5인, 밤2 킬 실패", () => {
  // 킬 실패 → 밤2 독살 대상은 데몬으로 강제 → 밤2 정보는 술/독 구제 불가.
  // 수기 도출로 월드 7개 (테스트 주석의 케이스 분석 참조).
  const pz: SolverPuzzle = {
    playerCount: 5,
    rolePool: ["imp", "poisoner", "empath", "chef", "washerwoman", "librarian", "fortuneteller"],
    nights: 2,
    events: [],
    claims: [
      {
        seat: 0, role: "empath", info: [
          { night: 1, text: "", data: { type: "empath", count: 0 } },
          { night: 2, text: "", data: { type: "empath", count: 0 } },
        ],
      },
      { seat: 1, role: "chef", info: [{ night: 1, text: "", data: { type: "chef", count: 0 } }] },
      { seat: 2, role: "washerwoman", info: [{ night: 1, text: "", data: { type: "washerwoman", targets: [0, 3], shownRole: "empath" } }] },
      {
        seat: 3, role: "fortuneteller", info: [
          { night: 1, text: "", data: { type: "fortuneteller", targets: [1, 4], yes: false } },
          { night: 2, text: "", data: { type: "fortuneteller", targets: [1, 4], yes: false } },
        ],
      },
      { seat: 4, role: "librarian", info: [{ night: 1, text: "", data: { type: "librarian", targets: null } }] },
    ],
  };
  it("수기 도출한 7개 월드와 일치", () => {
    expect(keys(pz)).toEqual([
      // 악역 {2,3}: 요리사(1) 정보만 밤1 독살로 구제
      "empath,chef,imp,poisoner,librarian|d2",
      "empath,chef,poisoner,imp,librarian|d3",
      // 악역 {0,2}: 구제 불필요
      "imp,chef,poisoner,fortuneteller,librarian|d0",
      "poisoner,chef,imp,fortuneteller,librarian|d2",
      // 악역 {0,1}: 세탁부(2) 정보만 구제, 데몬은 0만 가능 (점쟁이 밤2 [1,4] '없음')
      "imp,poisoner,washerwoman,fortuneteller,librarian|d0",
      // 악역 {0,3}: 세탁부(2) 정보만 구제
      "imp,chef,washerwoman,poisoner,librarian|d0",
      "poisoner,chef,washerwoman,imp,librarian|d3",
    ].sort());
  });
});

describe("solve: 솔버가 모르는 역할 거부", () => {
  // 사전에는 3개 판본 72종이 다 있지만 능력이 구현된 건 그 일부다.
  // 모르는 능력을 없는 셈 치고 세면 "유일해"가 거짓이 되므로, 세지 않고 거부해야 한다.
  const base: SolverPuzzle = {
    playerCount: 5,
    rolePool: ["imp", "scarletwoman", "washerwoman", "empath", "chef", "fortuneteller", "librarian"],
    nights: 1,
    events: [],
    claims: [
      { seat: 0, role: "washerwoman", info: [] },
      { seat: 1, role: "empath", info: [] },
      { seat: 2, role: "chef", info: [] },
      { seat: 3, role: "fortuneteller", info: [] },
      { seat: 4, role: "librarian", info: [] },
    ],
  };

  it("주장 역할이 미구현이면 거부한다", () => {
    const pz: SolverPuzzle = {
      ...base,
      rolePool: [...base.rolePool, "snakecharmer"],
      claims: base.claims.map((c, i) => (i === 2 ? { ...c, role: "snakecharmer" as const } : c)),
    };
    expect(() => solve(pz)).toThrow(/모르는 역할/);
  });

  it("풀에 든 하수인이 미구현이면 거부한다", () => {
    expect(() => solve({ ...base, rolePool: [...base.rolePool, "pithag"] })).toThrow(/모르는 역할/);
  });

  it("배정되지 않는 역할은 풀에 있어도 통과한다 (은둔자 오등록 대상)", () => {
    // 보르톡스는 데몬 자리에 들어가지 않는다 — 은둔자가 그 토큰으로 등록될 수 있을 뿐이다.
    expect(() => solve({ ...base, rolePool: [...base.rolePool, "vortox"] })).not.toThrow();
  });
});
