// 2026-08-28 11차 확장: Pukka — 밤 n의 킬 = 밤 n-1의 중독 선택 (밤1부터 선택, 밤2부터 킬).
// 킬에는 선택 밤·실행 밤 모두의 멀쩡함이 강제되고, 군인·수도사 보호는 선택 밤 기준이다.
// 푸카 독을 받았을 수 있는 좌석은 관대 집합(pukkaPoisoned)으로 밤별 계산한다 — 킬 희생자,
// 처형된 선택, 무산 누수, 마지막 밤의 새 선택 (timeline.ts의 pukkaMaybe).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const base: RoleId[] = ["pukka", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];

describe("Pukka: 킬 = 전날 밤의 중독 선택", () => {
  it("킬은 선택 밤과 실행 밤 모두의 멀쩡함을 강제하고, 희생자는 두 밤 독 집합에 든다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["pukka", "spy"], nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    // 선택 밤(1)과 실행 밤(2) 모두 푸카의 독살이 금지된다
    expect(scs.every((s) => s.poisonForbidden.get(1)?.has(0))).toBe(true);
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(0))).toBe(true);
    // 희생자는 선택 밤부터 푸카 독 — 죽기 직전 밤의 정보가 중독 정보다
    expect(scs.every((s) => s.pukkaPoisoned?.[1]?.has(2))).toBe(true);
    expect(scs.every((s) => s.pukkaPoisoned?.[2]?.has(2))).toBe(true);
    // 희생자가 아닌 좌석은 선택 밤 집합에 들지 않는다
    expect(scs.every((s) => !s.pukkaPoisoned?.[1]?.has(3))).toBe(true);
  });

  it("군인 희생자는 선택 밤의 중독이 강제된다 (임프는 실행 밤)", () => {
    const withSoldier: RoleId[] = ["pukka", "poisoner", "soldier", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["pukka", "imp", "poisoner"], nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withSoldier);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);
    const imp: RoleId[] = ["imp", ...withSoldier.slice(1)];
    const impScs = demonScenarios(pz, new Schedule(pz), imp);
    expect(impScs.length).toBeGreaterThan(0);
    expect(impScs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
  });

  it("수도사가 선택 밤에 희생자를 보호했다고 기록했다면 그 밤 수도사의 중독이 강제된다", () => {
    const withMonk: RoleId[] = ["pukka", "poisoner", "monk", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["pukka", "poisoner", "monk"], nights: 3,
      claims: [{ seat: 2, role: "monk", info: [{ night: 2, data: { type: "monk", target: 4 } }] }],
      events: [{ type: "death", night: 3, seat: 4 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withMonk);
    expect(scs.length).toBeGreaterThan(0);
    // 밤3 킬의 선택 밤(2)에 수도사가 뚫렸어야 하고, 밤2 킬 부재는 선택 무효(밤1 푸카 중독)
    expect(scs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
    expect(scs.every((s) => s.poisonRequired.get(1) === 0)).toBe(true);
    expect(scs.every((s) => s.pukkaPoisoned?.[2]?.has(4) && s.pukkaPoisoned?.[3]?.has(4))).toBe(true);
  });
});

describe("Pukka: 킬 부재의 설명", () => {
  it("설명 수단이 없으면 조용한 밤이 모순이고, 군인이 있으면 선택 밤 기준으로 성립한다", () => {
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["pukka", "imp", "spy"], nights: 2 });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
    const withSoldier: RoleId[] = ["pukka", "spy", "soldier", "chef", "librarian", "washerwoman", "fortuneteller"];
    const scs = demonScenarios(pz, new Schedule(pz), withSoldier);
    expect(scs.length).toBeGreaterThan(0);
    // '멀쩡한 군인을 골랐다'는 선택 밤(1) 기준 — 임프는 실행 밤(2) 기준
    expect(scs.every((s) => s.poisonForbidden.get(1)?.has(2))).toBe(true);
    const imp: RoleId[] = ["imp", ...withSoldier.slice(1)];
    const impScs = demonScenarios(pz, new Schedule(pz), imp);
    expect(impScs.length).toBeGreaterThan(0);
    expect(impScs.every((s) => s.poisonForbidden.get(2)?.has(2))).toBe(true);
  });

  it("그 낮 처형자가 선택이었다면 킬 부재가 공짜다 — 임프는 설명이 없어 모순", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["pukka", "imp", "spy"], nights: 2,
      events: [{ type: "execution", day: 1, seat: 3 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    // 처형된 선택은 선택 밤에 푸카 독을 받고 있었다 (그 밤 정보 무제약)
    expect(scs.some((s) => s.pukkaPoisoned?.[1]?.has(3))).toBe(true);
    const imp: RoleId[] = ["imp", ...base.slice(1)];
    expect(demonScenarios(pz, new Schedule(pz), imp)).toHaveLength(0);
  });

  it("죽음 단계 무산은 실행 밤의 푸카 중독을 강제하고 누수(생존자 전원)를 남긴다", () => {
    const withPoisoner: RoleId[] = ["pukka", "poisoner", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["pukka", "poisoner"], nights: 2 });
    const scs = demonScenarios(pz, new Schedule(pz), withPoisoner);
    // 무산: 실행 밤(2) 푸카 중독 — 밤1의 유효한 선택이 죽지 않고 남아 누구든 중독됐을 수 있다
    const leak = scs.find((s) => s.poisonRequired.get(2) === 0);
    expect(leak).toBeDefined();
    expect(leak!.pukkaPoisoned?.[1]?.has(4)).toBe(true);
    // 선택 무효: 선택 밤(1) 푸카 중독 — 아무도 중독되지 않았으니 누수가 없다
    const invalid = scs.find((s) => s.poisonRequired.get(1) === 0 && !s.poisonRequired.has(2));
    expect(invalid).toBeDefined();
    expect(invalid!.pukkaPoisoned?.[1]?.has(4) ?? false).toBe(false);
  });
});

describe("Pukka: 마지막 밤의 새 선택과 기상", () => {
  it("마지막 밤에는 생존자 누구든 새 선택으로 중독됐을 수 있다", () => {
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["pukka", "spy"], nights: 1 });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    for (let seat = 1; seat < 7; seat++) {
      expect(scs.every((s) => s.pukkaPoisoned?.[1]?.has(seat))).toBe(true);
    }
    expect(scs.every((s) => !s.pukkaPoisoned?.[1]?.has(0))).toBe(true);
  });

  it("밤1부터 깨어나 선택한다 — 임프와 달리 첫 밤에도 깬다", () => {
    const ctx = makeCtx({ assignment: base, rolePool: ["pukka", "spy"], nights: 2 });
    expect(wakes(ctx, 0, 1)).toBe(true);
    expect(wakes(ctx, 0, 2)).toBe(true);
    ctx.sc = { ...ctx.sc, exorcistBlocked: new Set([2]) };
    expect(wakes(ctx, 0, 2)).toBe(false);
    const imp: RoleId[] = ["imp", ...base.slice(1)];
    const impCtx = makeCtx({ assignment: imp, rolePool: ["imp", "spy"], nights: 2 });
    expect(wakes(impCtx, 0, 1)).toBe(false);
  });
});

describe("Pukka: solve 통합", () => {
  it("처형 다음의 조용한 밤이 임프 세계를 지우고 푸카 세계만 남긴다", () => {
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp", "pukka", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller", "undertaker", "oracle"],
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
    expect(worlds.every((w) => w.assignment.includes("pukka"))).toBe(true);
  });

  it("희생자의 죽기 직전 밤 정보는 중독 정보라 거짓이어도 성립한다 — 임프 세계는 설명 불가", () => {
    // 시계공의 '6칸'은 7인 원탁에서 구조적으로 불가능한 정보 (최대 거리 3)
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp", "pukka", "spy", "clockmaker", "chef", "librarian", "washerwoman", "fortuneteller", "empath", "oracle"],
      nights: 2,
      claims: [
        { seat: 0, role: "chef", info: [] },
        { seat: 1, role: "empath", info: [] },
        { seat: 2, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 6 } }] },
        { seat: 3, role: "washerwoman", info: [] },
        { seat: 4, role: "fortuneteller", info: [] },
        { seat: 5, role: "librarian", info: [] },
        { seat: 6, role: "oracle", info: [] },
      ],
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    const worlds = solve(pz);
    // 시계공이 진짜(선한 좌석)인 세계는 푸카 킬(선택 밤 중독)로만 설명된다
    const realClockmaker = worlds.filter((w) => w.assignment[2] === "clockmaker");
    expect(realClockmaker.length).toBeGreaterThan(0);
    expect(realClockmaker.every((w) => w.assignment.includes("pukka"))).toBe(true);
  });
});
