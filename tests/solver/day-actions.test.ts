// 2026-08-28 14차 확장: 낮 공개 행동 이벤트 (slayerShot·nomination·virginTrigger)와
// Virgin·Slayer 모델링.
// - 총격 명중: 실제 사냥꾼의 첫 총격 + 그 낮 멀쩡함 + 대상의 데몬 등록(은둔자 ∃) 강제
// - 총격 불발: 허세(비사냥꾼)는 자유. 실제 사냥꾼이 확실한 데몬을 쐈다면 사냥꾼 중독 강제
// - 처녀 발동: 실제 멀쩡한 처녀의 첫 지명 + 지명자의 마을 주민 등록(첩자 ∃) 강제,
//   지명자는 그날의 처형으로 죽는다 (성자·장의사 등 일반 처형 규칙 적용)
// - 지명(무사): 처녀의 능력이 소진되고, 발동했어야 하는 조건이면 처녀의 중독 강제

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";
import { makePuzzle } from "./helpers";

const base: RoleId[] = ["imp", "poisoner", "slayer", "chef", "empath", "librarian", "washerwoman"];

describe("Slayer: 총격", () => {
  it("명중은 실제 사냥꾼·멀쩡함·대상의 데몬 등록을 강제한다", () => {
    // 은둔자(3)를 쏴 죽였다 — 데몬 오등록 (∃). 사냥꾼의 그 낮 멀쩡함이 강제된다
    const withRecluse: RoleId[] = ["imp", "poisoner", "slayer", "recluse", "empath", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "recluse"], nights: 2,
      events: [
        { type: "slayerShot", day: 1, seat: 2, target: 3, died: true },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withRecluse);
    expect(scs.length).toBeGreaterThan(0);
    // 명중한 낮(=밤1의 독 지속 구간)에 사냥꾼의 중독이 금지된다
    expect(scs.every((s) => s.poisonForbidden.get(1)?.has(2))).toBe(true);
    // 탕녀 없이 실제 데몬(0)을 쏴 죽였다면 게임이 끝났어야 한다 — 시나리오 없음
    const pzDemon = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "recluse"], nights: 2,
      events: [
        { type: "slayerShot", day: 1, seat: 2, target: 0, died: true },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pzDemon, new Schedule(pzDemon), withRecluse)).toHaveLength(0);
  });

  it("실제 데몬 명중은 탕녀 승계로만 게임이 이어진다", () => {
    const withSw: RoleId[] = ["imp", "scarletwoman", "slayer", "chef", "empath", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "scarletwoman"], nights: 2,
      events: [
        { type: "slayerShot", day: 1, seat: 2, target: 0, died: true },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withSw);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.currentDemonSeat === 1)).toBe(true); // 탕녀가 새 임프
    expect(scs.every((s) => s.poisonForbidden.get(1)?.has(1))).toBe(true); // 승계한 탕녀는 멀쩡했다
  });

  it("비사냥꾼(허세)의 명중은 성립하지 않고, 은둔자는 총에 맞아 죽을 수 있다", () => {
    // 좌석 3(요리사)이 쏴서 죽였다고 하면 — 실제 사냥꾼이 아니므로 모순
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      events: [
        { type: "slayerShot", day: 1, seat: 3, target: 0, died: true },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
    // 은둔자를 쏴 죽인 경우 — 데몬 오등록 (∃)으로 성립한다
    const withRecluse: RoleId[] = ["imp", "poisoner", "slayer", "recluse", "empath", "librarian", "washerwoman"];
    const pz2 = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner", "recluse"], nights: 2,
      events: [
        { type: "slayerShot", day: 1, seat: 2, target: 3, died: true },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz2, new Schedule(pz2), withRecluse).length).toBeGreaterThan(0);
  });

  it("멀쩡한 사냥꾼이 확실한 데몬을 쐈는데 불발이면 사냥꾼의 중독이 강제된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      events: [
        { type: "slayerShot", day: 1, seat: 2, target: 0, died: false }, // 데몬인데 불발
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), base);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);
    // 데몬이 아닌 대상을 쐈다면 불발이 자유롭다
    const pz2 = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      events: [
        { type: "slayerShot", day: 1, seat: 2, target: 5, died: false },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs2 = demonScenarios(pz2, new Schedule(pz2), base);
    expect(scs2.length).toBeGreaterThan(0);
    expect(scs2.some((s) => !s.poisonRequired.has(1))).toBe(true);
  });

  it("공개 총격은 1회 — 불발로 소진한 뒤의 명중은 성립하지 않는다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 3,
      events: [
        { type: "slayerShot", day: 1, seat: 2, target: 5, died: false }, // 소진
        { type: "slayerShot", day: 2, seat: 2, target: 0, died: true }, // 불가
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), base)).toHaveLength(0);
  });
});

describe("Virgin: 지명과 발동", () => {
  const withVirgin: RoleId[] = ["imp", "poisoner", "virgin", "chef", "empath", "librarian", "washerwoman"];

  it("발동은 실제 멀쩡한 처녀 + 지명자의 주민 등록을 강제하고, 지명자가 처형으로 죽는다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      events: [
        { type: "virginTrigger", day: 1, nominator: 3, nominee: 2 }, // 요리사(3)가 지명 → 즉시 처형
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withVirgin);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonForbidden.get(1)?.has(2))).toBe(true); // 처녀는 멀쩡했다
    // 악역(비주민 등록)이 지명한 발동은 성립하지 않는다 — 독살범(1)이 지명자인 경우
    const pz2 = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      events: [
        { type: "virginTrigger", day: 1, nominator: 1, nominee: 2 },
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz2, new Schedule(pz2), withVirgin)).toHaveLength(0);
  });

  it("첩자 지명자는 주민으로 등록돼 발동을 일으킬 수 있다", () => {
    const withSpy: RoleId[] = ["imp", "spy", "virgin", "chef", "empath", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy"], nights: 2,
      events: [
        { type: "virginTrigger", day: 1, nominator: 1, nominee: 2 }, // 첩자가 지명 → 발동 (∃)
        { type: "death", night: 2, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), withSpy).length).toBeGreaterThan(0);
  });

  it("주민이 지명했는데 무사하면 처녀의 중독이 강제되고, 능력은 소진된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2,
      events: [
        { type: "nomination", day: 1, nominator: 3, nominee: 2 }, // 주민 지명, 무사
        { type: "death", night: 2, seat: 4 },
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), withVirgin);
    expect(scs.length).toBeGreaterThan(0);
    expect(scs.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);
    // 소진 후의 주민 지명은 자유 — 두 번째 지명은 제약을 낳지 않는다
    const pz2 = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 3,
      events: [
        { type: "nomination", day: 1, nominator: 3, nominee: 2 }, // 첫 지명 (중독 강제, 소진)
        { type: "nomination", day: 2, nominator: 4, nominee: 2 }, // 소진 후 — 자유
        { type: "death", night: 2, seat: 5 },
      ],
    });
    const scs2 = demonScenarios(pz2, new Schedule(pz2), withVirgin);
    expect(scs2.length).toBeGreaterThan(0);
    expect(scs2.every((s) => s.poisonRequired.get(1) === 2)).toBe(true);
    expect(scs2.some((s) => !s.poisonRequired.has(2))).toBe(true);
  });

  it("solve 통합: 발동 이벤트는 지명 대상이 진짜 처녀임을 증명한다 (주정뱅이 세계 배제)", () => {
    // 8인 (외부인 1) — 주정뱅이가 존재할 수 있는 구성
    const pz: SolverPuzzle = {
      playerCount: 8,
      rolePool: ["imp", "poisoner", "drunk", "virgin", "chef", "empath", "librarian", "washerwoman", "undertaker", "soldier"],
      nights: 2,
      events: [
        { type: "virginTrigger", day: 1, nominator: 3, nominee: 2 },
        { type: "death", night: 2, seat: 4 },
      ],
      claims: [
        { seat: 0, role: "chef", info: [] },
        { seat: 1, role: "empath", info: [] },
        { seat: 2, role: "virgin", info: [] },
        { seat: 3, role: "librarian", info: [] },
        { seat: 4, role: "washerwoman", info: [] },
        { seat: 5, role: "undertaker", info: [] },
        { seat: 6, role: "virgin", info: [] }, // 처녀 주장이 둘 — 한쪽은 주정뱅이나 악역
        { seat: 7, role: "soldier", info: [] },
      ],
    };
    const worlds = solve(pz);
    expect(worlds.length).toBeGreaterThan(0);
    // 발동이 일어난 좌석 2는 모든 세계에서 진짜 처녀다 — 주정뱅이·사칭 세계는 전부 배제
    expect(worlds.every((w) => w.assignment[2] === "virgin")).toBe(true);
    expect(worlds.some((w) => w.assignment[6] === "drunk")).toBe(true);
  });
});
