// 역할명 표기 정합 — 사전(roles.ts) 밖의 문자열이 옛 표기를 쓰지 않는지 검사한다.
//
// CLAUDE.md 규칙: 역할명 표기는 사전 한 곳에서만. 그러나 산문(퍼즐 서술·해설·규칙 본문)은
// 사전을 거치지 않으므로, 사전이 바뀌면 본문이 따라가지 않은 채 남는다 (2026-09-08 리뷰:
// 처단자→"사냥꾼"·"학살자", 성결자→"처녀", 샤발로스→"샤바로스", 좀버얼→"좀부울"이 63곳).
// 사전을 바꾸면 여기 금지어 목록에 옛 표기를 더한다.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROLES } from "@/data/roles";

/** 옛 표기 → 지금 표기의 역할 id */
const OUTDATED: Record<string, keyof typeof ROLES> = {
  사냥꾼: "slayer", // 주의: 실험적 역할 huntsman의 공식 표기도 "사냥꾼"이다 — 그 역할을 쓰게 되면 이 항목을 조정한다
  학살자: "slayer",
  처녀: "virgin",
  샤바로스: "shabaloth",
  좀부울: "zombuul",
};

const ROOTS = ["src/components", "src/app", "src/data/puzzles", "src/data/rules.ts", "src/data/role-notes.ts", "src/lib"];

function walk(path: string): string[] {
  if (statSync(path).isFile()) return /\.(ts|tsx)$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((name) => walk(join(path, name)));
}

describe("역할명 표기", () => {
  const files = ROOTS.flatMap((r) => walk(r));

  it("검사 대상 파일이 있다", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  for (const [old, id] of Object.entries(OUTDATED)) {
    it(`"${old}"은(는) 쓰지 않는다 — 지금 표기는 "${ROLES[id].ko}"`, () => {
      const hits = files.filter((f) => readFileSync(f, "utf8").replace(/현상금 사냥꾼/g, "").includes(old));
      expect(hits, hits.join(", ")).toEqual([]);
    });
  }
});
