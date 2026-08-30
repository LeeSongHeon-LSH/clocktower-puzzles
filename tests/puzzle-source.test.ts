// 수록 신청 파일 생성기 — 붙여넣은 그대로 CI를 통과해야 한다.
//
// 비전공자가 이 파일을 읽고 고칠 일은 없다. 그래서 "그럴듯한 텍스트"가 아니라
// **definePuzzle과 솔버를 실제로 통과하는 퍼즐**이 나오는지를 검사한다.

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import type { SharedPuzzle } from "@/lib/puzzles/codec";
import { definePuzzle, type Puzzle } from "@/lib/puzzles/schema";
import { deriveEdition, indexSnippet, nextCommunityId, puzzleFileSource } from "@/lib/puzzles/source";
import { analyze } from "@/lib/solver/solve";

function sharedFrom(id: string): SharedPuzzle {
  const p = PUZZLES.find((x) => x.id === id)!;
  const { id: _id, source: _source, ...rest } = p;
  void _id;
  void _source;
  return rest;
}

/** 생성된 파일에서 definePuzzle(...)의 인자를 꺼내 실제 값으로 되살린다 */
function evaluate(source: string): Puzzle {
  const open = source.indexOf("definePuzzle(");
  const literal = source.slice(open + "definePuzzle(".length, source.lastIndexOf(")"));
  return new Function(`return (${literal})`)() as Puzzle;
}

describe("수록 신청 파일 생성", () => {
  const source = puzzleFileSource(sharedFrom("tb-01"), "cm-01");

  it("definePuzzle의 검사를 통과한다", () => {
    expect(() => definePuzzle(evaluate(source))).not.toThrow();
  });

  it("솔버가 원본과 같은 유일해를 낸다", () => {
    const p = evaluate(source);
    const { worlds } = analyze(p);
    expect(worlds).toHaveLength(1);
    expect(worlds[0].assignment).toEqual(p.solution);
  });

  it("질문 정답이 solution에서 도출된다 (puzzles.test.ts의 검사와 같은 규칙)", () => {
    const p = evaluate(source);
    const demonSeat = p.solution.indexOf("imp");
    expect(p.questions[0]).toMatchObject({ id: "demon", answerSeats: [demonSeat] });
  });

  it("사설 문제로 표시되고 id·별명이 들어간다", () => {
    const p = evaluate(source);
    expect(p.id).toBe("cm-01");
    expect(p.source).toBe("community");
  });

  it("대본이 한 판본이면 그 판본, 섞이면 mixed", () => {
    expect(deriveEdition(["washerwoman", "imp"])).toBe("tb");
    expect(deriveEdition(["washerwoman", "godfather"])).toBe("mixed");
    // 실험적 역할은 판본 태그가 없다 — 섞인 것으로 본다
    expect(deriveEdition(["washerwoman", "alchemist"])).toBe("mixed");
  });

  it("이미 쓰인 id는 건너뛴다", () => {
    expect(nextCommunityId([])).toBe("cm-01");
    expect(nextCommunityId(["tb-01", "cm-01", "cm-02"])).toBe("cm-03");
  });

  it("등록 두 줄이 파일명과 맞물린다", () => {
    expect(indexSnippet("cm-01")).toEqual({ importLine: 'import cm01 from "./cm-01";', arrayItem: "cm01" });
  });
});
