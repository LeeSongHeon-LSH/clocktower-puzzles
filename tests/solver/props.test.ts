// 2026-08-28 19차 확장: 구조화 명제 스키마 + Savant(학자)·Artist(화가).
// 낮 정보 (info.night = 낮 n — 독 지속 창과 일치, 밤에 깨지 않는다).
// 화가: 멀쩡하면 답이 진실 (등록 ∃ — 은둔자는 악마로, 첩자는 선한 역할로 등록 가능).
// 학자: 멀쩡하면 두 진술 중 정확히 하나만 참, Vortox 세계에선 둘 다 거짓 (공식 룰링).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import type { Prop, RoleId, SolverPuzzle } from "@/lib/solver/types";

function puzzle(rolePool: RoleId[], overrides: Partial<SolverPuzzle> = {}): SolverPuzzle {
  return {
    playerCount: 7,
    nights: 2,
    rolePool,
    events: [{ type: "death", night: 2, seat: 5 }],
    claims: [
      { seat: 0, role: "soldier", info: [] },
      { seat: 1, role: "artist", info: [] },
      { seat: 2, role: "chef", info: [] },
      { seat: 3, role: "empath", info: [] },
      { seat: 4, role: "washerwoman", info: [] },
      { seat: 5, role: "undertaker", info: [] },
      { seat: 6, role: "monk", info: [] },
    ],
    ...overrides,
  };
}

const POOL: RoleId[] = [
  "imp", "poisoner", "artist", "savant", "soldier", "chef", "empath", "washerwoman", "undertaker", "monk",
];

describe("Artist: 낮의 예/아니오 질문", () => {
  it("'C는 악마인가 → 아니다'는 C가 실제 데몬인 세계에서 화가의 중독을 강제한다", () => {
    const pz = puzzle(POOL);
    pz.claims[1].info = [{ night: 1, data: { type: "artist", question: { kind: "isDemon", seat: 2 }, yes: false } }];
    const worlds = solve(pz);
    expect(worlds.length).toBeGreaterThan(0);
    const demonAt2 = worlds.filter((w) => w.assignment[2] === "imp" && w.assignment[1] === "artist");
    expect(demonAt2.length).toBeGreaterThan(0);
    // 낮1 질문 = 밤1 독 지속 창 — 화가가 그때 중독됐어야 한다
    expect(demonAt2.every((w) => w.poisonTargets[1] === 1)).toBe(true);
    // 데몬이 다른 곳인 세계는 중독 없이 성립한다
    expect(worlds.some((w) => w.assignment[2] !== "imp" && w.assignment[1] === "artist" && w.poisonTargets[1] === null)).toBe(true);
  });

  it("은둔자는 악마로 등록될 수 있어 '그렇다' 답이 자유다 (∃)", () => {
    const pool: RoleId[] = [...POOL, "recluse"];
    const pz = puzzle(pool, { playerCount: 8 });
    pz.claims.push({ seat: 7, role: "recluse", info: [] });
    pz.claims[1].info = [{ night: 1, data: { type: "artist", question: { kind: "isDemon", seat: 7 }, yes: true } }];
    const worlds = solve(pz);
    // 좌석 7이 진짜 은둔자인데도 "악마다"라는 진실 답이 성립하는 세계가 있다
    expect(worlds.some((w) => w.assignment[7] === "recluse" && w.assignment[1] === "artist" && w.poisonTargets[1] === null)).toBe(true);
  });
});

describe("Savant: 하나는 참, 하나는 거짓", () => {
  const savantClaim = (statements: [Prop, Prop]) => ({
    seat: 1,
    role: "savant" as RoleId,
    info: [{ night: 1, data: { type: "savant" as const, statements } }],
  });

  it("두 진술이 모두 참일 수밖에 없으면 학자의 중독이 강제된다", () => {
    const pz = puzzle(POOL);
    // "0은 악하다" + "2는 악하다" — 두 좌석이 모두 악역인 세계에서는 정확히-하나가 불가능
    pz.claims[1] = savantClaim([{ kind: "isEvil", seat: 0 }, { kind: "isEvil", seat: 2 }]);
    const worlds = solve(pz);
    const bothEvil = worlds.filter(
      (w) => w.assignment[1] === "savant"
        && ["imp", "poisoner"].includes(w.assignment[0])
        && ["imp", "poisoner"].includes(w.assignment[2]),
    );
    expect(bothEvil.length).toBeGreaterThan(0);
    expect(bothEvil.every((w) => w.poisonTargets[1] === 1)).toBe(true);
    // 한쪽만 악역인 세계는 중독 없이 성립한다
    expect(worlds.some((w) => w.assignment[1] === "savant" && w.poisonTargets[1] === null)).toBe(true);
  });

  it("'주정뱅이가 판에 있다'가 참이 되려면 주정뱅이가 실제로 있어야 한다 (8인, 첩자 없음)", () => {
    const pool: RoleId[] = [...POOL, "drunk", "librarian"];
    const pz = puzzle(pool, { playerCount: 8 });
    pz.claims.push({ seat: 7, role: "librarian", info: [] });
    // "주정뱅이가 판에 있다"(참일 때) + "0은 악하다"(거짓일 때) 조합
    pz.claims[1] = savantClaim([{ kind: "roleInPlay", role: "drunk" }, { kind: "isEvil", seat: 0 }]);
    const worlds = solve(pz);
    // 0이 선한 세계에서 두 진술이 (참, 거짓)이려면 주정뱅이가 판에 있어야 하고,
    // (거짓, 참)이려면 0이 악해야 한다 — 0이 선하고 주정뱅이도 없으면 중독 강제
    const clean = worlds.filter(
      (w) => w.assignment[1] === "savant" && !["imp", "poisoner"].includes(w.assignment[0])
        && !w.assignment.includes("drunk") && w.poisonTargets[1] === null,
    );
    expect(clean).toHaveLength(0);
    expect(worlds.some((w) => w.assignment.includes("drunk") && w.poisonTargets[1] === null)).toBe(true);
  });

  it("Vortox 세계에서는 둘 다 거짓이어야 한다 — 반드시 참인 진술이 있으면 성립하지 않는다", () => {
    // 풀에 vortox와 imp가 함께 있다 (명제의 역할은 대본 안에 있어야 한다).
    // Vortox 세계에서 "보르톡스가 판에 있다"는 거짓일 수 없고, "임프가 판에 있다"는 거짓이다.
    const pool: RoleId[] = ["vortox", "imp", "poisoner", "savant", "soldier", "chef", "empath", "washerwoman", "undertaker", "monk"];
    const mk = (role: RoleId) => {
      const pz = puzzle(pool, {
        events: [
          { type: "execution", day: 1, seat: 6 }, // Vortox: 처형 없는 낮이 없어야 한다
          { type: "death", night: 2, seat: 5 },
        ],
      });
      pz.claims[1] = savantClaim([{ kind: "roleInPlay", role }, { kind: "isEvil", seat: 0 }]);
      return solve(pz);
    };
    const soberSavantVortox = (worlds: ReturnType<typeof solve>) =>
      worlds.filter((w) => w.assignment.includes("vortox") && w.assignment[1] === "savant" && w.poisonTargets[1] === null);
    // "보르톡스가 판에 있다"는 Vortox 세계에서 거짓 불가 → 멀쩡한 학자와 양립하지 않는다
    expect(soberSavantVortox(mk("vortox"))).toHaveLength(0);
    // "임프가 판에 있다"는 Vortox 세계에서 거짓 → 둘 다 거짓이 성립한다
    expect(soberSavantVortox(mk("imp")).length).toBeGreaterThan(0);
  });
});
