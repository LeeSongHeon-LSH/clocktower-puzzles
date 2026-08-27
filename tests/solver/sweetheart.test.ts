// 2026-08-27 3차 확장: 스위트하트 — 죽는 순간부터 1명이 계속 취한다.
// 사망 시점은 이벤트로 고정되므로 취함 대상 1명(또는 사망 순간 중독으로 미발동)만 열거한다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios, type SweetheartCase } from "@/lib/solver/timeline";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";
import { makePuzzle } from "./helpers";

describe("스위트하트: solve 통합", () => {
  // 6인: 0 공감술사, 1 스위트하트, 2 요리사, 3 임프, 4 첩자, 5 세탁부.
  // 공감술사의 밤2 정보(count 2)는 어떤 등록으로도 성립하지 않고 독살범도 없다 —
  // 밤2에 죽은 스위트하트의 취함(대상: 공감술사)만이 유일한 설명이다.
  const claims: SolverPuzzle["claims"] = [
    {
      seat: 0, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 2 } },
      ],
    },
    { seat: 1, role: "sweetheart", info: [] },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 3, role: "chef", info: [] },
    { seat: 4, role: "washerwoman", info: [] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 2], shownRole: "empath" } }] },
  ];
  const rolePool: RoleId[] = ["imp", "spy", "empath", "sweetheart", "chef", "washerwoman"];
  const intended = "empath,sweetheart,chef,imp,spy,washerwoman";

  it("사망 이후의 불가능한 정보를 취함 대상 열거로 설명한다", () => {
    const pz = makePuzzle({
      assignmentLength: 6, rolePool, claims, nights: 2,
      events: [{ type: "death", night: 2, seat: 1 }], // 스위트하트 사망 → 밤2부터 취함 발동
    });
    const worlds = solve(pz).filter((w) => w.assignment.join(",") === intended);
    expect(worlds.length).toBe(1);
    expect(worlds[0].sweetheartDrunk).toBe(0); // 취한 사람은 공감술사여야만 한다
  });

  it("스위트하트가 살아 있으면 같은 정보가 설명되지 않는다", () => {
    const pz = makePuzzle({
      assignmentLength: 6, rolePool, claims, nights: 2,
      events: [{ type: "death", night: 2, seat: 5 }], // 세탁부가 대신 죽는다
    });
    const worlds = solve(pz).filter((w) => w.assignment.join(",") === intended);
    expect(worlds.length).toBe(0);
  });
});

describe("스위트하트: 타임라인 제약", () => {
  const withPoisoner: RoleId[] = ["imp", "poisoner", "sweetheart", "saint", "empath", "librarian", "washerwoman"];

  it("미발동(target: null)에는 사망 순간의 중독이 강제된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "sweetheart", "saint"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 }, // 스위트하트 처형
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const sweet: SweetheartCase = { sweetSeat: 2, deathNight: 1, since: 1.5, target: null };
    const scs = demonScenarios(pz, new Schedule(pz), withPoisoner, sweet);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);

    // 독살범이 없으면 미발동 분기 자체가 성립하지 않는다
    const noPoisoner: RoleId[] = ["imp", "spy", "sweetheart", "saint", "empath", "librarian", "washerwoman"];
    expect(demonScenarios(pz, new Schedule(pz), noPoisoner, sweet).length).toBe(0);
  });

  it("취한 독살범의 독은 듣지 않는다 — 이후의 독살 강제가 모순이 된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "sweetheart", "saint"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 2 }, // 스위트하트 사망
        { type: "execution", day: 2, seat: 3 }, // 성자 처형 → 그 밤 중독 강제
        { type: "death", night: 3, seat: 4 },
      ],
    });
    const sched = new Schedule(pz);
    // 취함 대상이 독살범이면 성자 처형을 설명할 독이 없다
    const drunkPoisoner: SweetheartCase = { sweetSeat: 2, deathNight: 2, since: 2, target: 1 };
    expect(demonScenarios(pz, sched, withPoisoner, drunkPoisoner).length).toBe(0);
    // 취함 대상이 다른 좌석이면 성자의 독살 강제가 정상 성립한다
    const drunkOther: SweetheartCase = { sweetSeat: 2, deathNight: 2, since: 2, target: 5 };
    const scs = demonScenarios(pz, sched, withPoisoner, drunkOther);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(2) === 3)).toBe(true);
  });
});
