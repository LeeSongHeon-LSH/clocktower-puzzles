// 인원수별 팀 구성 (마을 사람 / 외부인 / 하수인 / 데몬). 남작이 있으면 외부인 +2, 마을 사람 -2.

import type { RoleId } from "@/lib/solver/types";

export interface Composition {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
}

const BASE: Record<number, Composition> = {
  5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
};

export function composition(playerCount: number, hasBaron: boolean): Composition {
  const base = BASE[playerCount];
  if (!base) throw new Error(`지원하지 않는 인원수: ${playerCount}`);
  if (!hasBaron) return base;
  return {
    ...base,
    townsfolk: base.townsfolk - 2,
    outsider: base.outsider + 2,
  };
}

/**
 * 외부인 수를 바꾸는 역할과 그 효과 문구 (UI 표기 전용).
 * solve()가 열거하는 delta와 같은 내용을 풀이자에게 보여주기 위한 것이다 —
 * 여기에 역할을 추가할 때는 solve()의 delta 열거도 함께 확인할 것.
 */
export const OUTSIDER_MODIFIERS: Partial<Record<RoleId, string>> = {
  baron: "외지인 +2 (마을 주민 −2)",
  godfather: "외지인 +1 또는 −1",
  fanggu: "외지인 +1 (마을 주민 −1)",
  vigormortis: "외지인 −1 (마을 주민 +1)",
};
