// 세탁부: 밤1, 두 명 중 하나가 특정 마을 주민 역할임을 배운다.

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "washerwoman" }>;

export function washerwoman(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  if (ROLES[data.shownRole].team !== "townsfolk") return false;
  const v = view(ctx, night);
  return data.targets.some((t) => canShowAsRole(v, t, data.shownRole));
}
