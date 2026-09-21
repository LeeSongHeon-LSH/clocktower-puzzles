// 시계공: 밤1, 악마에서 가장 가까운 하수인까지의 좌석 거리(스텝)를 배운다.
//
// 오등록을 반영한다 (요리사와 같은 전수 조합): 은둔자는 하수인 또는 악마로, 첩자는 마을 사람으로
// 등록될 수 있고, 마귀할멈은 자기를 마을 사람으로 바꿨을 수 있다(∃). 실제 토큰만 보면 그런
// 등록으로 성립하는 세계를 지워 버려 유일해를 거짓으로 증명할 수 있다 — 세계를 늘리는 쪽이 건전하다.

import { ROLES } from "@/data/roles";
import { circularDistance, Ctx, view } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "clockmaker" }>;

type Reg = "demon" | "minion" | "other";

/** 오등록 조합마다 나오는 스텝 수의 집합 (참 판정·거짓 판정 공용). 하수인이 없는 조합은 값을 내지 않는다 */
export function clockmakerStepsSet(ctx: Ctx, night: number): Set<number> {
  const n = ctx.pz.playerCount;
  const v = view(ctx, night);
  // 좌석별로 등록될 수 있는 팀들 — 첫 항목이 실제 토큰의 팀
  const options: Reg[][] = [];
  for (let s = 0; s < n; s++) {
    const tok = v.tokenRole(s);
    const team = ROLES[tok].team;
    if (tok === "recluse") options.push(["other", "minion", "demon"]);
    else if (tok === "spy") options.push(["minion", "other"]);
    else if (tok === "pithag" && (v.pithagSelfOptions?.length ?? 0) > 0) options.push(["minion", "other"]);
    else options.push([team === "demon" ? "demon" : team === "minion" ? "minion" : "other"]);
  }

  const out = new Set<number>();
  const reg: Reg[] = new Array(n);
  const walk = (s: number) => {
    if (s === n) {
      for (let d = 0; d < n; d++) {
        if (reg[d] !== "demon") continue;
        let best = Infinity;
        for (let m = 0; m < n; m++) {
          if (reg[m] === "minion") best = Math.min(best, circularDistance(n, d, m));
        }
        if (Number.isFinite(best)) out.add(best);
      }
      return;
    }
    for (const r of options[s]) {
      reg[s] = r;
      walk(s + 1);
    }
  };
  walk(0);
  return out;
}

export function clockmaker(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  return clockmakerStepsSet(ctx, night).has(data.steps);
}
