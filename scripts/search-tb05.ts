// tb-05 제작 보조: 주장 파라미터 전수 탐색 (일회성 제작 도구)

import { solve } from "@/lib/solver/solve";
import type { Claim, RoleId, Seat, SolverPuzzle } from "@/lib/solver/types";

const SOLUTION: RoleId[] = ["empath", "librarian", "drunk", "imp", "recluse", "baron", "fortuneteller"];
const TARGET_KEY = SOLUTION.join(",") + "|d3";

const seats = [0, 1, 2, 3, 4, 5, 6];
const pairs: [Seat, Seat][] = [];
for (const a of seats) for (const b of seats) if (a < b && a !== 6 && b !== 6) pairs.push([a, b]);

// D(임프)의 사칭 후보들
const dBluffs: { label: string; claim: Claim }[] = [
  ...[0, 1, 2].map((c) => ({
    label: `chef${c}`,
    claim: { seat: 3, role: "chef", info: [{ night: 1, data: { type: "chef", count: c } }] } as Claim,
  })),
  { label: "ww60e", claim: { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [6, 0], shownRole: "empath" } }] } },
  { label: "inv16b", claim: { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [1, 6], shownRole: "baron" } }] } },
  { label: "inv01b", claim: { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [0, 1], shownRole: "baron" } }] } },
  { label: "inv26b", claim: { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [2, 6], shownRole: "baron" } }] } },
];

const results: string[] = [];
let tried = 0;

for (const cCount of [0, 1, 2]) {
  for (const f1 of [0, 1]) {
    for (const f2 of [0, 1]) {
      for (const d of dBluffs) {
        for (const [g1, g2] of pairs) {
          tried++;
          const pz: SolverPuzzle = {
            playerCount: 7,
            rolePool: [
              "imp", "baron", "recluse", "drunk",
              "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller",
            ],
            nights: 2,
            events: [
              { type: "execution", day: 1, seat: 0 },
              { type: "death", night: 2, seat: 1 },
            ],
            claims: [
              { seat: 0, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
              { seat: 1, role: "librarian", info: [{ night: 1, data: { type: "librarian", targets: [2, 4], shownRole: "drunk" } }] },
              { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: cCount } }] },
              d.claim,
              { seat: 4, role: "recluse", info: [] },
              {
                seat: 5, role: "empath", info: [
                  { night: 1, data: { type: "empath", count: f1 } },
                  { night: 2, data: { type: "empath", count: f2 } },
                ],
              },
              {
                seat: 6, role: "fortuneteller", info: [
                  { night: 1, data: { type: "fortuneteller", targets: [3, 4], yes: true } },
                  { night: 2, data: { type: "fortuneteller", targets: [g1, g2], yes: false } },
                ],
              },
            ],
          };
          try {
            const worlds = solve(pz);
            if (worlds.length === 1) {
              const key = worlds[0].assignment.join(",") + "|d" + worlds[0].currentDemonSeat;
              if (key === TARGET_KEY) results.push(`Cc=${cCount} F=${f1}/${f2} D=${d.label} Gn2=[${g1},${g2}]`);
            }
          } catch { /* 모순 구성은 무시 */ }
        }
      }
    }
  }
}

console.log(`시도 ${tried}개, 성공 ${results.length}개`);
for (const r of results.slice(0, 30)) console.log(r);
