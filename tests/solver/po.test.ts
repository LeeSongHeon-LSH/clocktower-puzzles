// 2026-08-27 8차 확장: Po — 밤마다 0명 또는 1명을 고르는 데몬. '아무도 안 함'은 자발적
// 선택이라 킬 부재 설명이 공짜고, 그 다음 밤에는 반드시 3명을 골라 최대 3킬이 난다.
// 봉쇄·승계는 선택이 아니므로 3킬을 열지 않는다 (timeline.ts의 poChoseNone 추적).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const base: RoleId[] = ["po", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];

describe("Po: 조용한 밤", () => {
  it("킬 부재가 설명 없이 성립한다 — 독살범·군인·수도사 없는 풀에서도", () => {
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["imp", "po", "spy"], nights: 2 });
    expect(demonScenarios(pz, new Schedule(pz), base).length).toBeGreaterThan(0);
    // 임프였다면 같은 배정에서 킬 부재를 설명할 수단이 없다
    const imp: RoleId[] = ["imp", ...base.slice(1)];
    expect(demonScenarios(pz, new Schedule(pz), imp)).toHaveLength(0);
  });

  it("밤2부터 깨어난다 — 조용한 밤에도 선택하러 깬다", () => {
    const ctx = makeCtx({ assignment: base, rolePool: ["po", "spy"], nights: 2 });
    expect(wakes(ctx, 0, 1)).toBe(false);
    expect(wakes(ctx, 0, 2)).toBe(true);
  });
});

describe("Po: 3킬", () => {
  it("밤2의 다중 사망은 Po 단독으로 귀속되지 않는다 — 아직 '아무도 안 함'이 없었다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["po", "spy"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "death", night: 2, seat: 3 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
  });

  it("조용한 밤 다음 밤에는 3킬이 성립한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["po", "spy"], nights: 3,
      events: [
        { type: "death", night: 3, seat: 2 },
        { type: "death", night: 3, seat: 3 },
        { type: "death", night: 3, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    // 세 죽음 전부가 데몬 킬 목록에 담긴다 (현자 기상 판정용)
    expect(scs.some((s) => {
      const kills = s.impKillDuringNight?.[3] ?? [];
      return [2, 3, 4].every((x) => kills.includes(x));
    })).toBe(true);
  });

  it("구마사제 봉쇄로 조용했던 밤은 3킬을 열지 않는다 — 기상 자체가 없었다", () => {
    const withExo: RoleId[] = ["po", "spy", "exorcist", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["po", "spy", "exorcist"], nights: 3,
      events: [
        { type: "death", night: 3, seat: 3 },
        { type: "death", night: 3, seat: 4 },
        { type: "death", night: 3, seat: 5 },
      ],
    });
    // 밤2의 킬 부재를 봉쇄로 설명한 시나리오에서는 밤3 3킬이 열리지 않는다 —
    // 성립하는 시나리오는 전부 '아무도 안 함' 쪽이다
    const scs = demonScenarios(pz, new Schedule(pz), withExo);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => !s.exorcistBlocked?.has(2))).toBe(true);
  });

  it("조용한 밤 없이 이어진 밤의 다중 사망은 다른 귀속 수단이 없으면 모순", () => {
    // 밤2에 1명을 죽였다면(선택함) 밤3의 3킬이 열리지 않는다
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["po", "spy"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "death", night: 3, seat: 3 },
        { type: "death", night: 3, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
  });
});

describe("Po: 승계", () => {
  it("밤에 죽은 Po는 탕녀만 승계한다 — 스타 패스는 임프 전용", () => {
    const events = [{ type: "death", night: 2, seat: 0 } as const]; // 소문꾼의 참 발언이 Po를 잡는다
    const withSw: RoleId[] = ["po", "scarletwoman", "gossip", "chef", "empath", "librarian", "washerwoman"];
    const pzSw = makePuzzle({ assignmentLength: 7, rolePool: ["po", "scarletwoman", "gossip"], nights: 2, events: [...events] });
    const scs = demonScenarios(pzSw, new Schedule(pzSw), withSw);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 1)).toBe(true);

    const withSpy: RoleId[] = ["po", "spy", "gossip", "chef", "empath", "librarian", "washerwoman"];
    const pzSpy = makePuzzle({ assignmentLength: 7, rolePool: ["po", "spy", "gossip"], nights: 2, events: [...events] });
    expect(demonScenarios(pzSpy, new Schedule(pzSpy), withSpy)).toHaveLength(0);
  });

  it("승계한 Po의 선택 상태는 새로 시작한다 — 전임자의 조용한 밤이 3킬을 넘겨주지 않는다", () => {
    const withSw: RoleId[] = ["po", "scarletwoman", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    // 밤2 조용(전임 Po '아무도 안 함') → 낮2 Po 처형·탕녀 승계 → 밤3 다중 사망은 불가
    const pzTwo = makePuzzle({
      assignmentLength: 7, rolePool: ["po", "scarletwoman"], nights: 3,
      events: [
        { type: "execution", day: 2, seat: 0 },
        { type: "death", night: 3, seat: 2 },
        { type: "death", night: 3, seat: 3 },
      ],
    });
    expect(demonScenarios(pzTwo, new Schedule(pzTwo), withSw)).toHaveLength(0);
    // 같은 구도에서 1킬은 성립한다 (승계 자체는 유효)
    const pzOne = makePuzzle({
      assignmentLength: 7, rolePool: ["po", "scarletwoman"], nights: 3,
      events: [
        { type: "execution", day: 2, seat: 0 },
        { type: "death", night: 3, seat: 2 },
      ],
    });
    const scs = demonScenarios(pzOne, new Schedule(pzOne), withSw);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 1)).toBe(true);
  });
});

describe("Po: solve 통합", () => {
  it("설명 없는 조용한 밤이 임프 세계를 지우고 Po 세계만 남긴다", () => {
    const pz = makePuzzle({
      assignmentLength: 5,
      rolePool: ["imp", "po", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"],
      nights: 2,
      claims: [
        { seat: 0, role: "empath", info: [] },
        { seat: 1, role: "chef", info: [] },
        { seat: 2, role: "librarian", info: [] },
        { seat: 3, role: "washerwoman", info: [] },
        { seat: 4, role: "fortuneteller", info: [] },
      ],
    });
    const worlds = solve(pz);
    expect(worlds.length).toBeGreaterThan(0);
    expect(worlds.every((w) => w.assignment.includes("po"))).toBe(true);
  });
});
