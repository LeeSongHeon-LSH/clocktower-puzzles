// 퍼즐 레지스트리. 새 퍼즐 = 파일 추가 + 여기 등록.
//
// npm test가 유일해를 검증한다. 검증기가 능력을 모르는 역할(실험적 역할)이 든 퍼즐만
// 유일해 단정을 건너뛰고, 대신 해설을 필수로 요구한다 — 그 판정은 파일 내용에서
// 파생되므로(unmodeledRoles) 따로 적는 필드도, 별도 디렉터리도 없다.
//
// 배열 순서 = 목록에 보이는 순서. 쉬움 → 보통 → 어려움으로 둔다.

import type { Puzzle } from "@/lib/puzzles/schema";

import mx05 from "./mx-05";
import tb07 from "./tb-07";
import tb05 from "./tb-05";
import tb08 from "./tb-08";
import mx06 from "./mx-06";
import mx07 from "./mx-07";
import mx08 from "./mx-08";
import mx04 from "./mx-04";
import mx09 from "./mx-09";
import mx10 from "./mx-10";
import mx11 from "./mx-11";
import mx12 from "./mx-12";

export const PUZZLES: Puzzle[] = [
  // 쉬움
  mx05, tb07,
  // 보통
  tb05, tb08, mx06, mx07, mx08,
  // 어려움
  mx04, mx09, mx10, mx11, mx12,
];

export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}
