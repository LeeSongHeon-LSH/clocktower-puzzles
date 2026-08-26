// 재봉사: 게임 중 1회, 밤에 두 명을 골라 같은 진영인지 배운다.

import { Ctx, view } from "../ctx";
import { canRegisterEvil, mustRegisterEvil } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "seamstress" }>;

export function seamstress(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  if (data.targets.includes(seat)) return false; // 자신은 고를 수 없다
  const v = view(ctx, night);
  // 각 대상의 가능한 진영 집합
  const align = (t: Seat): { good: boolean; evil: boolean } => {
    if (mustRegisterEvil(v, t)) return { good: false, evil: true };
    if (canRegisterEvil(v, t)) return { good: true, evil: true }; // 은둔자·첩자
    return { good: true, evil: false };
  };
  const a = align(data.targets[0]);
  const b = align(data.targets[1]);
  if (data.sameTeam) return (a.good && b.good) || (a.evil && b.evil);
  return (a.good && b.evil) || (a.evil && b.good);
}
