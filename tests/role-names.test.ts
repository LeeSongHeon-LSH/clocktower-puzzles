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
  소문꾼: "gossip", // 2026-09-21 리뷰: 사전은 "험담꾼"인데 해설·규칙 본문이 이 표기를 쓰고 있었다
  // 2026-09-29: 설계 문서 점검에서 드러난 옛 표기 — 퍼즐 산문·해설·솔버 오류 메시지에 남아 있었다
  저글러: "juggler",
  스위트하트: "sweetheart",
  광인: "mutant",
  루나틱: "lunatic",
  몽상가: "dreamer",
  마스터마인드: "mastermind",
  얼간이: "klutz",
  "악의 쌍둥이": "eviltwin",
  세레노부스: "cerenovus",
  "꽃파는 소녀": "flowergirl",
  "마을 서기": "towncrier",
  빨래꾼: "washerwoman",
  // 백치천재(savant)의 옛 표기 "학자"는 철학자·수학자와 겹쳐 금지어로 두지 못한다 — 눈으로 본다
  // 궁정대신(courtier)의 옛 표기 "대신"은 일반 단어와 겹쳐 금지어로 두지 못한다 — 눈으로 본다
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

  // 사전 표기에 공백이 든 역할("여관 주인"·"객실 청소부"·"찻집 여인" 등)은 공백을 뺀 변형이 산문에
  // 스며들기 쉽다 — 사전에서 파생해 전부 검사한다 (2026-09-21 리뷰: "여관주인"이 6개 파일에 있었다)
  const squished = Object.entries(ROLES).flatMap(([id, meta]) =>
    meta.ko.includes(" ") ? [[meta.ko.replace(/ /g, ""), id as keyof typeof ROLES] as const] : [],
  );
  for (const [variant, id] of squished) {
    it(`"${variant}"은(는) 쓰지 않는다 — 사전 표기는 "${ROLES[id].ko}"`, () => {
      const hits = files.filter((f) => readFileSync(f, "utf8").includes(variant));
      expect(hits, hits.join(", ")).toEqual([]);
    });
  }

  for (const [old, id] of Object.entries(OUTDATED)) {
    it(`"${old}"은(는) 쓰지 않는다 — 지금 표기는 "${ROLES[id].ko}"`, () => {
      const hits = files.filter((f) => readFileSync(f, "utf8").replace(/현상금 사냥꾼/g, "").includes(old));
      expect(hits, hits.join(", ")).toEqual([]);
    });
  }
});
