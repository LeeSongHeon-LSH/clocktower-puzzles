// 수사관: 밤1, 두 명 중 하나가 특정 하수인 역할임을 배운다.

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "investigator" }>;

export function investigator(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  if (data.targets !== null && (data.targets.includes(seat) || data.targets[0] === data.targets[1])) return false; // 자기 자신은 지목 대상이 아니고, 두 좌석은 서로 다르다
  if (ROLES[data.shownRole].team !== "minion") return false;
  const v = view(ctx, night);
  return data.targets.some((t) => canShowAsRole(v, t, data.shownRole));
}
