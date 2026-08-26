// tb-02 제작 보조: 의도한 정답을 고정하고 주장 파라미터를 전수 탐색해
// "유일해 = 의도한 월드"가 되는 조합을 찾는다. (일회성 제작 도구)
//
// 의도: A=사서, B=요리사, C=임프(초공감자 사칭), D=부정한 여인(점쟁이 사칭),
//       E=주정뱅이(점쟁이라 믿음 → 점쟁이가 셋?!), F=수사관. 악역 {C,D} 인접 → 요리사 1.

import { solve } from "@/lib/solver/solve";
import type { RoleId, Seat, SolverPuzzle } from "@/lib/solver/types";

const SOLUTION: RoleId[] = ["librarian", "chef", "imp", "scarletwoman", "drunk", "investigator"];
const TARGET_KEY = SOLUTION.join(",") + "|d2";

const seats = [0, 1, 2, 3, 4, 5];
const pairs: [Seat, Seat][] = [];
for (const a of seats) for (const b of seats) if (a < b) pairs.push([a, b]);

const results: string[] = [];
let tried = 0;

for (const a2 of [1, 2, 3, 5]) {
  for (const cCount of [0, 1, 2]) {
    for (const [d1, d2] of pairs.filter(([x, y]) => x !== 3 && y !== 3)) {
      for (const dYes of [false, true]) {
        for (const [e1, e2] of pairs.filter(([x, y]) => x !== 4 && y !== 4)) {
          for (const eYes of [false, true]) {
            for (const f2 of [0, 1, 2, 4]) {
              tried++;
              const pz: SolverPuzzle = {
                playerCount: 6,
                rolePool: ["imp", "scarletwoman", "washerwoman", "librarian", "chef", "empath", "fortuneteller", "investigator", "drunk"],
                nights: 1,
                events: [],
                claims: [
                  { seat: 0, role: "librarian", info: [{ night: 1, data: { type: "librarian", targets: [4, a2], shownRole: "drunk" } }] },
                  { seat: 1, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
                  { seat: 2, role: "empath", info: [{ night: 1, data: { type: "empath", count: cCount } }] },
                  { seat: 3, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [d1, d2], yes: dYes } }] },
                  { seat: 4, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [e1, e2], yes: eYes } }] },
                  { seat: 5, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [3, f2], shownRole: "scarletwoman" } }] },
                ],
              };
              const worlds = solve(pz);
              if (worlds.length === 1) {
                const key = worlds[0].assignment.join(",") + "|d" + worlds[0].currentDemonSeat;
                if (key === TARGET_KEY) {
                  results.push(`A2=${a2} Cc=${cCount} D=[${d1},${d2}]${dYes ? "Y" : "N"} E=[${e1},${e2}]${eYes ? "Y" : "N"} F2=${f2}`);
                }
              }
            }
          }
        }
      }
    }
  }
}

console.log(`시도 ${tried}개, 성공 ${results.length}개`);
for (const r of results.slice(0, 30)) console.log(r);
