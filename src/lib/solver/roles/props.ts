// 구조화 명제 평가 + 낮 정보 역할(화가·학자) 체커.
//
// 명제는 등록(오등록 ∃) 기반으로 "참으로 등록될 수 있는가 / 거짓으로 등록될 수 있는가"를
// 판정한다. 은둔자는 악·데몬으로, 첩자는 선한 역할로 오등록될 수 있고, 등록 선택은 관측
// 시점마다 텔러 몫이다 (∃ — 두 명제가 같은 좌석을 다르게 등록해도 된다, 관대한 방향).
//
// 시간 기준: 낮 정보(night n = 낮 n)는 승계 반영을 위해 토큰 시각 n + 0.5를 쓴다.

import { ROLES } from "@/data/roles";
import { Ctx } from "../ctx";
import { tokenRoleAt } from "../timeline";
import { canRegisterDemon, canRegisterEvil, canShowAsOtherThan, canShowAsRole, mustRegisterEvil } from "../registration";
import type { InfoData, Prop, RoleId, Seat } from "../types";
import type { TokenView } from "../registration";

function dayView(ctx: Ctx, day: number): TokenView {
  return {
    tokenRole: (s: Seat) => tokenRoleAt(ctx.assignment, ctx.sc, s, day + 0.5),
    rolePool: ctx.pz.rolePool,
  };
}

/** 명제가 참으로 등록될 수 있는가 */
export function propCanBeTrue(ctx: Ctx, day: number, p: Prop): boolean {
  const v = dayView(ctx, day);
  switch (p.kind) {
    case "isDemon":
      return canRegisterDemon(v, p.seat);
    case "isEvil":
      return canRegisterEvil(v, p.seat);
    case "isRole":
      return canShowAsRole(v, p.seat, p.role);
    case "roleInPlay":
      return Array.from({ length: ctx.pz.playerCount }, (_, s) => s).some((s) => canShowAsRole(v, s, p.role));
  }
}

/** 명제가 거짓으로 등록될 수 있는가 */
export function propCanBeFalse(ctx: Ctx, day: number, p: Prop): boolean {
  const v = dayView(ctx, day);
  switch (p.kind) {
    case "isDemon": {
      // 데몬 토큰은 반드시 데몬으로 등록된다 — 은둔자만 양쪽 다 가능
      const tok = v.tokenRole(p.seat);
      return ROLES[tok].team !== "demon";
    }
    case "isEvil":
      return !mustRegisterEvil(v, p.seat);
    case "isRole":
      return canShowAsOtherThan(v, p.seat, [p.role]);
    case "roleInPlay":
      return Array.from({ length: ctx.pz.playerCount }, (_, s) => s).every((s) => canShowAsOtherThan(v, s, [p.role]));
  }
}

type ArtistData = Extract<InfoData, { type: "artist" }>;
type SavantData = Extract<InfoData, { type: "savant" }>;

/** 명제의 역할 참조가 대본 안에 있는가 (구조 검증) */
function propWellFormed(ctx: Ctx, p: Prop): boolean {
  const role: RoleId | null = p.kind === "isRole" || p.kind === "roleInPlay" ? p.role : null;
  return role === null || ctx.pz.rolePool.includes(role);
}

/** 화가: 멀쩡하면 답이 진실이다 (등록 ∃) */
export function artist(ctx: Ctx, _seat: Seat, data: ArtistData, day: number): boolean {
  if (!propWellFormed(ctx, data.question)) return false;
  return data.yes ? propCanBeTrue(ctx, day, data.question) : propCanBeFalse(ctx, day, data.question);
}

/** 화가 (Vortox 세계): 답이 거짓이어야 한다 */
export function artistFalse(ctx: Ctx, _seat: Seat, data: ArtistData, day: number): boolean {
  if (!propWellFormed(ctx, data.question)) return false;
  return data.yes ? propCanBeFalse(ctx, day, data.question) : propCanBeTrue(ctx, day, data.question);
}

/** 학자: 멀쩡하면 둘 중 정확히 하나만 참이다 */
export function savant(ctx: Ctx, _seat: Seat, data: SavantData, day: number): boolean {
  const [a, b] = data.statements;
  if (!propWellFormed(ctx, a) || !propWellFormed(ctx, b)) return false;
  return (
    (propCanBeTrue(ctx, day, a) && propCanBeFalse(ctx, day, b)) ||
    (propCanBeFalse(ctx, day, a) && propCanBeTrue(ctx, day, b))
  );
}

/** 학자 (Vortox 세계): 둘 다 거짓이어야 한다 (공식 룰링) */
export function savantFalse(ctx: Ctx, _seat: Seat, data: SavantData, day: number): boolean {
  const [a, b] = data.statements;
  if (!propWellFormed(ctx, a) || !propWellFormed(ctx, b)) return false;
  return propCanBeFalse(ctx, day, a) && propCanBeFalse(ctx, day, b);
}
