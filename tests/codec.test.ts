// 공유 링크 코덱 — 왕복 정확성 + 신뢰할 수 없는 입력 방어.

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import { decodePuzzle, encodePuzzle, toPuzzle, validateShared, type SharedPuzzle } from "@/lib/puzzles/codec";
import { solve } from "@/lib/solver/solve";

function sharedFrom(id: string): SharedPuzzle {
  const p = PUZZLES.find((x) => x.id === id)!;
  const { id: _id, source: _source, ...rest } = p;
  void _id;
  void _source;
  return rest;
}

describe("공유 링크 코덱", () => {
  it("공식 퍼즐을 왕복해도 내용이 보존된다", async () => {
    for (const p of PUZZLES) {
      const original = sharedFrom(p.id);
      const round = await decodePuzzle(await encodePuzzle(original));
      expect(round.title, p.id).toBe(original.title);
      expect(round.playerCount, p.id).toBe(original.playerCount);
      expect(round.solution, p.id).toEqual(original.solution);
      expect(round.claims, p.id).toEqual(original.claims);
      expect(round.events, p.id).toEqual(original.events);
      expect(round.questions, p.id).toEqual(original.questions);
    }
  });

  it("왕복한 퍼즐도 솔버에서 여전히 유일해다", async () => {
    const original = sharedFrom("tb-01");
    const round = await decodePuzzle(await encodePuzzle(original));
    expect(solve(toPuzzle(round, "shared"))).toHaveLength(1);
  });

  it("링크 길이가 실용 범위 안이다", async () => {
    for (const p of PUZZLES) {
      const encoded = await encodePuzzle(sharedFrom(p.id));
      expect(encoded.length, `${p.id} 링크 길이 ${encoded.length}`).toBeLessThan(8000);
    }
  });

  it("망가진 링크는 사람이 읽을 수 있는 오류를 낸다", async () => {
    await expect(decodePuzzle("!!!아무거나!!!")).rejects.toThrow(/링크/);
  });

  it("버전이 다르면 거부한다", async () => {
    const bad = btoa(String.fromCharCode(...new TextEncoder().encode("x")));
    await expect(decodePuzzle(bad)).rejects.toThrow();
  });
});

describe("검증 — 신뢰할 수 없는 입력", () => {
  const base = () => sharedFrom("tb-01") as unknown as Record<string, unknown>;

  it("정상 퍼즐은 통과한다", () => {
    expect(() => validateShared(base())).not.toThrow();
  });

  it("인원수가 범위를 벗어나면 거부한다", () => {
    expect(() => validateShared({ ...base(), playerCount: 99 })).toThrow(/인원수/);
    expect(() => validateShared({ ...base(), playerCount: 1 })).toThrow(/인원수/);
  });

  it("알 수 없는 역할은 거부한다", () => {
    expect(() => validateShared({ ...base(), rolePool: ["imp", "해커"] })).toThrow(/역할/);
  });

  it("임프 없는 역할 풀은 거부한다", () => {
    expect(() => validateShared({ ...base(), rolePool: ["chef", "empath"] })).toThrow(/임프/);
  });

  it("주장 수가 인원수와 다르면 거부한다", () => {
    expect(() => validateShared({ ...base(), claims: [] })).toThrow(/인원수/);
  });

  it("좌석 번호가 범위를 벗어나면 거부한다", () => {
    const b = base();
    const claims = structuredClone(b.claims) as { seat: number }[];
    claims[0].seat = 999;
    expect(() => validateShared({ ...b, claims })).toThrow(/좌석/);
  });

  it("정답 배치에 임프가 없으면 거부한다", () => {
    const b = base();
    const solution = (b.solution as string[]).map((r) => (r === "imp" ? "chef" : r));
    expect(() => validateShared({ ...b, solution })).toThrow(/임프/);
  });

  it("지나치게 긴 제목은 거부한다", () => {
    expect(() => validateShared({ ...base(), title: "가".repeat(500) })).toThrow(/제목/);
  });

  it("객체가 아닌 입력은 거부한다", () => {
    expect(() => validateShared(null)).toThrow();
    expect(() => validateShared("문자열")).toThrow();
    expect(() => validateShared([1, 2, 3])).toThrow();
  });

  it("정답 좌석이 인원수보다 많으면 거부한다 (풀 수 없는 문제 방지)", () => {
    const b = base();
    const questions = structuredClone(b.questions) as { answerSeats: number[] }[];
    questions[0].answerSeats = Array.from({ length: 50 }, (_, i) => i % 5);
    expect(() => validateShared({ ...b, questions })).toThrow(/정답 좌석/);
  });

  it("정답 좌석에 중복이 있으면 거부한다 (좌석 선택은 토글이라 답할 수 없음)", () => {
    const b = base();
    const questions = structuredClone(b.questions) as { answerSeats: number[] }[];
    questions[0].answerSeats = [1, 1];
    expect(() => validateShared({ ...b, questions })).toThrow(/중복/);
  });

  it("정답 배치의 역할이 풀에 없으면 거부한다", () => {
    const b = base();
    const solution = [...(b.solution as string[])];
    solution[solution.findIndex((r) => r !== "imp")] = "juggler";
    expect(() => validateShared({ ...b, solution })).toThrow(/역할 풀/);
  });
});
