// 까마귀지기: 밤에 죽으면 깨어나 한 명을 골라 그 역할을 배운다.

import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "ravenkeeper" }>;

export function ravenkeeper(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const v = view(ctx, night);
  return canShowAsRole(v, data.target, data.shownRole);
}
