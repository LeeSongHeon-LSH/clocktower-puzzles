// 오등록(misregistration) 처리.
// 은둔자: 악한 진영·하수인·데몬(및 그 역할)으로 등록될 수 있다 (죽어서도).
// 스파이: 선한 진영·마을 사람·외부인(및 그 역할)으로 등록될 수 있다.
// 모든 정보 검증은 ∃-의미론: "정직한 텔러가 그 정보를 줄 수 있는 등록 선택이 존재하는가".

import { ROLES } from "@/data/roles";
import type { RoleId, Seat, Team } from "./types";

export interface TokenView {
  /** 좌석의 현재 토큰 역할 (데몬 승계 반영: 승계한 하수인의 토큰은 imp) */
  tokenRole(seat: Seat): RoleId;
  rolePool: RoleId[];
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
  return false;
}

/** 이 좌석이 악한 진영으로 등록될 수 '있는가' */
export function canRegisterEvil(view: TokenView, seat: Seat): boolean {
  const actual = view.tokenRole(seat);
  return isEvilRole(actual) || actual === "recluse";
}

/** 이 좌석이 악한 진영으로 등록될 수밖에 '없는가' (선 등록 불가) */
export function mustRegisterEvil(view: TokenView, seat: Seat): boolean {
  const actual = view.tokenRole(seat);
  return isEvilRole(actual) && actual !== "spy";
}

/** 이 좌석이 데몬으로 등록될 수 있는가 (점쟁이용) */
export function canRegisterDemon(view: TokenView, seat: Seat): boolean {
  const actual = view.tokenRole(seat);
  return teamOf(actual) === "demon" || actual === "recluse";
}
