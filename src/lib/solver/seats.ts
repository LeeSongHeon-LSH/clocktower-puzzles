// 원형 좌석 유틸 — 의존이 없는 말단 모듈. ctx.ts와 timeline.ts가 함께 쓴다
// (timeline이 ctx를 import하면 순환이 생기므로 여기로 뺐다).

import type { Seat } from "./types";

export function circularDistance(n: number, a: Seat, b: Seat): number {
  const d = Math.abs(a - b) % n;
  return Math.min(d, n - d);
}

/**
 * 원형 좌석에서 자신을 제외한 가장 가까운 생존 이웃 [왼쪽, 오른쪽].
 * 생존한 타인이 없으면 null. (둘이 같은 좌석일 수 있음 — 생존 타인이 1명일 때)
 */
export function aliveNeighbors(alive: boolean[], seat: Seat): [Seat, Seat] | null {
  const n = alive.length;
  let left: Seat | null = null;
  let right: Seat | null = null;
  for (let step = 1; step < n; step++) {
    const l = (seat - step + n) % n;
    if (alive[l]) { left = l; break; }
  }
  for (let step = 1; step < n; step++) {
    const r = (seat + step) % n;
    if (alive[r]) { right = r; break; }
  }
  if (left === null || right === null) return null;
  return [left, right];
}
