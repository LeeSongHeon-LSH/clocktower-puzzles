// 요리사: 밤1, 인접한 악인 쌍의 수를 배운다. 은둔자·첩자의 오등록 조합을 전수 검사.

import { Ctx, view } from "../ctx";
import { canRegisterEvil, mustRegisterEvil } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "chef" }>;

/** 오등록 조합마다 나오는 인접 악인 쌍 수의 집합 (참 판정·거짓 판정 공용) */
export function chefPairCounts(ctx: Ctx, night: number): Set<number> {
  const n = ctx.pz.playerCount;
  const v = view(ctx, night);
  const flex: Seat[] = [];
  const baseEvil: boolean[] = [];
  for (let s = 0; s < n; s++) {
    const must = mustRegisterEvil(v, s);
    baseEvil[s] = must;
    if (canRegisterEvil(v, s) && !must) flex.push(s); // 은둔자(선→악 가능) 또는 첩자(악→선 가능)
  }
  const out = new Set<number>();
  for (let mask = 0; mask < 1 << flex.length; mask++) {
    const evil = [...baseEvil];
    flex.forEach((s, i) => { evil[s] = (mask & (1 << i)) !== 0; });
    let pairs = 0;
    for (let s = 0; s < n; s++) {
      if (evil[s] && evil[(s + 1) % n]) pairs++;
    }
    out.add(pairs);
  }
  return out;
}

export function chef(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  return chefPairCounts(ctx, night).has(data.count);
}
