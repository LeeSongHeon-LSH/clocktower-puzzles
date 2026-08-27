// 2026-08-27 6차 확장: 달의 자손(저주 킬 귀속) + 관측 흔적 없는 역할 5종
// (평화주의자·얼뜨기·사악한 쌍둥이 = 구성 전용, 마녀·악마의 변호사 = 기상 전용).

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { wakes } from "@/lib/solver/ctx";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

const TF: RoleId = "empath";

describe("달의 자손 (Moonchild)", () => {
  const assignment: RoleId[] = ["imp", "spy", "moonchild", "chef", TF, "librarian", "washerwoman"];

  it("죽은 다음 밤의 두 번째 사망을 저주로 설명한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "moonchild"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 2 }, // 달의 자손 사망 (임프 킬)
        { type: "death", night: 3, seat: 3 }, // 저주 (선한 요리사 지목)
        { type: "death", night: 3, seat: 4 }, // 임프 킬
      ],
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    // 지목하던 시점(죽던 밤~다음 낮)에 멀쩡했어야 한다
    expect(scs.every((s) => s.poisonForbidden.get(2)?.has(2))).toBe(true);
  });

  it("처형으로 죽어도 다음 밤 저주가 발동한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "moonchild"], nights: 2,
      events: [
        { type: "execution", day: 1, seat: 2 }, // 달의 자손 처형
        { type: "death", night: 2, seat: 3 }, // 저주
        { type: "death", night: 2, seat: 4 }, // 임프 킬
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment).length).toBeGreaterThan(0);
  });

  it("달의 자손이 살아 있으면 두 번째 사망을 설명하지 못한다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "moonchild"], nights: 3,
      events: [
        { type: "death", night: 2, seat: 5 }, // 달의 자손이 아닌 사망
        { type: "death", night: 3, seat: 3 },
        { type: "death", night: 3, seat: 4 },
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment).length).toBe(0);
  });

  it("저주는 죽은 다음 밤에만 발동한다 — 두 밤 뒤에는 안 된다", () => {
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["imp", "spy", "moonchild"], nights: 3,
      events: [
        { type: "execution", day: 1, seat: 2 }, // 달의 자손 처형 → 저주는 밤2에만
        { type: "death", night: 3, seat: 3 },
        { type: "death", night: 3, seat: 4 }, // 밤3의 2사망은 설명 불가
      ],
    });
    expect(demonScenarios(pz, new Schedule(pz), assignment).length).toBe(0);
  });
});

describe("마녀·악마의 변호사: 기상 전용", () => {
  it("마녀는 매일 밤 깨어나되 생존자 3명 이하면 멈춘다", () => {
    const ctx = makeCtx({
      assignment: ["imp", "witch", "chef", "empath", "librarian"],
      rolePool: ["imp", "witch"],
      nights: 3,
      events: [
        { type: "execution", day: 1, seat: 4 },
        { type: "death", night: 2, seat: 3 },
      ],
    });
    expect(wakes(ctx, 1, 1)).toBe(true); // 5명 생존
    expect(wakes(ctx, 1, 2)).toBe(true); // 4명 생존
    expect(wakes(ctx, 1, 3)).toBe(false); // 3명 생존 — 능력 상실
  });

  it("악마의 변호사는 밤1부터 깨어나고, 사악한 쌍둥이는 깨어나지 않는다", () => {
    const ctx = makeCtx({
      assignment: ["imp", "devilsadvocate", "eviltwin", "empath", "librarian"],
      rolePool: ["imp", "devilsadvocate", "eviltwin"],
    });
    expect(wakes(ctx, 1, 1)).toBe(true);
    expect(wakes(ctx, 2, 1)).toBe(false);
  });
});

describe("구성 전용 역할: solve 통합 스모크", () => {
  it("얼뜨기 주장 + 사악한 쌍둥이 하수인 세계가 성립한다", () => {
    const pz = makePuzzle({
      assignmentLength: 6,
      rolePool: ["imp", "eviltwin", "empath", "chef", "washerwoman", "klutz"],
      nights: 2,
      events: [{ type: "death", night: 2, seat: 2 }],
      claims: [
        { seat: 0, role: "empath", info: [{ night: 1, data: { type: "empath", count: 1 } }] },
        { seat: 1, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
        { seat: 2, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 3], shownRole: "empath" } }] },
        { seat: 3, role: "klutz", info: [] },
        { seat: 4, role: "chef", info: [] },
        { seat: 5, role: "washerwoman", info: [] },
      ],
    });
    const keys = solve(pz).map((w) => w.assignment.join(","));
    expect(keys).toContain("empath,chef,washerwoman,klutz,imp,eviltwin");
  });

  it("평화주의자 주장 세계가 성립한다", () => {
    const pz = makePuzzle({
      assignmentLength: 5,
      rolePool: ["imp", "scarletwoman", "empath", "chef", "pacifist"],
      nights: 1,
      claims: [
        { seat: 0, role: "empath", info: [{ night: 1, data: { type: "empath", count: 1 } }] },
        { seat: 1, role: "pacifist", info: [] },
        { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
        { seat: 3, role: "chef", info: [] },
        { seat: 4, role: "empath", info: [] },
      ],
    });
    const keys = solve(pz).map((w) => w.assignment.join(","));
    expect(keys.some((k) => k.includes("pacifist"))).toBe(true);
  });
});
