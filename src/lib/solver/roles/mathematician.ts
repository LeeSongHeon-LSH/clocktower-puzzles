// 수학자: 매일 밤, 그날 밤 능력이 비정상 동작한 플레이어 수를 배운다.
//
// 단순화 모델(문서화된 의도적 근사): "그 밤에 깨어난 플레이어 중 주정뱅이거나 중독된 수".
// 확실한 비정상(주정뱅이·독살·스위트하트·이동식 취함)은 min·max 모두에 들고, 관대 집합
// (노 다시·푸카·비고르모르티스의 '받았을 수 있는' 독)은 max에만 든다.
// 정확한 독살 벡터가 필요하므로 solve의 전수 열거 경로에서만 호출된다 (ctx.poison 필수).

import {
  Ctx, isDrunk, isExtraDrunk, isNdPoisoned, isPoisoned, isPukkaPoisoned, isSweetDrunk, isVigorPoisoned, wakes,
} from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "mathematician" }>;

/** 수학자가 볼 수 있는 값의 [min, max] (참 판정·거짓 판정 공용) */
export function mathematicianRange(ctx: Ctx, night: number): [number, number] {
  if (ctx.poison === null) {
    throw new Error("수학자 검증에는 독살 벡터가 필요합니다 (solve의 열거 경로 사용)");
  }
  let min = 0;
  let max = 0;
  for (let s = 0; s < ctx.pz.playerCount; s++) {
    if (!wakes(ctx, s, night)) continue;
    if (isDrunk(ctx, s) || isPoisoned(ctx, s, night) || isSweetDrunk(ctx, s, night)
      || isExtraDrunk(ctx, s, night)) { min++; max++; } // 이동식 취함·건달로 취한 좌석도 비정상이다
    else if (isNdPoisoned(ctx, s, night) || isPukkaPoisoned(ctx, s, night) || isVigorPoisoned(ctx, s, night)) max++;
  }
  // 건달을 고른 '기록 없는 선택자'는 확실히 취했지만 누구인지 모른다 — 한 명분을 열어 둔다
  if (ctx.sc.goonUnknownDrunk?.[night]) max++;
  return [min, max];
}

export function mathematician(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  const [min, max] = mathematicianRange(ctx, night);
  return data.count >= min && data.count <= max;
}
