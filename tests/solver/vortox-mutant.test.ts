// 2026-08-27 4차 확장: 데몬 자리 일반화 + Vortox(마을 정보 전부 거짓) + Mutant(주장 전체 날조).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios, tokenRoleAt } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

describe("Vortox: solve 통합", () => {
  // 6인: 0 공감술사, 1 은둔자, 2 요리사, 3 세탁부, 4 데몬, 5 첩자.
  // 모든 정보가 (등록 선택에 따라) 참일 수도 거짓일 수도 있게 설계 —
  // 같은 좌석 배치가 임프 세계로도 보르톡스 세계로도 성립해야 한다.
  const claims: SolverPuzzle["claims"] = [
    {
      seat: 0, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 1, role: "recluse", info: [] },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [1, 5], shownRole: "chef" } }] },
    { seat: 4, role: "empath", info: [] },
    { seat: 5, role: "chef", info: [] },
  ];
  const rolePool: RoleId[] = ["imp", "vortox", "spy", "empath", "recluse", "chef", "washerwoman"];
  const asImp = "empath,recluse,chef,washerwoman,imp,spy";
  const asVortox = "empath,recluse,chef,washerwoman,vortox,spy";

  it("같은 배치가 임프와 보르톡스 두 세계로 성립한다 (데몬 자리 일반화)", () => {
    const pz = makePuzzle({
      assignmentLength: 6, rolePool, claims, nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 },
        { type: "death", night: 2, seat: 3 },
      ],
    });
    const keys = solve(pz).map((w) => w.assignment.join(","));
    expect(keys).toContain(asImp);
    expect(keys).toContain(asVortox);
  });

  it("처형 없는 낮이 지났다면 보르톡스 세계는 성립하지 않는다", () => {
    const pz = makePuzzle({
      assignmentLength: 6, rolePool, claims, nights: 2,
      events: [{ type: "death", night: 2, seat: 3 }], // 낮1 처형 없음
    });
    const keys = solve(pz).map((w) => w.assignment.join(","));
    expect(keys).toContain(asImp);
    expect(keys.some((k) => k.includes("vortox"))).toBe(false);
  });

  it("거짓일 수 없는 정보는 보르톡스 세계를 죽인다 (독살범 부재 시)", () => {
    // 세탁부가 실제 공감술사(0)를 지목 — "0 또는 2가 공감술사"는 어떤 등록으로도 거짓이 될 수 없다
    const trueInfo: SolverPuzzle["claims"] = claims.map((c) =>
      c.seat === 3
        ? { ...c, info: [{ night: 1, data: { type: "washerwoman" as const, targets: [0, 2] as [number, number], shownRole: "empath" as const } }] }
        : c);
    const pz = makePuzzle({
      assignmentLength: 6, rolePool, claims: trueInfo, nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 },
        { type: "death", night: 2, seat: 3 },
      ],
    });
    const keys = solve(pz).map((w) => w.assignment.join(","));
    expect(keys).toContain(asImp);
    expect(keys).not.toContain(asVortox);
  });
});

describe("Vortox: 타임라인 — 탕녀는 죽은 데몬의 역할을 승계한다", () => {
  it("보르톡스 처형 후 탕녀가 보르톡스가 된다", () => {
    const assignment: RoleId[] = ["vortox", "scarletwoman", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "vortox", "scarletwoman"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 0 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 1)).toBe(true);
    expect(tokenRoleAt(assignment, scs[0], 1, 2)).toBe("vortox");
  });
});

describe("광인 (Mutant)", () => {
  it("불가능한 주장(깨어날 수 없는 밤의 정보)이 광인 세계로 설명된다", () => {
    // 좌석 1이 까마귀지기를 주장하며 밤2 정보를 내놓지만 죽은 적이 없다 —
    // 정직한 좌석이라면 구조 검증에서 탈락하고, 광인(날조)이면 통과한다.
    const pz = makePuzzle({
      assignmentLength: 6,
      rolePool: ["imp", "spy", "mutant", "empath", "chef", "washerwoman", "ravenkeeper"],
      nights: 2,
      claims: [
        { seat: 0, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
        { seat: 1, role: "ravenkeeper", info: [{ night: 2, data: { type: "ravenkeeper", target: 0, shownRole: "empath" } }] },
        { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
        { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 2], shownRole: "empath" } }] },
        { seat: 4, role: "chef", info: [] },
        { seat: 5, role: "empath", info: [] },
      ],
      events: [{ type: "death", night: 2, seat: 3 }],
    });
    const keys = solve(pz).map((w) => w.assignment.join(","));
    expect(keys).toContain("empath,mutant,chef,washerwoman,imp,spy");
    // 좌석 1이 정직한 까마귀지기인 세계는 없다 (죽지 않았는데 밤2에 깨어났다는 주장)
    expect(keys.some((k) => k.split(",")[1] === "ravenkeeper")).toBe(false);
  });

  it("광인은 밤에 깨어나지 않는다 — 객실 청소부가 주정뱅이와 가른다", () => {
    const ctx = makeCtx({
      assignment: ["imp", "spy", "mutant", "chef", "empath", "washerwoman", "librarian"],
      rolePool: ["imp", "spy", "mutant"],
      claims: [{ seat: 2, role: "empath", info: [] }],
    });
    expect(wakes(ctx, 2, 1)).toBe(false); // 공감술사를 사칭해도 실제로는 깨어나지 않는다
    expect(wakes(ctx, 4, 1)).toBe(true); // 진짜 공감술사는 깨어난다
  });
});
