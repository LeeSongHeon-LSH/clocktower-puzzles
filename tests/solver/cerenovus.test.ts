// 2026-08-28 18차 확장: Cerenovus(세레노부스) — 강제된 광기.
// 주장은 현재 낮의 스냅샷이므로 **마지막 밤의 광기 선택**만이 주장을 오염시킬 수 있다:
// 세레노부스가 판에 있으면 선한 좌석 하나의 주장 전체가 날조일 수 있고, 그 좌석의 실제
// 역할은 풀의 어떤 선한 역할이든 된다 ("최종 진실 주장" 규약의 통제된 예외).
// 성립 조건: 마지막 밤에 세레노부스가 살아 있고(비고르 유지 포함) 중독·취함이 아니어야 한다.

import { describe, expect, it } from "vitest";
import { ROLES } from "@/data/roles";
import { solve } from "@/lib/solver/solve";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";

const isGood = (r: RoleId) => ROLES[r].team === "townsfolk" || ROLES[r].team === "outsider";

function puzzle(rolePool: RoleId[], overrides: Partial<SolverPuzzle> = {}): SolverPuzzle {
  return {
    playerCount: 7,
    nights: 2,
    rolePool,
    events: [{ type: "death", night: 2, seat: 5 }],
    claims: [
      { seat: 0, role: "soldier", info: [] },
      { seat: 1, role: "empath", info: [{ night: 2, data: { type: "empath", count: 2 } }] },
      { seat: 2, role: "chef", info: [] },
      { seat: 3, role: "librarian", info: [] },
      { seat: 4, role: "washerwoman", info: [] },
      { seat: 5, role: "undertaker", info: [] },
      { seat: 6, role: "monk", info: [] },
    ],
    ...overrides,
  };
}

const POOL: RoleId[] = [
  "imp", "cerenovus", "soldier", "empath", "chef", "librarian", "washerwoman", "undertaker", "monk", "mayor",
];

describe("Cerenovus: 강제된 광기", () => {
  it("선한 좌석 하나의 주장 전체가 날조일 수 있다 — 세레노부스가 없으면 그 세계도 없다", () => {
    // 초공감자(1)의 count 2는 양옆이 선인인 세계에서 거짓 — 독살범이 없으니
    // '1번이 광기에 걸려 초공감자를 연기 중'인 세계만이 1번을 선하게 만든다
    const worlds = solve(puzzle(POOL));
    const madWorlds = worlds.filter((w) => isGood(w.assignment[1]) && w.assignment[1] !== "empath");
    expect(madWorlds.length).toBeGreaterThan(0);
    expect(madWorlds.every((w) => w.assignment.includes("cerenovus"))).toBe(true);
    // 대조: 하수인이 첩자면 광기 세계가 없다 — 1번이 선하려면 진짜 초공감자여야 하는데 거짓 정보라 불가
    const spyPool: RoleId[] = ["imp", "spy", ...POOL.slice(2)];
    const spyWorlds = solve(puzzle(spyPool));
    expect(spyWorlds.some((w) => isGood(w.assignment[1]) && w.assignment[1] !== "empath")).toBe(false);
  });

  it("광기는 한 좌석뿐 — 거짓 주장 두 개를 동시에 구제하지 못한다", () => {
    const pz = puzzle(POOL);
    pz.claims[2] = { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 3 } }] }; // 악역 2명뿐이라 불가능
    const worlds = solve(pz);
    // 1과 2가 동시에 선한 세계는 없다 (한쪽만 광기로 구제 가능)
    expect(worlds.some((w) => isGood(w.assignment[1]) && isGood(w.assignment[2]))).toBe(false);
    // 각각 따로는 구제된다
    expect(worlds.some((w) => isGood(w.assignment[1]))).toBe(true);
    expect(worlds.some((w) => isGood(w.assignment[2]))).toBe(true);
  });

  it("광기 좌석의 실제 역할이 외부인일 수 있다 — 구성의 외부인 슬롯을 채운다 (8인)", () => {
    const pool: RoleId[] = [...POOL, "recluse", "fortuneteller"];
    const worlds = solve({
      playerCount: 8,
      nights: 2,
      rolePool: pool,
      events: [{ type: "death", night: 2, seat: 5 }],
      claims: [
        { seat: 0, role: "soldier", info: [] },
        { seat: 1, role: "empath", info: [{ night: 2, data: { type: "empath", count: 2 } }] },
        { seat: 2, role: "chef", info: [] },
        { seat: 3, role: "librarian", info: [] },
        { seat: 4, role: "washerwoman", info: [] },
        { seat: 5, role: "undertaker", info: [] },
        { seat: 6, role: "monk", info: [] },
        { seat: 7, role: "fortuneteller", info: [] },
      ],
    });
    // 8인 = 외부인 1 — 광기 좌석(1)의 실제 역할이 은둔자인 세계가 외부인 슬롯을 채운다
    expect(worlds.some((w) => w.assignment[1] === "recluse")).toBe(true);
  });

  it("풀에 세레노부스가 있으면 미모델 선한 역할이 배정 가능해져 거부된다 (건전성)", () => {
    expect(() => solve(puzzle([...POOL, "snakecharmer"]))).toThrow(/모르는 역할/);
  });

  it("죽은 세레노부스는 광기를 강제하지 못한다 — 처형으로 확정된 경우", () => {
    // 낮1에 세레노부스가 처형됐음을 장의사가 확인한 세계에서는 밤2 광기가 불가능하다
    const pz = puzzle(POOL, {
      nights: 2,
      events: [
        { type: "execution", day: 1, seat: 4 },
        { type: "death", night: 2, seat: 5 },
      ],
    });
    pz.claims[5] = {
      seat: 5, role: "undertaker",
      info: [{ night: 2, data: { type: "undertaker", shownRole: "cerenovus" } }],
    };
    const worlds = solve(pz);
    // 광기 세계(1번이 선한 비초공감자)에서는 세레노부스가 밤2 시작에 살아 있어야 하므로,
    // 처형된 좌석 4가 세레노부스일 수 없다 — 장의사 정보와 광기가 양립하려면
    // 장의사(5)가 비정상이거나 다른 설명이 필요한데 독살범이 없어 불가
    const madWorlds = worlds.filter((w) => isGood(w.assignment[1]) && w.assignment[1] !== "empath");
    expect(madWorlds.every((w) => w.assignment[4] !== "cerenovus")).toBe(true);
  });
});
