// 공유 링크 코덱 — 왕복 정확성 + 신뢰할 수 없는 입력 방어.

import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/data/puzzles";
import { LIMITS, decodePuzzle, encodePuzzle, toPuzzle, validateShared, type SharedPuzzle } from "@/lib/puzzles/codec";
import { solve } from "@/lib/solver/solve";

function sharedFrom(id: string): SharedPuzzle {
  const p = PUZZLES.find((x) => x.id === id)!;
  const { id: _id, source: _source, ...rest } = p;
  void _id;
  void _source;
  return rest;
}

describe("공유 링크 코덱", () => {
  it("공식 퍼즐을 왕복해도 내용이 보존된다 — 필드 전체 비교", async () => {
    // 일부 필드만 비교하면 스키마에 더한 필드가 코덱에서 조용히 떨어져도 잡지 못한다 (realGame 전례)
    for (const p of PUZZLES) {
      const original = sharedFrom(p.id);
      const round = await decodePuzzle(await encodePuzzle(original));
      expect(round, p.id).toEqual(original);
    }
  });

  it("실제 판 표시(realGame)도 왕복한다", async () => {
    const original: SharedPuzzle = { ...sharedFrom("mx-05"), realGame: true };
    const round = await decodePuzzle(await encodePuzzle(original));
    expect(round.realGame).toBe(true);
    expect((await decodePuzzle(await encodePuzzle(sharedFrom("mx-05")))).realGame).toBeUndefined();
  });

  it("알 수 없는 판본·난이도는 기본값으로 바꾸지 않고 거부한다", () => {
    const base = sharedFrom("mx-05");
    expect(() => validateShared({ ...base, difficulty: "insane" })).toThrow(/난이도/);
    expect(() => validateShared({ ...base, edition: "xx" })).toThrow(/판본/);
  });

  it("왕복한 퍼즐도 솔버에서 여전히 유일해다", async () => {
    const original = sharedFrom("mx-05");
    const round = await decodePuzzle(await encodePuzzle(original));
    expect(solve(toPuzzle(round, "shared"))).toHaveLength(1);
  });

  it("링크 길이가 실용 범위 안이다", async () => {
    for (const p of PUZZLES) {
      const encoded = await encodePuzzle(sharedFrom(p.id));
      expect(encoded.length, `${p.id} 링크 길이 ${encoded.length}`).toBeLessThan(8000);
    }
  });

  it("마귀할멈 변신 이력도 왕복해서 보존된다", async () => {
    const original: SharedPuzzle = {
      ...sharedFrom("tb-05"),
      claims: sharedFrom("tb-05").claims.map((c, i) =>
        i === 0
          ? { ...c, role: "undertaker", roleChange: { night: 2, from: "empath" }, info: [] }
          : c,
      ),
    };
    const round = await decodePuzzle(await encodePuzzle(original));
    expect(round.claims[0].roleChange).toEqual({ night: 2, from: "empath" });
    expect(round.claims, "이력 없는 주장에는 필드가 생기지 않는다").toEqual(original.claims);
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
  const base = () => sharedFrom("mx-05") as unknown as Record<string, unknown>;

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

  it("악마 없는 역할 풀은 거부한다", () => {
    expect(() => validateShared({ ...base(), rolePool: ["chef", "empath"] })).toThrow(/악마/);
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

  it("정답 배치에 악마가 없으면 거부한다", () => {
    const b = base();
    const solution = (b.solution as string[]).map((r) => (r === "imp" ? "chef" : r));
    expect(() => validateShared({ ...b, solution })).toThrow(/악마/);
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

  it("낮 공개 행동 이벤트(총격·지명·성결자 발동)가 왕복에 보존된다", async () => {
    const b = base();
    const events = [
      { type: "slayerShot", day: 1, seat: 0, target: 1, died: false },
      { type: "nomination", day: 1, nominator: 2, nominee: 3 },
      { type: "virginTrigger", day: 1, nominator: 4, nominee: 3 },
      { type: "vote", day: 1, seat: 2 },
    ];
    const round = await decodePuzzle(await encodePuzzle(validateShared({ ...b, events })));
    expect(round.events).toEqual(events);
  });

  it("낮 행동 이벤트의 좌석이 범위 밖이면 거부한다", () => {
    const b = base();
    expect(() => validateShared({ ...b, events: [{ type: "slayerShot", day: 1, seat: 99, target: 1, died: true }] }))
      .toThrow(/총격자 좌석/);
    expect(() => validateShared({ ...b, events: [{ type: "nomination", day: 1, nominator: 0, nominee: -1 }] }))
      .toThrow(/지명 대상 좌석/);
  });

  it("사건이 상한을 넘으면 거부한다 — 반복 이벤트는 압축이 잘 돼 작은 링크로도 솔버를 오래 돌릴 수 있다", () => {
    const b = base();
    const events = Array.from({ length: LIMITS.maxEvents + 1 }, () => ({ type: "vote", day: 1, seat: 0 }));
    expect(() => validateShared({ ...b, events })).toThrow(/사건이 너무 많습니다/);
    expect(() => validateShared({ ...b, events: events.slice(0, LIMITS.maxEvents) })).not.toThrow();
  });

  it("제어문자(개행 등)가 든 문자열은 거부한다 — 별명은 수록 신청 파일의 주석에 보간된다", () => {
    const b = base();
    expect(() => validateShared({ ...b, author: "a\nexport const X = 1;" })).toThrow(/별명/);
    expect(() => validateShared({ ...b, title: "제목\u0000" })).toThrow(/제목/);
    expect(() => validateShared({ ...b, walkthrough: ["한 줄\r\n두 줄"] })).toThrow(/해설/);
  });

  it("지나치게 긴 프래그먼트는 해동 전에 거부한다", async () => {
    await expect(decodePuzzle("A".repeat(LIMITS.maxFragment + 1))).rejects.toThrow(/너무 큽니다/);
  });

  it("작은 링크가 거대한 JSON으로 부푸는 것을 해동 단계에서 막는다", async () => {
    // 압축은 잘 되지만 해동하면 maxJsonBytes를 넘는 페이로드
    const huge = JSON.stringify({ v: 1, p: { title: "x".repeat(LIMITS.maxJsonBytes + 1024) } });
    const bytes = new Uint8Array(await new Response(new Blob([huge]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
    let bin = "";
    for (const x of bytes) bin += String.fromCharCode(x);
    const fragment = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(fragment.length).toBeLessThan(LIMITS.maxFragment); // 프래그먼트 길이 검사로는 안 걸린다
    await expect(decodePuzzle(fragment)).rejects.toThrow(/너무 큽니다/);
  });

  it("세탁부류 지목이 자기 자신이거나 같은 좌석 둘이면 거부한다", () => {
    const b = base();
    const withTargets = (targets: [number, number]) => {
      const claims = structuredClone(b.claims) as { seat: number; info: unknown[] }[];
      claims[0].info = [{ night: 1, data: { type: "washerwoman", targets, shownRole: "chef" } }];
      return { ...b, claims };
    };
    expect(() => validateShared(withTargets([0, 1]))).toThrow(/자기 자신/);
    expect(() => validateShared(withTargets([1, 1]))).toThrow(/서로 달라야/);
    expect(() => validateShared(withTargets([1, 2]))).not.toThrow();
  });
});
