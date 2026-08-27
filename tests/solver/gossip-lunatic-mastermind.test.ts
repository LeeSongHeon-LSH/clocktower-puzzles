// 2026-08-27 7차 확장: 소문꾼(참 발언 → 밤 킬, ∃) + 루나틱(숨은 외부인, 데몬처럼 기상)
// + 마스터마인드(데몬 처형 후 하루 연장 — 마지막 낮 처형일 때만 현재에 닿는다).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const TF: RoleId = "empath";

describe("소문꾼 (Gossip)", () => {
  const assignment: RoleId[] = ["imp", "spy", "gossip", "chef", TF, "librarian", "washerwoman"];

  it("참 발언이 두 번째 밤 사망을 설명한다 — 멀쩡했어야 한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "gossip"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 3 }, // 소문꾼의 참 발언
        { type: "death", night: 2, seat: 4 }, // 임프 킬
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(2))).toBe(true);
  });

  it("죽은 소문꾼의 발언은 죽이지 못한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "gossip"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 }, // 소문꾼 처형
        { type: "death", night: 2, seat: 3 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment).length).toBe(0);
  });

  it("소문꾼의 킬이 데몬을 잡으면 탕녀가 승계한다", () => {
    const withSw: RoleId[] = ["imp", "scarletwoman", "gossip", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "scarletwoman", "gossip"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 0 }, // 데몬 사망 (소문꾼 발언)
        { type: "death", night: 2, seat: 4 }, // 임프 킬
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withSw);
    expect(scs.some((s) => s.currentDemonSeat === 1)).toBe(true);
  });
});

describe("루나틱 (Lunatic)", () => {
  it("데몬처럼 밤2부터 깨어난다 — 광인·주정뱅이와의 구별점", () => {
    const ctx = makeCtx({
      assignment: ["imp", "spy", "lunatic", "chef", "empath", "washerwoman", "librarian"],
      rolePool: ["imp", "spy", "lunatic"],
      claims: [{ seat: 2, role: "empath", info: [] }],
      nights: 2,
    });
    expect(wakes(ctx, 2, 1)).toBe(false);
    expect(wakes(ctx, 2, 2)).toBe(true);
  });

  it("불가능한 주장이 루나틱(허세) 세계로 설명된다", () => {
    const pz = makePuzzle({
      assignmentLength: 6,
      rolePool: ["imp", "spy", "lunatic", "empath", "chef", "washerwoman", "ravenkeeper"],
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
    expect(keys).toContain("empath,lunatic,chef,washerwoman,imp,spy");
    expect(keys.some((k) => k.split(",")[1] === "ravenkeeper")).toBe(false);
  });
});

describe("마스터마인드 (Mastermind)", () => {
  const base: RoleId[] = ["imp", "mastermind", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];

  it("마지막 낮의 데몬 처형 후 하루 연장을 설명한다 — 멀쩡했어야 한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "mastermind"], nights: 2,
      events: [{ type: "execution", day: 1, seat: 0 }], // 데몬 처형, 밤2는 데몬 없는 연장 밤
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonForbidden.get(1)?.has(1))).toBe(true);
  });

  it("마스터마인드가 없으면 데몬 처형으로 게임이 끝났어야 한다", () => {
    const noMm: RoleId[] = ["imp", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy"], nights: 2,
      events: [{ type: "execution", day: 1, seat: 0 }],
    });
    expect(demonScenarios(pz, new Schedule(pz), noMm).length).toBe(0);
  });

  it("연장은 하루뿐 — 마지막 낮이 아닌 처형은 설명하지 못한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "mastermind"], nights: 3,
      events: [{ type: "execution", day: 1, seat: 0 }], // 낮1 처형인데 현재는 낮3
    });
    expect(demonScenarios(pz, new Schedule(pz), base).length).toBe(0);
  });

  it("연장 밤의 사망은 데몬 아닌 원인이 필요하다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "mastermind", "assassin"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 0 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    // 암살자 없이는 설명 불가
    expect(demonScenarios(pz, new Schedule(pz), base).length).toBe(0);
    // 암살자가 있으면 성립
    const withAssassin: RoleId[] = ["imp", "mastermind", "assassin", "chef", "librarian", "washerwoman", "fortuneteller"];
    const scs = demonScenarios(pz, new Schedule(pz), withAssassin);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.assassinNight === 2)).toBe(true);
  });
});
