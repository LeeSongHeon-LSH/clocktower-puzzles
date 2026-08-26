// 사서: 밤1, 두 명 중 하나가 특정 외지인 역할임을 배운다 (또는 "외지인 없음").

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "librarian" }>;

export function librarian(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  if (data.targets === null) {
    // "외지인 없음": 주정뱅이는 숨길 수 없고, 은둔자는 하수인으로 오등록될 수 있다
    return !ctx.assignment.includes("drunk");
  }
  if (ROLES[data.shownRole].team !== "outsider") return false;
  const v = view(ctx, night);
  return data.targets.some((t) => canShowAsRole(v, t, data.shownRole));
}
