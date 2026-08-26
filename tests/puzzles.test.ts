// 배포 게이트: 모든 퍼즐은 솔버 전수 탐색으로 유일해가 증명되어야 한다.

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import { solve } from "@/lib/solver/solve";
import { ROLES } from "@/data/roles";
import type { RoleId } from "@/lib/solver/types";

describe.each(PUZZLES.map((p) => [p.id, p] as const))("퍼즐 %s", (_id, p) => {
  const worlds = solve(p);

  it("유일해다", () => {
    expect(
      worlds.map((w) => `${w.assignment.join(",")}|d${w.currentDemonSeat}`),
    ).toHaveLength(1);
  });

  it("solution과 일치한다", () => {
    expect(worlds[0]?.assignment).toEqual(p.solution);
    const expectedDemon = p.currentDemonSeat ?? p.solution.indexOf("imp");
    expect(worlds[0]?.currentDemonSeat).toBe(expectedDemon);
  });

  it("질문 정답이 solution에서 도출된다", () => {
    const w = worlds[0];
    if (!w) return;
    for (const q of p.questions) {
      const expected =
        q.id === "demon"
          ? [w.currentDemonSeat]
          : w.assignment.flatMap((r, s) => (r === q.id ? [s] : []));
      expect({ q: q.id, seats: [...q.answerSeats].sort() }).toEqual({ q: q.id, seats: expected.sort() });
    }
  });

  it("스키마가 건전하다", () => {
    expect(p.solution.every((r) => p.rolePool.includes(r))).toBe(true);
    expect(p.hints.length).toBeLessThanOrEqual(2);
    // 등장 역할이 에디션 태그와 맞는지 (mixed는 제외)
    if (p.edition !== "mixed") {
      const editions = new Set(p.rolePool.map((r: RoleId) => ROLES[r].edition));
      expect([...editions]).toEqual([p.edition]);
    }
  });
});
