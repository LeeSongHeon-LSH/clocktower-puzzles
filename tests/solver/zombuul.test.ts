// 2026-08-27 10차 확장: Zombuul — 직전 낮에 처형 사망이 있으면 깨어나지 않는 데몬 (그 밤
// 킬 불가·킬 부재 공짜). 첫 죽음은 가짜 — 등록상 죽지만 비밀리에 생존해 계속 킬하고,
// 탕녀 승계도 없다. 중독된 채 죽으면 정말로 죽는다 (timeline.ts의 zombuulFakeDeadAt).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const base: RoleId[] = ["zombuul", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];

describe("Zombuul: 킬 조건 — 직전 낮의 처형 사망", () => {
  it("처형이 있던 낮 다음 밤의 킬 부재는 공짜다 — 임프는 설명이 없어 모순", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "zombuul", "spy"], nights: 2,
      events: [{ type: "execution", day: 1, seat: 3 }],
    });
    expect(demonScenarios(pz, new Schedule(pz), base).length).toBeGreaterThan(0);
    const imp: RoleId[] = ["imp", ...base.slice(1)];
    expect(demonScenarios(pz, new Schedule(pz), imp)).toHaveLength(0);
  });

  it("처형이 있던 낮 다음 밤에는 킬이 불가 — 그 밤의 사망은 다른 수단이 없으면 모순", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["zombuul", "spy"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 3 },
        { type: "death", night: 2, seat: 2 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
  });

  it("처형 없는 낮 다음의 조용한 밤은 공짜가 아니다 — 임프처럼 설명이 필요하다", () => {
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["zombuul", "spy"], nights: 2 });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
    // 군인이 있으면 '멀쩡한 군인을 노렸다'로 성립한다
    const withSoldier: RoleId[] = ["zombuul", "spy", "soldier", "chef", "librarian", "washerwoman", "fortuneteller"];
    expect(demonScenarios(pz, new Schedule(pz), withSoldier).length).toBeGreaterThan(0);
  });

  it("처형 없는 낮 다음 밤에는 임프처럼 킬한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["zombuul", "spy"], nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    expect(demonScenarios(pz, new Schedule(pz), base).length).toBeGreaterThan(0);
  });
});

describe("Zombuul: 가짜 죽음", () => {
  it("처형돼도 탕녀 없이 게임이 계속된다 — 등록상 죽고 비밀리에 생존", () => {
    // 밤2 킬 → 낮2 좀부울 처형(가짜 죽음) → 밤3은 처형 다음이라 조용해도 공짜
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["zombuul", "spy"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "execution", day: 2, seat: 0 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 0)).toBe(true);
    expect(scs.every((s) => s.zombuulFakeDeadAt === 2.5)).toBe(true);
    // 임프였다면 탕녀 없는 처형으로 게임이 끝났어야 한다
    const imp: RoleId[] = ["imp", ...base.slice(1)];
    expect(demonScenarios(pz, new Schedule(pz), imp)).toHaveLength(0);
  });

  it("가짜 죽음 후에도 계속 킬한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["zombuul", "spy"], nights: 4,
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "execution", day: 2, seat: 0 },
        { type: "death", night: 4, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 0)).toBe(true);
    expect(scs.some((s) => s.impKillDuringNight?.[4]?.includes(4))).toBe(true);
  });

  it("밤 사망도 첫 번째는 가짜다 — 승계 없이 계속된다", () => {
    const withGossip: RoleId[] = ["zombuul", "spy", "gossip", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["zombuul", "spy", "gossip"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 0 },
        { type: "death", night: 3, seat: 3 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withGossip);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 0)).toBe(true);
    expect(scs.every((s) => s.zombuulFakeDeadAt === 2)).toBe(true);
  });

  it("중독된 채 처형되면 정말로 죽는다 — 그때만 탕녀 승계", () => {
    // 밤2 조용(좀부울 중독으로 설명) → 그 독이 낮2까지 지속 → 처형 = 진짜 죽음 → 탕녀 승계
    const withSw: RoleId[] = ["zombuul", "scarletwoman", "poisoner", "chef", "librarian", "washerwoman", "fortuneteller"];
    const events = [{ type: "execution", day: 2, seat: 0 } as const];
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["zombuul", "scarletwoman", "poisoner"], nights: 3, events: [...events] });
    const scs = demonScenarios(pz, new Schedule(pz), withSw);
    expect(scs.length).toBeGreaterThan(0);
    // 조용한 밤2의 유일한 설명이 좀부울 중독이라 가짜 죽음(멀쩡함 필요)은 성립하지 않는다
    expect(scs.every((s) => s.currentDemonSeat === 1)).toBe(true);
    expect(scs.every((s) => s.poisonRequired.get(2) === 0)).toBe(true);
    // 탕녀가 없으면 진짜 죽음으로 게임이 끝났어야 한다
    const noSw: RoleId[] = ["zombuul", "spy", "poisoner", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pzNoSw = makePuzzle({ assignmentLength: 7, rolePool: ["zombuul", "spy", "poisoner"], nights: 3, events: [...events] });
    expect(demonScenarios(pzNoSw, new Schedule(pzNoSw), noSw)).toHaveLength(0);
  });
});

describe("Zombuul: 기상", () => {
  it("직전 낮에 처형이 있으면 깨어나지 않는다", () => {
    const rested = makeCtx({
      assignment: base, rolePool: ["zombuul", "spy"], nights: 2,
      events: [{ type: "execution", day: 1, seat: 3 }],
    });
    expect(wakes(rested, 0, 2)).toBe(false);
    const hunting = makeCtx({ assignment: base, rolePool: ["zombuul", "spy"], nights: 2 });
    expect(wakes(hunting, 0, 1)).toBe(false);
    expect(wakes(hunting, 0, 2)).toBe(true);
  });

  it("가짜 죽음 후에도 (등록상 사망) 계속 깨어난다", () => {
    const ctx = makeCtx({
      assignment: base, rolePool: ["zombuul", "spy"], nights: 3,
      events: [{ type: "death", night: 2, seat: 0 }],
    });
    expect(wakes(ctx, 0, 3)).toBe(false); // 등록상 죽었고 가짜 죽음 표시가 없으면 안 깬다
    ctx.sc = { ...ctx.sc, zombuulFakeDeadAt: 2 };
    expect(wakes(ctx, 0, 3)).toBe(true);
  });
});

describe("Zombuul: solve 통합", () => {
  it("처형 다음의 조용한 밤이 임프 세계를 지우고 좀부울 세계만 남긴다", () => {
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp", "zombuul", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller", "undertaker", "oracle"],
      nights: 2,
      claims: [
        { seat: 0, role: "empath", info: [] },
        { seat: 1, role: "chef", info: [] },
        { seat: 2, role: "librarian", info: [] },
        { seat: 3, role: "washerwoman", info: [] },
        { seat: 4, role: "fortuneteller", info: [] },
        { seat: 5, role: "undertaker", info: [] },
        { seat: 6, role: "oracle", info: [] },
      ],
      events: [{ type: "execution", day: 1, seat: 3 }],
    });
    const worlds = solve(pz);
    expect(worlds.length).toBeGreaterThan(0);
    expect(worlds.every((w) => w.assignment.includes("zombuul"))).toBe(true);
  });
});
