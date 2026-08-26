import { describe, expect, it } from "vitest";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import type { RoleId } from "@/lib/solver/types";
import { makePuzzle } from "./helpers";

const TF: RoleId = "empath"; // 채우기용 마을 주민

describe("Schedule", () => {
  it("처형·밤 사망을 시간축에 반영한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp"],
      nights: 3,
      events: [
        { type: "execution", day: 1, seat: 1 },
        { type: "death", night: 2, seat: 0 },
      ],
    });
    const sched = new Schedule(pz);
    expect(sched.aliveAtNightStart(1).every(Boolean)).toBe(true);
    expect(sched.aliveAtNightStart(2)[1]).toBe(false); // 낮1 처형
    expect(sched.aliveAtNightStart(2)[0]).toBe(true);
    expect(sched.aliveAfterNight(2)[0]).toBe(false); // 밤2 사망
    expect(sched.aliveNow().filter(Boolean).length).toBe(5);
  });

  it("죽은 좌석의 중복 사망은 거부한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp"],
      nights: 3,
      events: [
        { type: "death", night: 2, seat: 0 },
        { type: "death", night: 3, seat: 0 },
      ],
    });
    expect(() => new Schedule(pz)).toThrow();
  });
});

describe("demonScenarios", () => {
  it("밤에 사망이 없으면 데몬 독살을 강제한다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", TF, "chef", "fortuneteller", "librarian", "washerwoman"];
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["imp", "poisoner"], nights: 2 });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs).toHaveLength(1);
    expect(scs[0].poisonRequired.get(2)).toBe(0);
  });

  it("독살범 없이 킬 실패는 불가능하다", () => {
    const assignment: RoleId[] = ["imp", "spy", TF, "chef", "fortuneteller", "librarian", "washerwoman"];
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["imp", "spy"], nights: 2 });
    expect(demonScenarios(pz, new Schedule(pz), assignment)).toHaveLength(0);
  });

  it("스타 패스: 임프 자살 시 하수인이 승계한다", () => {
    const assignment: RoleId[] = ["imp", "poisoner", TF, "chef", "fortuneteller", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp", "poisoner"],
      nights: 2,
      events: [{ type: "death", night: 2, seat: 0 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs).toHaveLength(1);
    expect(scs[0].currentDemonSeat).toBe(1);
    expect(scs[0].becameDemonAt.get(1)).toBe(2);
    expect(scs[0].poisonForbidden.get(2)?.has(0)).toBe(true); // 킬이 성공했으니 데몬은 안 중독
  });

  it("데몬 처형은 부정한 여인 승계로만 게임이 지속된다", () => {
    const base: RoleId[] = ["imp", TF, TF, "chef", "fortuneteller", "librarian", "washerwoman"];
    const withSw = [...base];
    withSw[3] = "scarletwoman";
    const pz = makePuzzle({
      assignmentLength: 7,
      rolePool: ["imp", "scarletwoman"],
      nights: 2,
      events: [
        { type: "execution", day: 1, seat: 0 },
        { type: "death", night: 2, seat: 6 }, // 승계한 데몬의 밤2 킬
      ],
    });
    const sched = new Schedule(pz);
    const scs = demonScenarios(pz, sched, withSw);
    expect(scs).toHaveLength(1);
    expect(scs[0].currentDemonSeat).toBe(3);
    expect(scs[0].becameDemonAt.get(3)).toBe(1.5);
    expect(scs[0].poisonForbidden.get(1)?.has(3)).toBe(true); // 중독된 부정한 여인은 승계 불가
    expect(demonScenarios(pz, sched, base)).toHaveLength(0); // 부정한 여인 없으면 게임 종료 → 모순
  });
});
