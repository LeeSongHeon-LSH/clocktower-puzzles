// 시계공의 오등록 처리 — 은둔자·첩자가 스텝 수를 바꿀 수 있다.
//
// 2026-09-21 리뷰 정정: 그전엔 실제 토큰만 봐서 은둔자가 하수인으로 등록되는 세계를 지웠다.
// 세계를 줄이는 쪽이라 유일해를 거짓으로 증명할 수 있었다 (관대한 방향 약속 위반).

import { describe, expect, it } from "vitest";
import { checkContent } from "@/lib/solver/roles";
import { checkContentFalse } from "@/lib/solver/roles/false-info";
import { clockmakerStepsSet } from "@/lib/solver/roles/clockmaker";
import { makeCtx } from "./helpers";

const POOL = ["imp", "poisoner", "spy", "recluse", "clockmaker", "chef", "empath", "washerwoman", "librarian"] as const;

describe("시계공", () => {
  it("실제 토큰 기준 거리가 성립한다", () => {
    // A 임프, C 독살범 → 2칸
    const ctx = makeCtx({ assignment: ["imp", "chef", "poisoner", "clockmaker", "empath", "washerwoman", "librarian"], rolePool: [...POOL] });
    expect(clockmakerStepsSet(ctx, 1)).toEqual(new Set([2]));
    expect(checkContent(ctx, 3, { type: "clockmaker", steps: 2 }, 1)).toBe(true);
    expect(checkContent(ctx, 3, { type: "clockmaker", steps: 1 }, 1)).toBe(false);
  });

  it("은둔자가 하수인으로 등록되면 거리가 짧아질 수 있다", () => {
    // A 임프, B 은둔자, D 독살범 → 실제 3칸, 은둔자가 하수인이면 1칸, 은둔자가 악마로 등록되면 B→D 2칸
    const ctx = makeCtx({ assignment: ["imp", "recluse", "chef", "poisoner", "clockmaker", "empath", "washerwoman"], rolePool: [...POOL] });
    expect(clockmakerStepsSet(ctx, 1)).toEqual(new Set([1, 2, 3]));
    expect(checkContent(ctx, 4, { type: "clockmaker", steps: 1 }, 1)).toBe(true);
    expect(checkContent(ctx, 4, { type: "clockmaker", steps: 3 }, 1)).toBe(true);
    expect(checkContent(ctx, 4, { type: "clockmaker", steps: 2 }, 1)).toBe(true);
    expect(checkContent(ctx, 4, { type: "clockmaker", steps: 4 }, 1)).toBe(false); // 7인 원탁의 최대 거리는 3
  });

  it("첩자가 마을 사람으로 등록되면 거리가 길어질 수 있다", () => {
    // 10인: A 임프, B 첩자, F 독살범 → 실제 1칸, 첩자가 주민이면 5칸
    const ctx = makeCtx({
      assignment: ["imp", "spy", "chef", "clockmaker", "empath", "poisoner", "washerwoman", "librarian", "recluse", "empath"],
      rolePool: [...POOL],
    });
    expect(clockmakerStepsSet(ctx, 1)).toEqual(new Set([1, 5, 2, 3]));
  });

  it("거짓 판정은 참 판정의 부정이다 — 오등록으로 값이 둘이면 어느 쪽을 말해도 거짓일 수 있다", () => {
    const ctx = makeCtx({ assignment: ["imp", "recluse", "chef", "poisoner", "clockmaker", "empath", "washerwoman"], rolePool: [...POOL] });
    expect(checkContentFalse(ctx, 4, { type: "clockmaker", steps: 1 }, 1)).toBe(true);
    expect(checkContentFalse(ctx, 4, { type: "clockmaker", steps: 3 }, 1)).toBe(true);
    // 값이 하나뿐인 배정에서는 그 값을 말한 정보만 거짓일 수 없다
    const plain = makeCtx({ assignment: ["imp", "chef", "poisoner", "clockmaker", "empath", "washerwoman", "librarian"], rolePool: [...POOL] });
    expect(checkContentFalse(plain, 3, { type: "clockmaker", steps: 2 }, 1)).toBe(false);
    expect(checkContentFalse(plain, 3, { type: "clockmaker", steps: 1 }, 1)).toBe(true);
  });
});
