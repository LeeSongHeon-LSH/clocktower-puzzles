// 2026-08-27 9차 확장: Shabaloth — 밤마다 2명을 고르는 데몬. 시신도 고를 수 있어(역류
// 시도) 실제 사망 0~2건이 전부 설명 없이 성립한다 (관대한 근사). 역류(부활)는 이벤트로
// 표현 불가 — 발동한 게임은 입력될 수 없다 (timeline.ts의 killSets 확장).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const base: RoleId[] = ["shabaloth", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];

describe("Shabaloth: 조용한 밤", () => {
  it("킬 부재가 설명 없이 성립한다 — 시신을 골랐을 수 있다", () => {
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["imp", "shabaloth", "spy"], nights: 2 });
    expect(demonScenarios(pz, new Schedule(pz), base).length).toBeGreaterThan(0);
    // 임프였다면 같은 배정에서 킬 부재를 설명할 수단이 없다
    const imp: RoleId[] = ["imp", ...base.slice(1)];
    expect(demonScenarios(pz, new Schedule(pz), imp)).toHaveLength(0);
  });

  it("밤2부터 깨어난다", () => {
    const ctx = makeCtx({ assignment: base, rolePool: ["shabaloth", "spy"], nights: 2 });
    expect(wakes(ctx, 0, 1)).toBe(false);
    expect(wakes(ctx, 0, 2)).toBe(true);
  });
});

describe("Shabaloth: 2킬", () => {
  it("밤2의 2인 사망이 데몬 단독으로 귀속된다 — 임프는 불가", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["shabaloth", "spy"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "death", night: 2, seat: 3 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    // 두 죽음 전부가 데몬 킬 목록에 담기는 시나리오가 있다 (현자 기상 판정용)
    expect(scs.some((s) => {
      const kills = s.impKillDuringNight?.[2] ?? [];
      return [2, 3].every((x) => kills.includes(x));
    })).toBe(true);
    const imp: RoleId[] = ["imp", ...base.slice(1)];
    expect(demonScenarios(pz, new Schedule(pz), imp)).toHaveLength(0);
  });

  it("한 밤 3인 사망은 샤바로스 단독으로 모순", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["shabaloth", "spy"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "death", night: 2, seat: 3 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
  });

  it("킬마다 임프와 같은 부수효과 — 군인이 죽었다면 그 밤 중독 강제", () => {
    const withSoldier: RoleId[] = ["shabaloth", "spy", "soldier", "chef", "empath", "librarian", "washerwoman"];
    const events = [
      { type: "death", night: 2, seat: 2 } as const,
      { type: "death", night: 2, seat: 3 } as const,
    ];
    // 독살범 없이는 군인의 밤 사망을 설명할 수 없다
    const pzNoPoisoner = makePuzzle({ assignmentLength: 7, rolePool: ["shabaloth", "spy"], nights: 2, events: [...events] });
    expect(demonScenarios(pzNoPoisoner, new Schedule(pzNoPoisoner), withSoldier)).toHaveLength(0);
    // 독살범이 있으면 "군인이 그 밤 중독됐다"로 성립한다
    const withPoisoner: RoleId[] = ["shabaloth", "poisoner", "soldier", "chef", "empath", "librarian", "washerwoman"];
    const pzPoisoner = makePuzzle({ assignmentLength: 7, rolePool: ["shabaloth", "poisoner"], nights: 2, events: [...events] });
    const scs = demonScenarios(pzPoisoner, new Schedule(pzPoisoner), withPoisoner);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
  });
});

describe("Shabaloth: 승계", () => {
  it("밤에 죽은 샤바로스는 탕녀만 승계한다 — 스타 패스는 임프 전용", () => {
    const events = [{ type: "death", night: 2, seat: 0 } as const]; // 자기 자신을 고를 수 있다
    const withSw: RoleId[] = ["shabaloth", "scarletwoman", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pzSw = makePuzzle({ assignmentLength: 7, rolePool: ["shabaloth", "scarletwoman"], nights: 2, events: [...events] });
    const scs = demonScenarios(pzSw, new Schedule(pzSw), withSw);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 1)).toBe(true);

    const withSpy: RoleId[] = ["shabaloth", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pzSpy = makePuzzle({ assignmentLength: 7, rolePool: ["shabaloth", "spy"], nights: 2, events: [...events] });
    expect(demonScenarios(pzSpy, new Schedule(pzSpy), withSpy)).toHaveLength(0);
  });
});

describe("Shabaloth: solve 통합", () => {
  it("설명 없는 2인 사망 밤이 임프 세계를 지우고 샤바로스 세계만 남긴다", () => {
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp", "shabaloth", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller", "undertaker", "clockmaker"],
      nights: 2,
      claims: [
        { seat: 0, role: "empath", info: [] },
        { seat: 1, role: "chef", info: [] },
        { seat: 2, role: "librarian", info: [] },
        { seat: 3, role: "washerwoman", info: [] },
        { seat: 4, role: "fortuneteller", info: [] },
        { seat: 5, role: "undertaker", info: [] },
        { seat: 6, role: "clockmaker", info: [] },
      ],
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "death", night: 2, seat: 3 },
      ],
    });
    const worlds = solve(pz);
    expect(worlds.length).toBeGreaterThan(0);
    expect(worlds.every((w) => w.assignment.includes("shabaloth"))).toBe(true);
  });
});
