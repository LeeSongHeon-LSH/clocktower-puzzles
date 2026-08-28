// 2026-08-28 12차 확장: Vigormortis — 임프형 킬이지만, 죽인 하수인이 능력을 유지하고
// (죽은 독살범이 계속 독살, 죽은 암살자·대부·첩자·마녀도 유지) 그 하수인의 가장 가까운
// 마을 사람 이웃 1명이 계속 중독된다 (어느 쪽인지는 텔러 몫 ∃ — 관대 집합).
// 구성 [−1 외부인] (0 미만으로는 내려가지 않는다).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

describe("Vigormortis: 하수인 킬", () => {
  it("죽은 하수인의 능력 유지와 이웃 독이 기록된다", () => {
    const assignment: RoleId[] = ["vigormortis", "poisoner", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["vigormortis", "poisoner"], nights: 2,
      events: [{ type: "death", night: 2, seat: 1 }], // 독살범을 죽인다
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    // 하수인 킬 시나리오: 능력 유지 + 양옆 가장 가까운 마을 사람(0은 데몬이라 건너뛰고 2)이 독 후보
    const kept = scs.filter((s) => s.vigorKeptSince?.get(1) === 2);
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.every((s) => s.vigorPoisoned?.[2]?.has(2))).toBe(true);
    // 이웃 독은 그 밤부터 계속이고, 이웃이 아닌 좌석은 후보가 아니다
    expect(kept.every((s) => !s.vigorPoisoned?.[2]?.has(5))).toBe(true);
    expect(kept.every((s) => !s.vigorPoisoned?.[1]?.has(2))).toBe(true); // 죽기 전 밤은 아님
  });

  it("죽은 독살범이 계속 독살한다 — 사망 후의 거짓 정보가 설명된다 (solve 통합)", () => {
    // 밤2에 독살범이 죽고, 밤3에 요리사 옆 좌석의 초공감자 정보가 거짓이어야 하는 상황
    const claims = [
      { seat: 0, role: "soldier" as RoleId, info: [] },
      { seat: 1, role: "monk" as RoleId, info: [] }, // 실제로는 데몬/하수인 후보
      { seat: 2, role: "chef" as RoleId, info: [] },
      { seat: 3, role: "empath" as RoleId, info: [{ night: 3, data: { type: "empath" as const, count: 2 } }] },
      { seat: 4, role: "librarian" as RoleId, info: [] },
      { seat: 5, role: "washerwoman" as RoleId, info: [] },
      { seat: 6, role: "undertaker" as RoleId, info: [] },
    ];
    const base = {
      playerCount: 7,
      rolePool: ["vigormortis", "imp", "poisoner", "soldier", "monk", "chef", "empath", "librarian", "washerwoman", "undertaker"] as RoleId[],
      nights: 3,
      events: [{ type: "death" as const, night: 2, seat: 1 }],
      claims,
    };
    const worlds = solve(base);
    // "독살범이 좌석 1(밤2 사망)"인 세계: 초공감자(3)의 양옆(2·4)이 선인이라 count 2는
    // 거짓 — 밤3 독살이 필요하다. 임프라면 죽은 독살범이 독살할 수 없어 그 세계가 없고,
    // 비고르모르티스라면 능력 유지로 성립한다.
    expect(worlds.some((w) => w.assignment.includes("vigormortis") && w.assignment[1] === "poisoner" && w.assignment[3] === "empath")).toBe(true);
    expect(worlds.some((w) => w.assignment.includes("imp") && w.assignment[1] === "poisoner" && w.assignment[3] === "empath")).toBe(false);
  });

  it("죽은 하수인 이웃 독이 거짓 정보를 설명한다 (독살범 없이)", () => {
    // 하수인은 첩자 — 밤2에 죽고, 이웃 마을 사람(2)의 밤3 정보가 거짓이어도 성립해야 한다
    const claims = [
      { seat: 0, role: "soldier" as RoleId, info: [] },
      { seat: 1, role: "monk" as RoleId, info: [] },
      { seat: 2, role: "empath" as RoleId, info: [{ night: 3, data: { type: "empath" as const, count: 2 } }] },
      { seat: 3, role: "chef" as RoleId, info: [] },
      { seat: 4, role: "librarian" as RoleId, info: [] },
      { seat: 5, role: "washerwoman" as RoleId, info: [] },
      { seat: 6, role: "undertaker" as RoleId, info: [] },
    ];
    const worlds = solve({
      playerCount: 7,
      rolePool: ["vigormortis", "spy", "soldier", "monk", "chef", "empath", "librarian", "washerwoman", "undertaker"] as RoleId[],
      nights: 3,
      events: [{ type: "death" as const, night: 2, seat: 1 }],
      claims,
    });
    // 초공감자(2)의 count 2가 참일 수 없는 세계라도, 죽은 하수인(1)의 이웃 독 후보라면 무제약
    expect(worlds.some((w) => w.assignment[1] === "spy")).toBe(true);
  });
});

describe("Vigormortis: 능력 유지 기상", () => {
  it("죽은 독살범·첩자가 계속 깨어난다 — 임프 세계라면 깨지 않는다", () => {
    const assignment: RoleId[] = ["vigormortis", "poisoner", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const ctx = makeCtx({
      assignment, rolePool: ["vigormortis", "poisoner"], nights: 3,
      events: [{ type: "death", night: 2, seat: 1 }],
    });
    ctx.sc.vigorKeptSince = new Map([[1, 2]]);
    expect(wakes(ctx, 1, 3)).toBe(true); // 죽었지만 능력 유지 — 계속 깨어난다
    const impCtx = makeCtx({
      assignment: ["imp", ...assignment.slice(1)], rolePool: ["imp", "poisoner"], nights: 3,
      events: [{ type: "death", night: 2, seat: 1 }],
    });
    expect(wakes(impCtx, 1, 3)).toBe(false); // 임프에게 죽은 독살범은 깨지 않는다
  });
});

describe("Vigormortis: 구성 [−1 외부인]", () => {
  it("8인: 비고르모르티스 세계는 외부인 0, 임프 세계는 외부인 1이 강제된다", () => {
    const claims = [
      { seat: 0, role: "recluse" as RoleId, info: [] },
      { seat: 1, role: "chef" as RoleId, info: [] },
      { seat: 2, role: "empath" as RoleId, info: [] },
      { seat: 3, role: "librarian" as RoleId, info: [] },
      { seat: 4, role: "washerwoman" as RoleId, info: [] },
      { seat: 5, role: "monk" as RoleId, info: [] },
      { seat: 6, role: "soldier" as RoleId, info: [] },
      { seat: 7, role: "undertaker" as RoleId, info: [] },
    ];
    const worlds = solve({
      playerCount: 8,
      rolePool: ["imp", "vigormortis", "poisoner", "recluse", "chef", "empath", "librarian", "washerwoman", "monk", "soldier", "undertaker"] as RoleId[],
      nights: 1,
      events: [],
      claims,
    });
    const impWorlds = worlds.filter((w) => w.assignment.includes("imp"));
    const vmWorlds = worlds.filter((w) => w.assignment.includes("vigormortis"));
    expect(impWorlds.length).toBeGreaterThan(0);
    expect(vmWorlds.length).toBeGreaterThan(0);
    // 임프(외부인 1): 은둔자 주장 좌석이 실제 은둔자다
    expect(impWorlds.every((w) => w.assignment[0] === "recluse")).toBe(true);
    // 비고르모르티스(외부인 0): 은둔자 주장 좌석은 악역일 수밖에 없다
    expect(vmWorlds.every((w) => w.assignment[0] === "imp" || w.assignment[0] === "vigormortis" || w.assignment[0] === "poisoner")).toBe(true);
  });

  it("7인(기본 외부인 0): 0 미만으로 내려가지 않고 성립한다", () => {
    const claims = [
      { seat: 0, role: "chef" as RoleId, info: [] },
      { seat: 1, role: "empath" as RoleId, info: [] },
      { seat: 2, role: "librarian" as RoleId, info: [] },
      { seat: 3, role: "washerwoman" as RoleId, info: [] },
      { seat: 4, role: "monk" as RoleId, info: [] },
      { seat: 5, role: "soldier" as RoleId, info: [] },
      { seat: 6, role: "undertaker" as RoleId, info: [] },
    ];
    const worlds = solve({
      playerCount: 7,
      rolePool: ["vigormortis", "poisoner", "chef", "empath", "librarian", "washerwoman", "monk", "soldier", "undertaker"] as RoleId[],
      nights: 1,
      events: [],
      claims,
    });
    expect(worlds.length).toBeGreaterThan(0);
    expect(worlds.every((w) => w.assignment.every((r) => r !== "recluse"))).toBe(true);
  });
});
