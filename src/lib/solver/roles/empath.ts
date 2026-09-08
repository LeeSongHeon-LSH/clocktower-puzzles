// 초공감자: 매일 밤, 생존한 양옆 이웃 중 악인 수를 배운다 (죽은 좌석은 건너뛴다).

import { aliveNeighbors, Ctx, view } from "../ctx";
import { evilRange } from "../registration";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "empath" }>;

/** 초공감자가 볼 수 있는 값의 [min, max]. 생존한 타인이 없으면 [0, 0] */
export function empathRange(ctx: Ctx, seat: Seat, night: number): [number, number] {
  const neighbors = aliveNeighbors(ctx.sched.aliveAfterNight(night), seat);
  if (neighbors === null) return [0, 0];
  const uniq = neighbors[0] === neighbors[1] ? [neighbors[0]] : [...neighbors];
  return evilRange(view(ctx, night), uniq);
}

export function empath(ctx: Ctx, seat: Seat, data: Data, night: number): boolean {
  const [min, max] = empathRange(ctx, seat, night);
  return data.count >= min && data.count <= max;
}
