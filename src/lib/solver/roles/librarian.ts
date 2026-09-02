// 사서: 밤1, 두 명 중 하나가 특정 외지인 역할임을 배운다 (또는 "외지인 없음").

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canRegisterNonOutsider, canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "librarian" }>;

export function librarian(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const v = view(ctx, night);
  if (data.targets === null) {
    // "외지인 없음"은 **아무도 외지인으로 등록되지 않는 선택이 있을 때만** 참이다.
    // 은둔자는 악한 역할로, 첩자는 하수인 그대로 남아 숨을 수 있지만, 집사·성자·주정뱅이처럼
    // 오등록이 없는 외지인이 판에 있으면 사서는 그 사람을 보았어야 한다.
    return ctx.assignment.every((_, s) => canRegisterNonOutsider(v, s));
  }
  if (ROLES[data.shownRole].team !== "outsider") return false;
  return data.targets.some((t) => canShowAsRole(v, t, data.shownRole));
}
