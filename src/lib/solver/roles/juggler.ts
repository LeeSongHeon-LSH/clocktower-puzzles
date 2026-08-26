// 곡예사: 첫날 낮에 공개로 최대 5건 (플레이어, 역할)을 추측하고, 밤2에 맞힌 수를 배운다.

import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "juggler" }>;

export function juggler(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const v = view(ctx, night);
  let min = 0;
  let max = 0;
  for (const g of data.guesses) {
    const token = v.tokenRole(g.seat);
    const flexible = token === "recluse" || token === "spy"; // 오등록으로 정답 여부가 흔들릴 수 있음
    if (canShowAsRole(v, g.seat, g.role)) max++;
    if (token === g.role && !flexible) min++;
  }
  return data.correct >= min && data.correct <= max;
}
