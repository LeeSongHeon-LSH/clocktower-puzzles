// 퍼즐 제작용 도구: 솔버를 돌려 월드 목록을 출력한다.
// 사용: npx tsx scripts/solve-puzzle.ts <퍼즐 id>

import { getPuzzle, PUZZLES } from "@/data/puzzles";
import { seatName } from "@/lib/puzzles/schema";
import { solve } from "@/lib/solver/solve";

const id = process.argv[2];
const targets = id ? [getPuzzle(id)].filter((p) => p !== undefined) : PUZZLES;
if (targets.length === 0) {
  console.error(`퍼즐을 찾을 수 없음: ${id}`);
  process.exit(1);
}

for (const pz of targets) {
  const t0 = performance.now();
  const worlds = solve(pz);
  const ms = Math.round(performance.now() - t0);
  console.log(`\n■ ${pz.id} — 월드 ${worlds.length}개 (${ms}ms)`);
  for (const w of worlds) {
    const row = w.assignment.map((r, s) => `${seatName(s)}:${r}`).join(" ");
    console.log(`  ${row}  | 데몬=${seatName(w.currentDemonSeat)}`);
  }
}
