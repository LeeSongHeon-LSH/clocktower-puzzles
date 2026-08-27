// 사설 문제 파이프라인 — 에디터가 지키기로 한 약속을 고정한다.
//
// 약속: 공유 링크는 **유일해일 때만** 만들어진다.
// 에디터 UI 대신 그 판정 파이프라인(빌드 → solve → encode → decode → solve)을 검사한다.

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import { decodePuzzle, encodePuzzle, toPuzzle, type SharedPuzzle } from "@/lib/puzzles/codec";
import { solve } from "@/lib/solver/solve";
import type { RoleId } from "@/lib/solver/types";

function sharedFrom(id: string): SharedPuzzle {
  const p = PUZZLES.find((x) => x.id === id)!;
  const { id: _id, source: _source, ...rest } = p;
  void _id;
  void _source;
  return rest;
}

/** 에디터의 판정과 같은 규칙 */
function verdict(shared: SharedPuzzle): "unique" | "multiple" | "none" | "mismatch" {
  const worlds = solve(toPuzzle(shared, "draft"));
  if (worlds.length === 0) return "none";
  if (worlds.length > 1) return "multiple";
  return worlds[0].assignment.join(",") === shared.solution.join(",") ? "unique" : "mismatch";
}

describe("사설 문제 파이프라인", () => {
  it("잘 만든 문제는 유일해 판정을 받는다", () => {
    expect(verdict(sharedFrom("tb-01"))).toBe("unique");
  });

  it("단서를 빼면 '해가 여럿'으로 막힌다", () => {
    const p = sharedFrom("tb-01");
    // 모든 밤 정보를 지우면 제약이 사라져 답을 좁힐 수 없다
    const stripped: SharedPuzzle = { ...p, claims: p.claims.map((c) => ({ ...c, info: [] })) };
    expect(verdict(stripped)).toBe("multiple");
  });

  it("정답 배치를 어긋나게 하면 유일해로 통과하지 않는다", () => {
    const p = sharedFrom("tb-01");
    const swapped: RoleId[] = [...p.solution];
    const a = swapped.findIndex((r) => r === "imp");
    const b = swapped.findIndex((r) => r !== "imp");
    [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    expect(verdict({ ...p, solution: swapped })).not.toBe("unique");
  });

  it("유일해 문제는 링크로 왕복해도 여전히 유일해다", async () => {
    for (const p of PUZZLES) {
      const shared = sharedFrom(p.id);
      const round = await decodePuzzle(await encodePuzzle(shared));
      expect(verdict(round), `${p.id} 왕복 후`).toBe("unique");
    }
  });

  it("사설 문제는 해설·힌트가 없어도 성립한다", async () => {
    const p = sharedFrom("tb-01");
    const bare: SharedPuzzle = { ...p, hints: [], walkthrough: [], intro: undefined };
    const round = await decodePuzzle(await encodePuzzle(bare));
    expect(round.walkthrough).toEqual([]);
    expect(round.hints).toEqual([]);
    expect(verdict(round)).toBe("unique");

    const puzzle = toPuzzle(round, "shared");
    expect(puzzle.source).toBe("community");
    expect(puzzle.walkthrough).toEqual([]);
  });

  it("검증은 사람이 기다릴 필요 없이 끝난다", () => {
    const started = performance.now();
    for (const p of PUZZLES) verdict(sharedFrom(p.id));
    const perPuzzle = (performance.now() - started) / PUZZLES.length;
    expect(perPuzzle, `퍼즐당 ${perPuzzle.toFixed(1)}ms`).toBeLessThan(500);
  });
});
