// 수학자 범위 판정 — 참 판정과 보르톡스 거짓 판정이 같은 [min, max]를 소비해야 한다.
//
// 2026-09-08 리뷰에서 잡힌 두 결함의 회귀 테스트:
// (1) 거짓 판정이 이동식 취함을 세지 않아 보르톡스 세계에서 참·거짓이 뒤집혔다.
// (8) 참 판정이 푸카·비고르모르티스의 관대 독 집합을 세지 않아 유효한 세계를 지웠다
//     (REQUIREMENTS §2.4 "관대한 방향 — 유일해를 거짓으로 증명하지 않는다" 위반).

import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/solver/solve";
import type { SolverPuzzle, World } from "@/lib/solver/types";

const worldsWhere = (pz: SolverPuzzle, pred: (w: World) => boolean) => analyze(pz).worlds.filter(pred);

describe("수학자 — 푸카 독 피해자를 센다 (관대 집합은 max에만)", () => {
  // 0 푸카(시장 사칭)·6 탕녀, 1 수학자, 2 공감자. 밤1 푸카가 공감자를 중독 → 밤2 공감자 사망.
  // 밤1의 공감자는 중독된 채 깨어났으므로 수학자는 1명을 볼 수 있다 (0명도 관대하게 허용).
  const build = (count: number): SolverPuzzle => ({
    playerCount: 7,
    nights: 2,
    rolePool: ["pukka", "scarletwoman", "mayor", "mathematician", "empath", "chef", "librarian", "washerwoman", "slayer", "soldier", "undertaker"],
    claims: [
      { seat: 0, role: "mayor", info: [] },
      { seat: 1, role: "mathematician", info: [{ night: 1, data: { type: "mathematician", count } }] },
      { seat: 2, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
      { seat: 3, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
      { seat: 4, role: "librarian", info: [{ night: 1, data: { type: "librarian", targets: null } }] },
      { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [3, 4], shownRole: "chef" } }] },
      { seat: 6, role: "slayer", info: [] },
    ],
    events: [{ type: "death", night: 2, seat: 2 }],
  });
  const target = (w: World) => w.assignment[0] === "pukka" && w.assignment[6] === "scarletwoman";

  it("1명(실제 값)이어도 정답 세계가 남는다", () => {
    expect(worldsWhere(build(1), target)).toHaveLength(1);
  });
  it("0명(독이 새었을 수 있음)도 남는다", () => {
    expect(worldsWhere(build(0), target)).toHaveLength(1);
  });
  it("2명은 범위 밖이다", () => {
    expect(worldsWhere(build(2), target)).toHaveLength(0);
  });
});

describe("수학자 — 비고르모르티스에게 죽은 하수인의 이웃 독을 센다", () => {
  // 0 비고르모르티스(시장 사칭), 1 탕녀(처단자 사칭)가 밤2 데몬에게 죽어 능력 유지,
  // 가장 가까운 마을 사람 이웃이 계속 중독. 3 수학자가 밤2에 1명을 본다.
  const build = (count: number): SolverPuzzle => ({
    playerCount: 7,
    nights: 2,
    rolePool: ["vigormortis", "scarletwoman", "mayor", "mathematician", "empath", "chef", "librarian", "washerwoman", "slayer", "soldier", "undertaker"],
    claims: [
      { seat: 0, role: "mayor", info: [] },
      { seat: 1, role: "slayer", info: [] },
      { seat: 2, role: "empath", info: [{ night: 1, data: { type: "empath", count: 1 } }] },
      { seat: 3, role: "mathematician", info: [{ night: 2, data: { type: "mathematician", count } }] },
      { seat: 4, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
      { seat: 5, role: "librarian", info: [{ night: 1, data: { type: "librarian", targets: null } }] },
      { seat: 6, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [4, 5], shownRole: "chef" } }] },
    ],
    events: [{ type: "death", night: 2, seat: 1 }],
  });
  const target = (w: World) => w.assignment[0] === "vigormortis" && w.assignment[1] === "scarletwoman";

  it("1명(실제 값)이어도 정답 세계가 남는다", () => {
    expect(worldsWhere(build(1), target)).toHaveLength(1);
  });
  it("0명도 남는다", () => {
    expect(worldsWhere(build(0), target)).toHaveLength(1);
  });
});

describe("수학자 — 보르톡스 거짓 판정은 참 판정의 정확한 부정이다", () => {
  // 0 보르톡스(시장 사칭)·1 탕녀, 2 선원(밤1: 3을 고름), 3 공감자, 4 수학자.
  // 선원 분기 어느 쪽이든 깨어난 좌석 하나가 확정 취함 → 참값 범위 [1, 1].
  const build = (count: number): SolverPuzzle => ({
    playerCount: 7,
    nights: 1,
    rolePool: ["vortox", "scarletwoman", "mayor", "slayer", "sailor", "empath", "mathematician", "chef", "washerwoman", "soldier", "undertaker"],
    claims: [
      { seat: 0, role: "mayor", info: [] },
      { seat: 1, role: "slayer", info: [] },
      { seat: 2, role: "sailor", info: [{ night: 1, data: { type: "sailor", target: 3 } }] },
      { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 2 } }] },
      { seat: 4, role: "mathematician", info: [{ night: 1, data: { type: "mathematician", count } }] },
      { seat: 5, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
      { seat: 6, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [3, 4], shownRole: "chef" } }] },
    ],
    events: [],
  });
  const target = (w: World) => w.assignment[0] === "vortox" && w.assignment[1] === "scarletwoman";

  it("0명 — 거짓 정보라 보르톡스 세계가 성립한다", () => {
    expect(worldsWhere(build(0), target)).toHaveLength(1);
  });
  it("1명 — 참 정보라 보르톡스 세계가 모순이다", () => {
    expect(worldsWhere(build(1), target)).toHaveLength(0);
  });
});
