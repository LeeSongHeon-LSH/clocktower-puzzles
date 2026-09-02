// 오등록(misregistration) 처리.
// 은둔자: 악한 진영·하수인·데몬(및 그 역할)으로 등록될 수 있다 (죽어서도).
// 스파이: 선한 진영·마을 사람·외부인(및 그 역할)으로 등록될 수 있다.
// 모든 정보 검증은 ∃-의미론: "정직한 텔러가 그 정보를 줄 수 있는 등록 선택이 존재하는가".

import { ROLES } from "@/data/roles";
import type { RoleId, Seat, Team } from "./types";
import { PHILOSOPHER_GAINABLE } from "./types";

export interface TokenView {
  /** 좌석의 현재 토큰 역할 (데몬 승계 반영: 승계한 하수인의 토큰은 imp) */
  tokenRole(seat: Seat): RoleId;
  rolePool: RoleId[];
  /**
   * 마귀할멈이 자기 자신을 바꿨을 수 있는 역할들 (24차 D8). 자기 변신은 주장으로
   * 드러나지 않으므로 첩자의 오등록과 같은 ∃로 흡수한다 — 마귀할멈 토큰은 이 중
   * 어떤 역할로도 보일 수 있다. 진영은 바뀌지 않으므로 진영 판정에는 쓰지 않는다.
   */
  pithagSelfOptions?: RoleId[];
  /**
   * 건달의 그 시점 진영 (25차). 건달은 자기를 고른 첫 사람의 진영이 되므로 진영이
   * 밤별 상태다. "either" = 그 밤 도중에 바뀌어 양쪽 다 가능 (관대). 없으면 선.
   */
  goonAlign?: "good" | "evil" | "either";
}

/**
 * 마귀할멈의 자기 변신 후보 (24차 D8): 시각 time(밤 n = n, 낮 d = d + 0.5)에
 * **판에 없는** 획득 가능 역할들. 밤 2부터 변신할 수 있으므로 그 전에는 비어 있다.
 */
export function pithagSelfOptionsAt(
  tokenRole: (seat: Seat) => RoleId,
  playerCount: number,
  rolePool: RoleId[],
  time: number,
): RoleId[] {
  if (time < 2) return [];
  const inPlay = new Set<RoleId>();
  let hasPithag = false;
  for (let s = 0; s < playerCount; s++) {
    const t = tokenRole(s);
    inPlay.add(t);
    if (t === "pithag") hasPithag = true;
  }
  if (!hasPithag) return [];
  return rolePool.filter((r) => PHILOSOPHER_GAINABLE.includes(r) && !inPlay.has(r));
}

function teamOf(role: RoleId): Team {
  return ROLES[role].team;
}

export function isEvilRole(role: RoleId): boolean {
  const t = teamOf(role);
  return t === "minion" || t === "demon";
}

/** 이 좌석이 역할 R로 등록될 수 있는가 (shown-role 계열 정보용) */
export function canShowAsRole(view: TokenView, seat: Seat, shown: RoleId): boolean {
  const actual = view.tokenRole(seat);
  if (actual === shown) return true;
  if (actual === "recluse" && isEvilRole(shown) && view.rolePool.includes(shown)) return true;
  if (actual === "spy" && !isEvilRole(shown) && view.rolePool.includes(shown)) return true;
  // 마귀할멈이 자기를 그 역할로 바꿨을 수 있다 (∃ — 주장으로 드러나지 않는 변신)
  if (actual === "pithag" && (view.pithagSelfOptions?.includes(shown) ?? false)) return true;
  return false;
}

/**
 * 이 좌석이 주어진 역할들 중 무엇도 아닌 것으로 등록될 수 있는가 (Vortox 거짓 정보용).
 * 은둔자·첩자는 자기 자신으로도 등록될 수 있으므로 선택지가 하나라도 excluded 밖이면 참.
 */
export function canShowAsOtherThan(view: TokenView, seat: Seat, excluded: RoleId[]): boolean {
  const actual = view.tokenRole(seat);
  const options: RoleId[] = [actual];
  if (actual === "recluse") options.push(...view.rolePool.filter(isEvilRole));
  if (actual === "spy") options.push(...view.rolePool.filter((r) => !isEvilRole(r)));
  if (actual === "pithag") options.push(...(view.pithagSelfOptions ?? []));
  return options.some((r) => !excluded.includes(r));
}

/** 이 좌석이 악한 진영으로 등록될 수 '있는가' */
export function canRegisterEvil(view: TokenView, seat: Seat): boolean {
  const actual = view.tokenRole(seat);
  // 건달의 진영은 밤별 상태다 (역할이 아니라 진영이 바뀐다)
  if (actual === "goon") return (view.goonAlign ?? "good") !== "good";
  return isEvilRole(actual) || actual === "recluse";
}

/** 이 좌석이 악한 진영으로 등록될 수밖에 '없는가' (선 등록 불가) */
export function mustRegisterEvil(view: TokenView, seat: Seat): boolean {
  const actual = view.tokenRole(seat);
  if (actual === "goon") return (view.goonAlign ?? "good") === "evil";
  return isEvilRole(actual) && actual !== "spy";
}

/** 이 좌석이 데몬으로 등록될 수 있는가 (점쟁이용) */
export function canRegisterDemon(view: TokenView, seat: Seat): boolean {
  const actual = view.tokenRole(seat);
  return teamOf(actual) === "demon" || actual === "recluse";
}
