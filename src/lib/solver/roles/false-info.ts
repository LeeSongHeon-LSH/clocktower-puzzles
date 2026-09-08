// Vortox 세계의 정보 검증: "정직한 텔러가 이 정보를 **거짓**으로 줄 수 있는 등록 선택이
// 존재하는가" (∃-의미론을 뒤집은 쌍둥이). 구조 조건(대상 생존, 자기 제외, 역할 팀 등)은
// 참-검증과 똑같이 성립해야 한다 — Vortox도 그럴듯한 형태의 정보만 보여준다.
//
// 행동 기록(수도사·구마사제·도박사)은 정보가 아니므로 참-검증(구조 확인)을 그대로 쓴다.
// 수 정보(초공감자·예언자·수학자·객실 청소부·곡예사)는 역할 모듈이 내보내는 [min, max] 범위를
// 그대로 소비한다 — 참 판정이 "범위 안", 거짓 판정이 "범위 밖의 값이 존재"라 두 판정이 서로의 부정이다.

import { ROLES } from "@/data/roles";
import { Ctx, view } from "../ctx";
import { canShowAsOtherThan, canShowAsRole, isGoodTeam } from "../registration";
import type { InfoData, Seat } from "../types";
import { chefPairCounts } from "./chef";
import { empathRange } from "./empath";
import { oracleRange } from "./oracle";
import { mathematicianRange } from "./mathematician";
import { chambermaidRange } from "./chambermaid";
import { clockmakerSteps } from "./clockmaker";
import { fortuneteller } from "./fortuneteller";
import { seamstress } from "./seamstress";
import { monk } from "./monk";
import { exorcist } from "./exorcist";
import { gambler } from "./gambler";
import { flowergirl } from "./flowergirl";
import { towncrier } from "./towncrier";
import { courtier, innkeeper, philosopher, professor, sailor, snakecharmer } from "./drunk-sources";
import { artistFalse, savantFalse } from "./props";

/**
 * [min, max] 범위의 값 중 claimed와 다른 값이 존재하는가 (범위는 항상 비어 있지 않다).
 * 범위는 참 판정을 내는 역할 모듈이 만든다 — 같은 범위를 소비하므로 두 판정은 정확히 서로의 부정이다.
 */
function rangeCanDiffer([min, max]: [number, number], claimed: number): boolean {
  return min < max || min !== claimed;
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
    case "chef":
      // 참-검증과 같은 오등록 조합 전수 — 쌍 수가 claimed와 달라지는 조합이 있는가
      return [...chefPairCounts(ctx, night)].some((pairs) => pairs !== data.count);
    case "empath":
      return rangeCanDiffer(empathRange(ctx, seat, night), data.count);
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
      return rangeCanDiffer([min, max], data.correct);
    }
    case "mathematician":
      return rangeCanDiffer(mathematicianRange(ctx, night), data.count);
    case "chambermaid": {
      const range = chambermaidRange(ctx, seat, data, night);
      return range !== null && rangeCanDiffer(range, data.count);
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
    case "oracle":
      return rangeCanDiffer(oracleRange(ctx, night), data.count);
    case "grandmother": {
      const team = ROLES[data.shownRole].team;
      if (team !== "townsfolk" && team !== "outsider") return false;
      if (data.target === seat) return false;
      // 손주는 ∃-변수(타임라인이 Vortox 세계에서 미확정으로 둔다) — 다른 손주 후보가
      // 있으면 지목 자체가 거짓일 수 있고, 아니면 역할 등록이 달라야 한다.
      const isCandidate = (s: Seat) => isGoodTeam(ctx.assignment[s]) || ctx.assignment[s] === "spy";
      for (let s = 0; s < ctx.pz.playerCount; s++) {
        if (s !== data.target && s !== seat && isCandidate(s)) return true;
      }
      return canShowAsOtherThan(v, data.target, [data.shownRole]);
    }
    case "sage":
      if (data.targets[0] === data.targets[1]) return false;
      return !data.targets.includes(ctx.sc.demonDuringNight[night]);
    // "예"가 거짓 = "아니오"가 참 (기록된 투표자/지명자 제약), "아니오"가 거짓 = 미기록 ∃ — 항상 성립
    case "flowergirl":
      return data.yes ? flowergirl(ctx, seat, { type: "flowergirl", yes: false }, night) : true;
    case "towncrier":
      return data.yes ? towncrier(ctx, seat, { type: "towncrier", yes: false }, night) : true;
    // 행동 기록 — 정보가 아니므로 Vortox 세계에서도 구조 검증 그대로
    case "monk":
      return monk(ctx, seat, data, night);
    case "exorcist":
      return exorcist(ctx, seat, data, night);
    case "gambler":
      return gambler(ctx, seat, data, night);
    case "sailor":
      return sailor(ctx, seat, data, night);
    case "innkeeper":
      return innkeeper(ctx, seat, data, night);
    case "courtier":
      return courtier(ctx, seat, data, night);
    case "professor":
      return professor(ctx, seat, data, night);
    case "snakecharmer":
      return snakecharmer(ctx, seat, data, night);
    case "philosopher":
      return philosopher(ctx, seat, data, night);
    // 낮 정보 — Vortox 세계에서 화가의 답은 거짓, 학자의 두 진술은 둘 다 거짓 (공식 룰링)
    case "artist":
      return artistFalse(ctx, seat, data, night);
    case "savant":
      return savantFalse(ctx, seat, data, night);
  }
}
