// 배포 게이트: 퍼즐은 솔버 전수 탐색으로 유일해가 증명되어야 한다.
//
// 예외는 하나다 — 솔버가 능력을 모르는 역할이 들어간 퍼즐(실제 판 기록 등)은
// **유일해 단정만** 건너뛴다. 구조 검사·질문 정답 도출·스키마 건전성·해설은
// 그대로 강제한다. 기계가 답이 하나임을 보증하지 못하는 만큼, 사람이 쓴 해설이
// 유일한 근거이기 때문이다.

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import { analyze, unmodeledRoles } from "@/lib/solver/solve";
import { ROLES } from "@/data/roles";
import type { RoleId } from "@/lib/solver/types";

describe.each(PUZZLES.map((p) => [p.id, p] as const))("퍼즐 %s", (_id, p) => {
  const unmodeled = unmodeledRoles(p);
  const demonSeat =
    p.currentDemonSeat ?? p.solution.findIndex((r) => ROLES[r].team === "demon");

  it("구조 검사를 통과한다", () => {
    expect(() => analyze(p)).not.toThrow();
  });

  it("질문 정답이 solution에서 도출된다", () => {
    for (const q of p.questions) {
      const expected =
        q.id === "demon"
          ? [demonSeat]
          : p.solution.flatMap((r, s) => (r === q.id ? [s] : []));
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

  if (unmodeled.length > 0) {
    // 유일해를 증명하지 못하는 퍼즐 — 근거는 해설뿐이다
    it("해설이 있다 (기계 증명을 대신하는 유일한 근거)", () => {
      expect(p.walkthrough.length).toBeGreaterThan(0);
    });
  } else {
    const worlds = analyze(p).worlds;

    it("유일해다", () => {
      expect(
        worlds.map((w) => `${w.assignment.join(",")}|d${w.currentDemonSeat}`),
      ).toHaveLength(1);
    });

    it("solution과 일치한다", () => {
      expect(worlds[0]?.assignment).toEqual(p.solution);
      expect(worlds[0]?.currentDemonSeat).toBe(demonSeat);
    });
  }
});
