// 2026-08-27 2차 확장: 죽음 역학 역할들 (도박사·현자·땜장이·음유시인·찻집 여인·어릿광대).

import { describe, expect, it } from "vitest";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { checkContent } from "@/lib/solver/roles";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const TF: RoleId = "empath";

describe("도박사", () => {
  const bet = (night: number, target: number, role: RoleId) => ({
    seat: 2, role: "gambler" as RoleId,
    info: [{ night, data: { type: "gambler" as const, target, role } }],
  });

  it("오답 사망이 두 번째 죽음을 설명한다", () => {
    const assignment: RoleId[] = ["imp", "spy", "gambler", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "gambler"], nights: 2,
      claims: [bet(2, 3, "librarian")], // 요리사(3)를 사서로 — 틀린 추측
      events: [
        { type: "death", night: 2, seat: 2 }, // 도박사 (오답 사망)
        { type: "death", night: 2, seat: 4 }, // 임프 킬
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    // 오답으로 죽으려면 그 밤 멀쩡했어야 한다
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(2))).toBe(true);
  });

  it("반드시 틀리는 추측을 하고도 살아 있으면 독살이 강제된다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", "gambler", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "gambler"], nights: 2,
      claims: [bet(2, 3, "librarian")],
      events: [{ type: "death", night: 2, seat: 4 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
  });

  it("맞는 추측이면 생존에 아무 제약이 없다", () => {
    const assignment: RoleId[] = ["imp", "spy", "gambler", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "gambler"], nights: 2,
      claims: [bet(2, 3, "chef")], // 정답
      events: [{ type: "death", night: 2, seat: 4 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.size === 0)).toBe(true);
  });
});

describe("땜장이", () => {
  it("땜장이의 죽음은 킬 주체 없이도 설명된다", () => {
    const assignment: RoleId[] = ["imp", "spy", "tinker", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "tinker"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 2 }, // 땜장이 (텔러 재량)
        { type: "death", night: 2, seat: 4 }, // 임프 킬
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment).length).toBeGreaterThan(0);
  });
});

describe("음유시인", () => {
  const assignment: RoleId[] = ["imp", "poisoner", "minstrel", "chef", TF, "librarian", "washerwoman"];

  it("하수인 처형 다음 밤: 아무 일도 없으면 전원 취함으로 설명된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "minstrel"], nights: 2,
      events: [{ type: "execution", day: 1, seat: 1 }], // 독살범 처형, 밤2 무사망
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.some((s) => s.minstrelNights?.has(2))).toBe(true);
  });

  it("하수인 처형 다음 밤에 사망이 있으면 음유시인의 중독이 강제된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "minstrel"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 1 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2 && !s.minstrelNights?.has(2))).toBe(true);
  });
});

describe("찻집 여인", () => {
  // 좌석 2가 찻집 여인, 이웃 1·3은 반드시 선으로 등록되는 마을 사람
  const assignment: RoleId[] = ["imp", "chef", "tealady", "fortuneteller", TF, "librarian", "washerwoman"];

  it("보호받는 이웃을 노린 킬 실패를 설명한다", () => {
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["imp", "tealady"], nights: 2 });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(2))).toBe(true);
  });

  it("보호가 확실한 이웃이 죽으면 찻집 여인의 독살이 강제된다", () => {
    const withPoisoner: RoleId[] = ["imp", "poisoner", "tealady", "fortuneteller", TF, "librarian", "washerwoman"];
    // 이웃 1은 독살범(악) → 보호 불확정. 이웃 3(점쟁이)은 확실 — 3이 죽는 경우를 본다
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "tealady"], nights: 2,
      events: [{ type: "death", night: 2, seat: 3 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withPoisoner);
    // 이웃 1이 악(독살범)이라 보호 자체가 성립하지 않는다 → 강제 없음
    expect(scs.some((s) => s.poisonRequired.size === 0)).toBe(true);

    const pz2 = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "tealady"], nights: 2,
      events: [{ type: "death", night: 2, seat: 1 }],
    });
    const scs2 = demonScenarios(pz2, new Schedule(pz2), assignment.map((r, i) => (i === 5 ? "poisoner" : r)) as RoleId[]);
    // 이웃 1·3 모두 확실히 선 → 1의 죽음은 찻집 여인 중독으로만 성립
    expect(scs2.length).toBeGreaterThan(0);
    expect(scs2.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
  });

  it("처형도 막는다 — 보호가 확실한 이웃의 처형은 독살을 강제한다", () => {
    const withPoisoner: RoleId[] = ["imp", "chef", "tealady", "fortuneteller", TF, "poisoner", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "tealady"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 1 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withPoisoner);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);
  });
});

describe("어릿광대", () => {
  it("회피가 킬 실패를 설명하고, 그 뒤의 죽음은 정상 성립한다", () => {
    const assignment: RoleId[] = ["imp", "spy", "fool", "chef", TF, "librarian", "washerwoman", "undertaker"];
    const pz = makePuzzle({
      assignmentLength: 8, rolePool: ["imp", "spy", "fool"], nights: 3,
      events: [{ type: "death", night: 3, seat: 2 }], // 밤2 무사망 (회피), 밤3 어릿광대 사망
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment).length).toBeGreaterThan(0);
  });

  it("회피를 안 쓴 어릿광대의 죽음은 독살 없이는 성립하지 않는다", () => {
    const assignment: RoleId[] = ["imp", "spy", "fool", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "fool"], nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment)).toHaveLength(0);
  });
});

describe("현자", () => {
  it("정보에 자신을 죽인 악마가 포함돼야 한다", () => {
    const ctx = makeCtx({
      assignment: ["imp", "poisoner", "sage", "chef", TF, "librarian", "washerwoman"],
      rolePool: ["imp", "poisoner", "sage"],
      nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    expect(checkContent(ctx, 2, { type: "sage", targets: [0, 4] }, 2)).toBe(true);
    expect(checkContent(ctx, 2, { type: "sage", targets: [3, 4] }, 2)).toBe(false);
  });

  it("임프 킬로 죽은 밤에만 깨어난다", () => {
    const ctx = makeCtx({
      assignment: ["imp", "poisoner", "sage", "chef", TF, "librarian", "washerwoman"],
      rolePool: ["imp", "poisoner", "sage"],
      nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    ctx.sc.impKillDuringNight = [null, null, 2];
    expect(wakes(ctx, 2, 2)).toBe(true);
    ctx.sc.impKillDuringNight = [null, null, null]; // 암살자 등 다른 사인
    expect(wakes(ctx, 2, 2)).toBe(false);
  });
});
