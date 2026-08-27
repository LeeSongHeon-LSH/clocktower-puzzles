// Vortox 세계의 정보 검증: "정직한 텔러가 이 정보를 **거짓**으로 줄 수 있는 등록 선택이
// 존재하는가" (∃-의미론을 뒤집은 쌍둥이). 구조 조건(대상 생존, 자기 제외, 역할 팀 등)은
// 참-검증과 똑같이 성립해야 한다 — Vortox도 그럴듯한 형태의 정보만 보여준다.
//
// 행동 기록(수도사·구마사제·도박사)은 정보가 아니므로 참-검증(구조 확인)을 그대로 쓴다.
// 오등록이 없는 결정적 정보(시계공·객실 청소부·수학자)는 "값이 실제와 다르다"가 거짓 조건이다.

import { ROLES } from "@/data/roles";
import { aliveNeighbors, Ctx, isDrunk, isPoisoned, isSweetDrunk, view, wakes } from "../ctx";
import { canRegisterEvil, canShowAsOtherThan, canShowAsRole, mustRegisterEvil } from "../registration";
import type { InfoData, Seat } from "../types";
import { clockmakerSteps } from "./clockmaker";
import { fortuneteller } from "./fortuneteller";
import { seamstress } from "./seamstress";
import { monk } from "./monk";
import { exorcist } from "./exorcist";
import { gambler } from "./gambler";

/** [min, max] 범위의 등록 가능 값 중 claimed와 다른 값이 존재하는가 (범위는 항상 비어 있지 않다) */
function rangeCanDiffer(min: number, max: number, claimed: number): boolean {
  return min < max || min !== claimed;
}

/** 초공감자/예언자 계열: 대상들의 악 등록 min/max */
function evilRange(ctx: Ctx, night: number, targets: Seat[]): [number, number] {
  const v = view(ctx, night);
  let min = 0;
  let max = 0;
  for (const t of targets) {
    if (mustRegisterEvil(v, t)) { min++; max++; }
    else if (canRegisterEvil(v, t)) max++;
  }
  return [min, max];
}

export function checkContentFalse(ctx: Ctx, seat: Seat, data: InfoData, night: number): boolean {
  const v = view(ctx, night);
  switch (data.type) {
    case "washerwoman":
      if (ROLES[data.shownRole].team !== "townsfolk") return false;
      return data.targets.every((t) => canShowAsOtherThan(v, t, [data.shownRole]));
    case "librarian":
      if (data.targets === null) {
        // "외지인 없음"이 거짓일 수 있으려면 외지인으로 등록될 수 있는 누군가가 있어야 한다
        return ctx.assignment.some((r) => ROLES[r].team === "outsider") || ctx.assignment.includes("spy");
      }
      if (ROLES[data.shownRole].team !== "outsider") return false;
      return data.targets.every((t) => canShowAsOtherThan(v, t, [data.shownRole]));
    case "investigator":
      if (ROLES[data.shownRole].team !== "minion") return false;
      return data.targets.every((t) => canShowAsOtherThan(v, t, [data.shownRole]));
    case "chef": {
      // 참-검증과 같은 오등록 조합 전수 — 쌍 수가 claimed와 달라지는 조합이 있는가
      const n = ctx.pz.playerCount;
      const flex: Seat[] = [];
      const baseEvil: boolean[] = [];
      for (let s = 0; s < n; s++) {
        const must = mustRegisterEvil(v, s);
        baseEvil[s] = must;
        if (canRegisterEvil(v, s) && !must) flex.push(s);
      }
      for (let mask = 0; mask < 1 << flex.length; mask++) {
        const evil = [...baseEvil];
        flex.forEach((s, i) => { evil[s] = (mask & (1 << i)) !== 0; });
        let pairs = 0;
        for (let s = 0; s < n; s++) {
          if (evil[s] && evil[(s + 1) % n]) pairs++;
        }
        if (pairs !== data.count) return true;
      }
      return false;
    }
    case "empath": {
      const neighbors = aliveNeighbors(ctx.sched.aliveAfterNight(night), seat);
      if (neighbors === null) return data.count !== 0;
      const uniq = neighbors[0] === neighbors[1] ? [neighbors[0]] : [...neighbors];
      const [min, max] = evilRange(ctx, night, uniq);
      return rangeCanDiffer(min, max, data.count);
    }
    case "fortuneteller":
      // 거짓 답 = 반대 답이 참일 수 있는가 — 참-검증을 yes만 뒤집어 재사용
      return fortuneteller(ctx, seat, { ...data, yes: !data.yes }, night);
    case "undertaker": {
      const executed = ctx.sched.executedOnDay(night - 1);
      if (executed === null) return false;
      return canShowAsOtherThan(view(ctx, night - 1), executed, [data.shownRole]);
    }
    case "ravenkeeper":
      return canShowAsOtherThan(v, data.target, [data.shownRole]);
    case "clockmaker": {
      const best = clockmakerSteps(ctx);
      return best !== null && data.steps !== best;
    }
    case "seamstress":
      if (data.targets.includes(seat)) return false;
      return seamstress(ctx, seat, { ...data, sameTeam: !data.sameTeam }, night);
    case "juggler": {
      let min = 0;
      let max = 0;
      for (const g of data.guesses) {
        const token = v.tokenRole(g.seat);
        const flexible = token === "recluse" || token === "spy";
        if (canShowAsRole(v, g.seat, g.role)) max++;
        if (token === g.role && !flexible) min++;
      }
      return rangeCanDiffer(min, max, data.correct);
    }
    case "mathematician": {
      if (ctx.poison === null) {
        throw new Error("수학자 검증에는 독살 벡터가 필요합니다 (solve의 열거 경로 사용)");
      }
      let count = 0;
      for (let s = 0; s < ctx.pz.playerCount; s++) {
        if (wakes(ctx, s, night) && (isDrunk(ctx, s) || isPoisoned(ctx, s, night) || isSweetDrunk(ctx, s, night))) count++;
      }
      return data.count !== count;
    }
    case "chambermaid": {
      if (data.targets.includes(seat)) return false;
      const alive = ctx.sched.aliveAfterNight(night);
      if (!data.targets.every((t) => alive[t])) return false;
      const count = data.targets.filter((t) => wakes(ctx, t, night)).length;
      return data.count !== count;
    }
    case "dreamer": {
      const gTeam = ROLES[data.goodRole].team;
      const eTeam = ROLES[data.evilRole].team;
      if (gTeam !== "townsfolk" && gTeam !== "outsider") return false;
      if (eTeam !== "minion" && eTeam !== "demon") return false;
      if (data.target === seat) return false;
      if (!ctx.sched.aliveAtNightStart(night)[data.target]) return false;
      if (!ctx.pz.rolePool.includes(data.goodRole) || !ctx.pz.rolePool.includes(data.evilRole)) return false;
      return canShowAsOtherThan(v, data.target, [data.goodRole, data.evilRole]);
    }
    case "oracle": {
      const alive = ctx.sched.aliveAfterNight(night);
      const dead: Seat[] = [];
      for (let s = 0; s < alive.length; s++) if (!alive[s]) dead.push(s);
      const [min, max] = evilRange(ctx, night, dead);
      return rangeCanDiffer(min, max, data.count);
    }
    case "grandmother": {
      const team = ROLES[data.shownRole].team;
      if (team !== "townsfolk" && team !== "outsider") return false;
      if (data.target === seat) return false;
      // 손주는 ∃-변수(타임라인이 Vortox 세계에서 미확정으로 둔다) — 다른 손주 후보가
      // 있으면 지목 자체가 거짓일 수 있고, 아니면 역할 등록이 달라야 한다.
      const isCandidate = (s: Seat) => {
        const t = ROLES[ctx.assignment[s]].team;
        return t === "townsfolk" || t === "outsider" || ctx.assignment[s] === "spy";
      };
      for (let s = 0; s < ctx.pz.playerCount; s++) {
        if (s !== data.target && s !== seat && isCandidate(s)) return true;
      }
      return canShowAsOtherThan(v, data.target, [data.shownRole]);
    }
    case "sage":
      if (data.targets[0] === data.targets[1]) return false;
      return !data.targets.includes(ctx.sc.demonDuringNight[night]);
    // 행동 기록 — 정보가 아니므로 Vortox 세계에서도 구조 검증 그대로
    case "monk":
      return monk(ctx, seat, data, night);
    case "exorcist":
      return exorcist(ctx, seat, data, night);
    case "gambler":
      return gambler(ctx, seat, data, night);
  }
}
