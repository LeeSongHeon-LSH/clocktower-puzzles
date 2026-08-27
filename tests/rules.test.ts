// 규칙 페이지와 출처의 정합성 (네트워크 없이 도는 검사).
// 공식 원문과의 대조는 `npm run rules:check`가 담당한다.

import { describe, expect, it } from "vitest";
import { RULE_SECTIONS } from "@/data/rules";
import { RULE_SOURCES } from "@/data/rule-sources.generated";

const cited = new Set(RULE_SECTIONS.flatMap((s) => s.statements.flatMap((st) => st.sources)));

describe("규칙 페이지", () => {
  it("모든 서술에 근거 출처가 최소 하나 붙어 있다", () => {
    for (const section of RULE_SECTIONS) {
      for (const statement of section.statements) {
        expect(statement.sources.length, `${section.id} / ${statement.headline}`).toBeGreaterThan(0);
      }
    }
  });

  it("인용된 출처는 모두 생성 파일에 존재한다", () => {
    for (const key of cited) {
      expect(RULE_SOURCES, `누락된 출처: ${key}`).toHaveProperty(key);
    }
  });

  it("생성 파일에 쓰이지 않는 출처가 남아 있지 않다", () => {
    const orphans = Object.keys(RULE_SOURCES).filter((k) => !cited.has(k as never));
    expect(orphans, "본문에서 인용되지 않는 출처").toEqual([]);
  });

  it("모든 출처가 공식 위키를 가리키고 판본 정보를 갖는다", () => {
    for (const [key, source] of Object.entries(RULE_SOURCES)) {
      expect(source.url, key).toMatch(/^https:\/\/wiki\.bloodontheclocktower\.com\//);
      expect(source.revid, key).toBeGreaterThan(0);
      expect(source.revised, key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.quote.length, key).toBeGreaterThan(10);
    }
  });

  it("섹션 id가 중복되지 않는다", () => {
    const ids = RULE_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
