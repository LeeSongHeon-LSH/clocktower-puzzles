// 수학자: 매일 밤, 그날 밤 능력이 비정상 동작한 플레이어 수를 배운다.
//
// 단순화 모델(문서화된 의도적 근사): "그 밤에 깨어난 플레이어 중 주정뱅이거나 중독된 수".
// 노 다시의 이웃 독은 '있었을 수 있음'만 알므로 (간격 추상화) min/max 범위로 센다.
// 정확한 독살 벡터가 필요하므로 solve의 전수 열거 경로에서만 호출된다 (ctx.poison 필수).

import { Ctx, isDrunk, isNdPoisoned, isPoisoned, isSweetDrunk, wakes } from "../ctx";
import type { InfoData, Seat } from "../types";

type Data = Extract<InfoData, { type: "mathematician" }>;

export function mathematician(ctx: Ctx, _seat: Seat, data: Data, night: number): boolean {
  if (ctx.poison === null) {
    throw new Error("수학자 검증에는 독살 벡터가 필요합니다 (solve의 열거 경로 사용)");
  }
  let min = 0;
  let max = 0;
  for (let s = 0; s < ctx.pz.playerCount; s++) {
    if (!wakes(ctx, s, night)) continue;
    if (isDrunk(ctx, s) || isPoisoned(ctx, s, night) || isSweetDrunk(ctx, s, night)) { min++; max++; }
    else if (isNdPoisoned(ctx, s, night)) max++;
  }
  return data.count >= min && data.count <= max;
}
