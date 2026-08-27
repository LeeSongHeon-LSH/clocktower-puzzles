// 꿈꾸는 자: 매일 밤 한 명을 골라 선한 역할 1개·악한 역할 1개를 배우는데,
// 그중 하나가 대상의 실제(등록) 역할이다. 두 역할 모두 대본에서 나온다.

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canShowAsRole } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "dreamer" }>;

export function dreamer(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  const gTeam = ROLES[data.goodRole].team;
  const eTeam = ROLES[data.evilRole].team;
  if (gTeam !== "townsfolk" && gTeam !== "outsider") return false;
  if (eTeam !== "minion" && eTeam !== "demon") return false;
  if (data.target === seat) return false;
  if (!ctx.sched.aliveAtNightStart(night)[data.target]) return false;
  if (!ctx.pz.rolePool.includes(data.goodRole) || !ctx.pz.rolePool.includes(data.evilRole)) return false;
  const v = view(ctx, night);
  return canShowAsRole(v, data.target, data.goodRole) || canShowAsRole(v, data.target, data.evilRole);
}
