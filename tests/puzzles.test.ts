// 배포 게이트: 퍼즐은 솔버 전수 탐색으로 유일해가 증명되어야 한다.
//
// 예외는 하나다 — 솔버가 능력을 모르는 역할이 들어간 퍼즐(실제 판 기록 등)은
// **유일해 단정만** 건너뛴다. 구조 검사·질문 정답 도출·스키마 건전성·해설은
// 그대로 강제한다. 기계가 답이 하나임을 보증하지 못하는 만큼, 사람이 쓴 해설이
// 유일한 근거이기 때문이다.
//
// 해설 필수(빈 walkthrough 거부)는 definePuzzle이 퍼즐 파일을 import하는 순간 던지므로
// 여기 별도 테스트가 없다 — 그쪽이 관문이다 (schema.ts).

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import { analyze, unmodeledRoles } from "@/lib/solver/solve";
import { currentDemonOf, standardQuestions } from "@/lib/puzzles/schema";
import { ROLES } from "@/data/roles";
import type { RoleId } from "@/lib/solver/types";

describe.each(PUZZLES.map((p) => [p.id, p] as const))("퍼즐 %s", (_id, p) => {
  // unmodeledRoles는 던지지 않는 순수 파생값이라 describe 본문에서 써도 된다.
  // analyze는 던질 수 있으므로 it 안에서만 부른다 — 한 퍼즐의 구조 오류가 파일 전체 수집을 막지 않도록.
  const unmodeled = unmodeledRoles(p);

  it("구조 검사를 통과한다", () => {
    expect(() => analyze(p)).not.toThrow();
  });

  it("질문 정답이 solution에서 도출된다", () => {
    const expected = new Map(standardQuestions(p).map((q) => [q.id, q] as const));
    for (const q of p.questions) {
      if (q.id === "demonType") {
        // 스타 패스·점프로 몸이 바뀌어도 악마의 종류는 처음 배정된 그것이다
        expect({ q: q.id, role: q.answerRole }).toEqual({
          q: q.id,
          role: p.solution.find((r) => ROLES[r].team === "demon"),
        });
        expect(p.rolePool).toContain(q.answerRole);
        continue;
      }
      const std = expected.get(q.id);
      const seats =
        std !== undefined && std.id !== "demonType"
          ? std.answerSeats
          : p.solution.flatMap((r, s) => (r === q.id ? [s] : [])); // 보너스 질문: 그 역할의 좌석
      expect({ q: q.id, seats: [...q.answerSeats].sort() }).toEqual({ q: q.id, seats: [...seats].sort() });
    }
  });

  it("악마의 위치·종류·하수인의 위치를 묻는다 (표준 질문 셋과 같은 순서)", () => {
    const std = standardQuestions(p).map((q) => q.id);
    expect(p.questions.slice(0, std.length).map((q) => q.id)).toEqual(std);
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

  if (unmodeled.length === 0) {
    it("유일해이고 solution과 일치한다", () => {
      const worlds = analyze(p).worlds;
      expect(worlds.map((w) => `${w.assignment.join(",")}|d${w.currentDemonSeat}`)).toHaveLength(1);
      expect(worlds[0].assignment).toEqual(p.solution);
      expect(worlds[0].currentDemonSeat).toBe(currentDemonOf(p));
    });
  }
});
