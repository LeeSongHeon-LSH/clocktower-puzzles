// 2026-08-28 20차 확장: Barber(이발사) — 역할 타임라인(단일 교환).
// 이발사가 죽은 밤(처형이면 다음 밤), 데몬이 선한 두 좌석의 역할을 바꿨을 수 있다.
// 숨은 교환은 정직한 좌석의 주장과 스스로 모순되므로, 주장(asRole 이력)이 드러내는
// 교환만 살아남는다 — 교환 세계의 셋업 배정은 두 좌석의 주장 역할을 서로 바꾼 것이고,
// World.assignment는 최종(현재) 그리모어다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";

/** 8인: 이발사(7)가 밤2에 죽고, 1·2번이 교환 이력을 주장한다 */
function swapPuzzle(overrides: Partial<SolverPuzzle> = {}): SolverPuzzle {
  return {
    playerCount: 8,
    nights: 3,
    rolePool: [
      "imp", "poisoner", "barber", "chef", "empath", "undertaker",
      "librarian", "soldier", "mayor", "washerwoman",
    ],
    events: [
      { type: "death", night: 2, seat: 7 }, // 이발사 사망 → 그 밤부터 교환 창
      { type: "execution", day: 2, seat: 6 },
      { type: "death", night: 3, seat: 5 },
    ],
    claims: [
      { seat: 0, role: "chef", info: [] },
      {
        seat: 1,
        role: "undertaker", // 최종 역할
        info: [
          { night: 1, asRole: "empath", data: { type: "empath", count: 0 } }, // 교환 전 이력
          { night: 3, data: { type: "undertaker", shownRole: "washerwoman" } }, // 교환 후
        ],
      },
      { seat: 2, role: "empath", info: [{ night: 3, data: { type: "empath", count: 0 } }] },
      { seat: 3, role: "librarian", info: [] },
      { seat: 4, role: "soldier", info: [] },
      { seat: 5, role: "mayor", info: [] },
      { seat: 6, role: "washerwoman", info: [] },
      { seat: 7, role: "barber", info: [] },
    ],
    ...overrides,
  };
}

describe("Barber: 역할 교환", () => {
  it("교환 이력 주장이 참인 세계가 성립한다 — 셋업은 교차, 최종 그리모어는 주장대로", () => {
    const worlds = solve(swapPuzzle());
    // 1·2가 정직하게 교환된 세계: 최종적으로 1=장의사, 2=초공감자, 7=이발사
    expect(worlds.some(
      (w) => w.assignment[1] === "undertaker" && w.assignment[2] === "empath" && w.assignment[7] === "barber",
    )).toBe(true);
    // 이력 주장이 거짓말(1·2가 악역 콤비)인 세계도 공존한다 — 그게 퍼즐이다
    expect(worlds.some(
      (w) => ["imp", "poisoner"].includes(w.assignment[1]) && ["imp", "poisoner"].includes(w.assignment[2]),
    )).toBe(true);
  });

  it("이발사가 죽지 않으면 교환 세계가 없다 — 이력 주장자는 악역일 수밖에 없다", () => {
    const worlds = solve(swapPuzzle({
      events: [
        { type: "death", night: 2, seat: 3 }, // 이발사(7)는 살아 있다
        { type: "execution", day: 2, seat: 6 },
        { type: "death", night: 3, seat: 5 },
      ],
    }));
    // 밤1 초공감자 이력은 교환 없이는 성립 불가 — 1번이 선한 세계가 없다
    expect(worlds.every((w) => ["imp", "poisoner"].includes(w.assignment[1]))).toBe(true);
  });

  it("건전성 거부: 날조 수단 조합·10인·하수인 주장·이발사 없는 asRole", () => {
    expect(() => solve(swapPuzzle({ rolePool: [...swapPuzzle().rolePool, "drunk"] })))
      .toThrow(/이발사와/);
    const noBarberPool = swapPuzzle().rolePool.filter((r) => r !== "barber");
    expect(() => solve(swapPuzzle({ rolePool: noBarberPool })))
      .toThrow(/asRole/);
    const minionClaim = swapPuzzle();
    minionClaim.claims[0] = { seat: 0, role: "poisoner" as RoleId, info: [] };
    expect(() => solve(minionClaim)).toThrow(/하수인 역할 주장/);
  });

  it("교환 시점이 검증된다 — 교환 창 이후의 이력 주장은 성립하지 않는다", () => {
    // 밤3 정보를 '당시 초공감자로서'라고 주장 — 교환은 밤2부터라 밤3의 1번은 이미 장의사다
    const pz = swapPuzzle();
    pz.claims[1].info = [
      { night: 3, asRole: "empath", data: { type: "empath", count: 0 } },
    ];
    const worlds = solve(pz);
    expect(worlds.every((w) => w.assignment[1] !== "undertaker")).toBe(true);
  });
});
