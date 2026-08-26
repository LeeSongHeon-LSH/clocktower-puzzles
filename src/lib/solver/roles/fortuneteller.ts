// 점쟁이: 매일 밤 두 명을 골라 그중에 악마가 있는지 배운다. 레드 헤링은 항상 '있음'으로 등록.

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canRegisterDemon } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "fortuneteller" }>;

export function fortuneteller(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const v = view(ctx, night);
  const isForcedYes = (t: Seat) => ROLES[v.tokenRole(t)].team === "demon" || t === ctx.redHerring;
  if (data.yes) {
    return data.targets.some((t) => canRegisterDemon(v, t) || t === ctx.redHerring);
  }
  return !data.targets.some(isForcedYes);
}
