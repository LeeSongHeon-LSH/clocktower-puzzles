// 수록 신청 파일 생성기 — 붙여넣은 그대로 CI를 통과해야 한다.
//
// 비전공자가 이 파일을 읽고 고칠 일은 없다. 그래서 "그럴듯한 텍스트"가 아니라
// **definePuzzle과 솔버를 실제로 통과하는 퍼즐**이 나오는지를 검사한다.

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import { ROLES } from "@/data/roles";
import type { SharedPuzzle } from "@/lib/puzzles/codec";
import { definePuzzle, standardQuestions, type Puzzle } from "@/lib/puzzles/schema";
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
  const source = puzzleFileSource(sharedFrom("mx-05"), "cm-01");

  it("definePuzzle의 검사를 통과한다", () => {
    expect(() => definePuzzle(evaluate(source))).not.toThrow();
  });

  it("솔버가 원본과 같은 유일해를 낸다", () => {
    const p = evaluate(source);
    const { worlds } = analyze(p);
    expect(worlds).toHaveLength(1);
    expect(worlds[0].assignment).toEqual(p.solution);
  });

  it("질문이 표준 셋(악마 위치·종류·하수인 위치)이다 — puzzles.test.ts가 수록 퍼즐에 요구하는 그 모양", () => {
    // 에디터가 만든 SharedPuzzle은 questions를 standardQuestions로 채운다. 그 파일을 index.ts에
    // 등록하면 puzzles.test.ts의 "악마의 위치·종류·하수인의 위치를 묻는다"를 그대로 통과해야 한다.
    const shared: SharedPuzzle = { ...sharedFrom("mx-05"), questions: standardQuestions(sharedFrom("mx-05")) };
    const p = evaluate(puzzleFileSource(shared, "cm-01"));
    expect(p.questions.map((q) => q.id)).toEqual(
      p.rolePool.filter((r) => ROLES[r].team === "demon").length === 1
        ? ["demon", "minion"]
        : ["demon", "demonType", "minion"],
    );
    expect(p.questions[0]).toMatchObject({ id: "demon", answerSeats: [p.solution.findIndex((r) => ROLES[r].team === "demon")] });
  });

  it("실제 판 표시가 파일에 남는다", () => {
    const p = evaluate(puzzleFileSource({ ...sharedFrom("mx-05"), realGame: true }, "cm-02"));
    expect(p.realGame).toBe(true);
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
    expect(nextCommunityId(["mx-05", "cm-01", "cm-02"])).toBe("cm-03");
  });

  it("등록 두 줄이 파일명과 맞물린다", () => {
    expect(indexSnippet("cm-01")).toEqual({ importLine: 'import cm01 from "./cm-01";', arrayItem: "cm01" });
  });
});
