// 2026-08-28 12차 확장: Fang Gu — 첫 외부인 킬이 점프가 된다: 대상 외부인이 비밀리에
// 팡 구가 되고 원래 팡 구가 죽는다 (게임당 1회). 점프 미사용 상태에서는 외부인이 킬로
// 죽을 수 없다 (은둔자는 하수인 오등록 ∃, 첩자는 외부인 오등록으로 점프 대상 가능 ∃).
// 구성 [+1 외부인]. 점프한 좌석의 이후 주장은 전부 날조다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { believedRole, wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

describe("Fang Gu: 점프", () => {
  it("데몬 좌석의 밤 사망은 점프로 설명된다 — 대상 외부인(또는 첩자)이 새 팡 구가 된다", () => {
    const assignment: RoleId[] = ["fanggu", "spy", "recluse", "chef", "empath", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["fanggu", "spy"], nights: 2,
      events: [{ type: "death", night: 2, seat: 0 }],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    // 점프 대상은 외부인(은둔자) 또는 오등록 첩자뿐
    expect(scs.every((s) => s.currentDemonSeat === 1 || s.currentDemonSeat === 2)).toBe(true);
    expect(scs.some((s) => s.currentDemonSeat === 2)).toBe(true);
    // 점프 시점 기록 + 킬(=점프)이 성립하려면 그 밤 팡 구가 멀쩡했어야 한다
    expect(scs.every((s) => s.becameDemonAt.get(s.currentDemonSeat) === 2)).toBe(true);
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(0))).toBe(true);
  });

  it("점프 미사용 상태에서 외부인은 킬로 죽을 수 없다 — 은둔자는 하수인 오등록으로 가능", () => {
    const withSaint: RoleId[] = ["fanggu", "spy", "saint", "chef", "empath", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["fanggu", "imp", "spy"], nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
    });
    expect(demonScenarios(pz, new Schedule(pz), withSaint)).toHaveLength(0);
    // 같은 이벤트, 임프라면 성립한다
    const imp: RoleId[] = ["imp", ...withSaint.slice(1)];
    expect(demonScenarios(pz, new Schedule(pz), imp).length).toBeGreaterThan(0);
    // 은둔자라면 하수인으로 오등록돼 정상 사망이 가능하다 (∃)
    const withRecluse: RoleId[] = ["fanggu", "spy", "recluse", "chef", "empath", "librarian", "washerwoman"];
    expect(demonScenarios(pz, new Schedule(pz), withRecluse).length).toBeGreaterThan(0);
  });

  it("점프는 게임당 1회 — 소진 후에는 외부인도 정상적으로 죽는다", () => {
    const assignment: RoleId[] = ["fanggu", "spy", "saint", "recluse", "empath", "librarian", "washerwoman"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["fanggu", "spy"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 0 }, // 점프: 원래 팡 구 사망
        { type: "death", night: 3, seat: 3 }, // 새 팡 구가 은둔자를 죽인다 (점프 소진)
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    // 성자(2)로 점프한 뒤 은둔자(3)를 죽인 시나리오가 존재한다
    expect(scs.some((s) => s.currentDemonSeat === 2 && s.becameDemonAt.get(2) === 2)).toBe(true);
  });
});

describe("Fang Gu: 기상과 토큰", () => {
  it("점프한 좌석은 그 밤부터 팡 구로 깨어난다 (원래 역할은 깨지 않던 은둔자여도)", () => {
    const ctx = makeCtx({
      assignment: ["fanggu", "spy", "recluse", "chef", "empath", "librarian", "washerwoman"],
      rolePool: ["fanggu", "spy"],
      nights: 3,
      events: [{ type: "death", night: 2, seat: 0 }],
    });
    ctx.sc.currentDemonSeat = 2;
    ctx.sc.becameDemonAt.set(2, 2);
    expect(believedRole(ctx, 2, 1)).toBe("recluse");
    expect(believedRole(ctx, 2, 2)).toBe("fanggu");
    expect(wakes(ctx, 2, 1)).toBe(false); // 은둔자는 밤에 깨지 않는다
    expect(wakes(ctx, 2, 2)).toBe(true); // 점프한 밤 — 데몬이 됐다고 통보받으며 깨어난다
    expect(wakes(ctx, 2, 3)).toBe(true); // 이후 데몬처럼 매밤
  });
});

describe("Fang Gu: 구성 [+1 외부인] (solve 통합)", () => {
  it("팡 구 세계는 외부인 1명이 강제되고, 임프 세계는 외부인 0명이 강제된다 (7인)", () => {
    const worlds = solve({
      playerCount: 7,
      rolePool: ["imp", "fanggu", "poisoner", "recluse", "chef", "empath", "librarian", "washerwoman", "monk", "soldier"],
      nights: 1,
      events: [],
      claims: [
        { seat: 0, role: "recluse", info: [] },
        { seat: 1, role: "chef", info: [] },
        { seat: 2, role: "empath", info: [] },
        { seat: 3, role: "librarian", info: [] },
        { seat: 4, role: "washerwoman", info: [] },
        { seat: 5, role: "monk", info: [] },
        { seat: 6, role: "soldier", info: [] },
      ],
    });
    const impWorlds = worlds.filter((w) => w.assignment.includes("imp"));
    const fgWorlds = worlds.filter((w) => w.assignment.includes("fanggu"));
    expect(impWorlds.length).toBeGreaterThan(0);
    expect(fgWorlds.length).toBeGreaterThan(0);
    // 임프(외부인 0): 은둔자 주장 좌석은 악역일 수밖에 없다
    expect(impWorlds.every((w) => w.assignment[0] === "imp" || w.assignment[0] === "poisoner")).toBe(true);
    // 팡 구(외부인 1): 은둔자 주장 좌석이 실제 은둔자다
    expect(fgWorlds.every((w) => w.assignment[0] === "recluse")).toBe(true);
  });

  it("팡 구와 스위트하트는 한 퍼즐에서 지원되지 않는다 (건전성 거부)", () => {
    expect(() => solve({
      playerCount: 7,
      rolePool: ["fanggu", "poisoner", "sweetheart", "chef", "empath", "librarian", "washerwoman", "monk", "soldier"],
      nights: 1,
      events: [],
      claims: [],
    })).toThrowError(/스위트하트/);
  });
});
