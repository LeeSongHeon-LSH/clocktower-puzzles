// 요리사: 밤1, 인접한 악인 쌍의 수를 배운다. 은둔자·첩자의 오등록 조합을 전수 검사.

import { Ctx } from "../ctx";
import { canRegisterEvil, mustRegisterEvil } from "../registration";
import { view } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "chef" }>;

export function chef(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const n = ctx.pz.playerCount;
  const v = view(ctx, night);
  const flex: Seat[] = [];
  const baseEvil: boolean[] = [];
  for (let s = 0; s < n; s++) {
    const must = mustRegisterEvil(v, s);
    const can = canRegisterEvil(v, s);
    baseEvil[s] = must;
    if (can && !must) flex.push(s); // 은둔자(선→악 가능) 또는 첩자(악→선 가능)
  }
  // 첩자는 기본 악, 선 등록 가능 — baseEvil엔 false로 두고 조합에서 켠다 (은둔자와 동일 취급 가능)
  const combos = 1 << flex.length;
  for (let mask = 0; mask < combos; mask++) {
    const evil = [...baseEvil];
    flex.forEach((s, i) => { evil[s] = (mask & (1 << i)) !== 0; });
    let pairs = 0;
    for (let s = 0; s < n; s++) {
      if (evil[s] && evil[(s + 1) % n]) pairs++;
    }
    if (pairs === data.count) return true;
  }
  return false;
}
