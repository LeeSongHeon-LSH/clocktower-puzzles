// 역할 규칙 문서의 정합성 (네트워크 없이 도는 검사).
// 공식 번역과의 대조는 `npm run rules:check`가 담당한다.

import { describe, expect, it } from "vitest";
import { ROLES } from "@/data/roles";
import { ROLE_NOTES } from "@/data/role-notes";
import { ROLE_RULES, ROLE_TRANSLATION_SOURCE } from "@/data/role-rules.generated";
import { ROLE_IDS, SOLVER_ROLES, type RoleId } from "@/lib/solver/types";

const ids = ROLE_IDS as readonly RoleId[];

describe("역할 규칙 문서", () => {
  it("모든 역할에 공식 능력 문구가 있다", () => {
    for (const id of ids) {
      expect(ROLE_RULES, id).toHaveProperty(id);
      expect(ROLE_RULES[id].ability.length, id).toBeGreaterThan(5);
    }
  });

  // 해설은 사전 전체가 아니라 솔버가 아는 역할에 대해서만 의무다 —
  // 나머지는 공식 능력 문구와 알마낙 링크로 충분하고, 채워 넣은 빈 해설이 더 나쁘다.
  it("솔버가 모델링하는 역할에는 직접 쓴 해설이 있다", () => {
    for (const id of SOLVER_ROLES) {
      const note = ROLE_NOTES[id];
      expect(note, id).toBeDefined();
      expect(note!.whatItMeans.length, `${id} whatItMeans`).toBeGreaterThan(20);
      expect(note!.whenBroken.length, `${id} whenBroken`).toBeGreaterThan(10);
    }
  });

  it("해설은 사전에 있는 역할에만 달려 있고 형식을 지킨다", () => {
    for (const [id, note] of Object.entries(ROLE_NOTES)) {
      expect(ids, `${id}는 사전에 없는 역할`).toContain(id);
      expect(note!.whatItMeans.length, `${id} whatItMeans`).toBeGreaterThan(20);
      expect(note!.whenBroken.length, `${id} whenBroken`).toBeGreaterThan(10);
    }
  });

  it("SOLVER_ROLES가 사전의 부분집합이다", () => {
    for (const id of SOLVER_ROLES) expect(ids, id).toContain(id);
  });

  it("roles.ts 표기가 생성 파일의 공식 표기와 일치한다", () => {
    for (const id of ids) {
      expect(ROLES[id].ko, `${id} 표기가 공식과 다름`).toBe(ROLE_RULES[id].officialName);
    }
  });

  it("알마낙 링크가 공식 위키를 가리킨다", () => {
    for (const id of ids) {
      expect(ROLE_RULES[id].almanacUrl, id).toMatch(
        /^https:\/\/wiki\.bloodontheclocktower\.com\/\S+$/,
      );
    }
  });

  it("번역 출처에 판본 정보가 있다", () => {
    expect(ROLE_TRANSLATION_SOURCE.commit).toMatch(/^[0-9a-f]{7}$/);
    expect(ROLE_TRANSLATION_SOURCE.committed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ROLE_TRANSLATION_SOURCE.url).toMatch(/^https:\/\/github\.com\//);
  });

  it("생성 파일에 사전에 없는 역할이 섞여 있지 않다", () => {
    expect(Object.keys(ROLE_RULES).sort()).toEqual([...ids].sort());
  });
});
