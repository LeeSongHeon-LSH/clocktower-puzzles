// 퍼즐 레지스트리. 새 퍼즐 = 파일 추가 + 여기 등록.
//
// npm test가 유일해를 검증한다. 검증기가 능력을 모르는 역할(실험적 역할)이 든 퍼즐만
// 유일해 단정을 건너뛰고, 대신 해설을 필수로 요구한다 — 그 판정은 파일 내용에서
// 파생되므로(unmodeledRoles) 따로 적는 필드도, 별도 디렉터리도 없다.

import type { Puzzle } from "@/lib/puzzles/schema";

import tb01 from "./tb-01";
import tb02 from "./tb-02";
import tb03 from "./tb-03";
import tb04 from "./tb-04";
import tb05 from "./tb-05";
import tb06 from "./tb-06";
import mx01 from "./mx-01";
import mx02 from "./mx-02";
import mx03 from "./mx-03";
import mx04 from "./mx-04";

export const PUZZLES: Puzzle[] = [tb01, tb02, tb03, tb04, tb05, tb06, mx01, mx02, mx03, mx04];

export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}
