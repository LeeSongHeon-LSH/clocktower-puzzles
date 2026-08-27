// 2026-08-27 확장 역할들: 킬 귀속 엔진(수도사·군인·구마사제·성자·암살자·대부·할머니 연쇄)과
// 새 정보 체커(꿈꾸는 자·예언자·할머니)의 단위 테스트.

import { describe, expect, it } from "vitest";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { checkContent } from "@/lib/solver/roles";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const TF: RoleId = "empath"; // 채우기용 마을 주민

describe("군인", () => {
  it("군인이 있으면 킬 실패가 독살 없이 설명된다", () => {
    const assignment: RoleId[] = ["imp", "spy", "soldier", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["imp", "spy", "soldier"], nights: 2 });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    // 독살범이 없으므로 유일한 설명은 "임프가 군인을 노렸다" — 군인은 그 밤 멀쩡했어야 한다
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(2))).toBe(true);
  });

  it("임프 킬로 군인이 죽으면 그 밤 군인의 독살이 강제된다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", "soldier", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "soldier"], nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
  });
});

describe("수도사", () => {
  const monkClaim = (night: number, target: number) => ({
    seat: 2, role: "monk" as RoleId,
    info: [{ night, data: { type: "monk" as const, target } }],
  });

  it("수도사가 있으면 킬 실패가 독살 없이 설명된다", () => {
    const assignment: RoleId[] = ["imp", "spy", "monk", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "monk"], nights: 2,
      claims: [monkClaim(2, 4)],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(2))).toBe(true);
  });

  it("보호를 주장한 대상이 그 밤 임프에게 죽으면 수도사의 독살이 강제된다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", "monk", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "monk"], nights: 2,
      claims: [monkClaim(2, 4)],
      events: [{ type: "death", night: 2, seat: 4 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
  });
});

describe("구마사제", () => {
  const exoClaim = (night: number, target: number) => ({
    seat: 2, role: "exorcist" as RoleId,
    info: [{ night, data: { type: "exorcist" as const, target } }],
  });

  it("악마를 지목한 밤은 킬 실패가 설명되고 악마 봉쇄로 기록된다", () => {
    const assignment: RoleId[] = ["imp", "spy", "exorcist", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "exorcist"], nights: 2,
      claims: [exoClaim(2, 0)],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.exorcistBlocked?.has(2))).toBe(true);
  });

  it("악마를 지목했는데 킬이 났으면 구마사제의 독살이 강제된다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", "exorcist", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "exorcist"], nights: 2,
      claims: [exoClaim(2, 0)],
      events: [{ type: "death", night: 2, seat: 5 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(2) === 2)).toBe(true);
  });

  it("다른 사람을 지목한 기록만 있으면 봉쇄로 킬 실패를 설명할 수 없다", () => {
    const assignment: RoleId[] = ["imp", "spy", "exorcist", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "exorcist"], nights: 2,
      claims: [exoClaim(2, 4)], // 악마(0)가 아니라 4를 지목
    });
    // 독살범도 군인도 수도사도 없다 → 설명 불가
    expect(demonScenarios(pz, new Schedule(pz), assignment)).toHaveLength(0);
  });
});

describe("성자", () => {
  it("성자 처형은 그 밤의 독살을 강제한다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", "saint", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "saint"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);
  });

  it("독살범이 없으면 성자 처형은 성립하지 않는다", () => {
    const assignment: RoleId[] = ["imp", "spy", "saint", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "saint"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment)).toHaveLength(0);
  });
});

describe("암살자", () => {
  it("한 밤의 두 사망을 임프 킬 + 암살자로 설명한다", () => {
    const assignment: RoleId[] = ["imp", "assassin", "soldier", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "assassin"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 3 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.assassinNight === 2)).toBe(true);
  });

  it("1회용이다 — 두 밤 연속 2인 사망은 설명되지 않는다", () => {
    const assignment: RoleId[] = ["imp", "assassin", TF, "chef", "fortuneteller", "librarian", "washerwoman", "undertaker"];
    const pz = makePuzzle({
      assignmentLength: 8, rolePool: ["imp", "assassin"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 2 },
        { type: "death", night: 2, seat: 3 },
        { type: "death", night: 3, seat: 4 },
        { type: "death", night: 3, seat: 5 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment)).toHaveLength(0);
  });

  it("암살자가 임프를 죽이면 탕녀가 승계한다", () => {
    const assignment: RoleId[] = ["imp", "assassin", "scarletwoman", "chef", TF, "librarian", "washerwoman", "undertaker", "fortuneteller", "chambermaid"];
    const pz = makePuzzle({
      assignmentLength: 10, rolePool: ["imp", "assassin", "scarletwoman"], nights: 2,
      events: [
        { type: "death", night: 2, seat: 0 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    // 두 죽음 중 임프의 죽음이 암살자 몫인 시나리오 → 탕녀 승계
    const viaAssassin = scs.filter((s) => s.assassinNight === 2 && s.currentDemonSeat === 2);
    expect(viaAssassin.length).toBeGreaterThan(0);
  });
});

describe("대부", () => {
  it("외부인 처형 다음 밤의 두 사망을 대부 킬로 설명한다", () => {
    const assignment: RoleId[] = ["imp", "godfather", "drunk", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "godfather", "drunk"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 }, // 주정뱅이(외부인) 처형
        { type: "death", night: 2, seat: 3 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.godfatherNights?.has(2))).toBe(true);
  });

  it("의무 킬이다 — 외부인이 처형됐는데 추가 사망이 없으면 대부의 독살이 강제된다", () => {
    const assignment: RoleId[] = ["imp", "godfather", "drunk", "chef", TF, "librarian", "washerwoman"];
    const pzNoPoison = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "godfather", "drunk"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 },
        { type: "death", night: 2, seat: 3 }, // 임프 킬 1건뿐
      ],
    });
    // 독살범이 없으면 의무 킬 불발을 설명할 수 없다
    expect(demonScenarios(pzNoPoison, new Schedule(pzNoPoison), assignment)).toHaveLength(0);
  });

  it("마을 사람 처형은 대부를 깨우지 않는다", () => {
    const assignment: RoleId[] = ["imp", "godfather", "drunk", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "godfather", "drunk"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 3 }, // 마을 사람 처형
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => !s.godfatherNights?.has(2))).toBe(true);
  });
});

describe("할머니 연쇄", () => {
  const gmClaim = { seat: 2, role: "grandmother" as RoleId,
    info: [{ night: 1, data: { type: "grandmother" as const, target: 4, shownRole: TF } }] };

  it("손주와 할머니가 같은 밤에 죽는 연쇄를 설명한다", () => {
    const assignment: RoleId[] = ["imp", "spy", "grandmother", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "grandmother"], nights: 2,
      claims: [gmClaim],
      events: [
        { type: "death", night: 2, seat: 4 }, // 손주
        { type: "death", night: 2, seat: 2 }, // 할머니 연쇄
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
  });

  it("손주가 임프에게 죽었는데 할머니가 살아 있으면 할머니의 독살이 강제된다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", "grandmother", "chef", TF, "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "grandmother"], nights: 2,
      claims: [gmClaim],
      events: [{ type: "death", night: 2, seat: 4 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    // 밤1 정보가 멀쩡했던 분기 → 밤2 할머니 독살, 밤1부터 중독이던 분기 → 밤1 독살
    expect(scs.every((s) => s.poisonRequired.get(2) === 2 || s.poisonRequired.get(1) === 2)).toBe(true);
  });
});

describe("새 정보 체커", () => {
  it("꿈꾸는 자: 실제 역할이 두 후보 중 하나면 참", () => {
    const ctx = makeCtx({
      assignment: ["imp", "poisoner", "dreamer", "chef", TF, "librarian", "washerwoman"],
      rolePool: ["imp", "poisoner", "dreamer", "chef", TF, "librarian", "washerwoman"],
    });
    expect(checkContent(ctx, 2, { type: "dreamer", target: 3, goodRole: "chef", evilRole: "imp" }, 1)).toBe(true);
    expect(checkContent(ctx, 2, { type: "dreamer", target: 0, goodRole: "chef", evilRole: "imp" }, 1)).toBe(true);
    expect(checkContent(ctx, 2, { type: "dreamer", target: 3, goodRole: "librarian", evilRole: "imp" }, 1)).toBe(false);
    // 선/악 자리가 뒤집힌 데이터는 거짓
    expect(checkContent(ctx, 2, { type: "dreamer", target: 3, goodRole: "imp", evilRole: "chef" }, 1)).toBe(false);
  });

  it("예언자: 죽은 악인 수를 센다 (은둔자 오등록 폭 포함)", () => {
    const ctx = makeCtx({
      assignment: ["imp", "poisoner", "oracle", "recluse", TF, "librarian", "washerwoman"],
      rolePool: ["imp", "poisoner", "oracle", "recluse"],
      nights: 3,
      events: [
        { type: "execution", day: 1, seat: 1 }, // 독살범 처형
        { type: "death", night: 2, seat: 3 },   // 은둔자 사망
        { type: "execution", day: 2, seat: 5 },
      ],
    });
    // 밤2 시점 죽은 자: 독살범(악 확정), 은둔자(0~1) → 1 또는 2
    expect(checkContent(ctx, 2, { type: "oracle", count: 1 }, 2)).toBe(true);
    expect(checkContent(ctx, 2, { type: "oracle", count: 2 }, 2)).toBe(true);
    expect(checkContent(ctx, 2, { type: "oracle", count: 0 }, 2)).toBe(false);
    // 밤3 시점: 사서(선 확정) 추가 — 여전히 1~2
    expect(checkContent(ctx, 2, { type: "oracle", count: 3 }, 3)).toBe(false);
  });

  it("할머니: 손주 역할 표시는 등록 규칙을 따른다", () => {
    const ctx = makeCtx({
      assignment: ["imp", "spy", "grandmother", "chef", TF, "librarian", "washerwoman"],
      rolePool: ["imp", "spy", "grandmother", "chef", TF, "librarian", "washerwoman"],
    });
    expect(checkContent(ctx, 2, { type: "grandmother", target: 3, shownRole: "chef" }, 1)).toBe(true);
    // 첩자는 선한 역할로 등록될 수 있다
    expect(checkContent(ctx, 2, { type: "grandmother", target: 1, shownRole: "chef" }, 1)).toBe(true);
    // 악한 역할을 손주로 표시할 수는 없다
    expect(checkContent(ctx, 2, { type: "grandmother", target: 0, shownRole: "imp" }, 1)).toBe(false);
  });

  it("기상 판정: 집사는 매일 밤, 예언자는 밤2부터, 할머니는 밤1만", () => {
    const ctx = makeCtx({
      assignment: ["imp", "poisoner", "butler", "oracle", "grandmother", "librarian", "washerwoman"],
      rolePool: ["imp", "poisoner", "butler", "oracle", "grandmother"],
      nights: 2,
    });
    expect(wakes(ctx, 2, 1)).toBe(true);
    expect(wakes(ctx, 2, 2)).toBe(true);
    expect(wakes(ctx, 3, 1)).toBe(false);
    expect(wakes(ctx, 3, 2)).toBe(true);
    expect(wakes(ctx, 4, 1)).toBe(true);
    expect(wakes(ctx, 4, 2)).toBe(false);
  });
});
