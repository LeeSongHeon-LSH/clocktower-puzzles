// 퍼즐 레지스트리. 새 퍼즐 = 파일 추가 + 여기 등록. npm test가 유일해를 검증한다.

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
