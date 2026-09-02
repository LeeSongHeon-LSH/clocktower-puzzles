// InfoData → 한국어 문장 자동 생성. 역할명은 항상 roles.ts 사전을 거친다.
// ClaimInfo.text가 있으면 그것을 우선하고, 없으면 renderInfo(data)를 쓴다.

import { roleLabel } from "@/data/roles";
import { seatName } from "@/lib/puzzles/schema";
import type { InfoData, Prop, RoleId, Seat } from "@/lib/solver/types";

function pair(a: Seat, b: Seat): string {
  return `${seatName(a)}·${seatName(b)}`;
}

/** 구조화 명제 → 한국어 문장 (화가 질문·학자 진술) */
export function renderProp(p: Prop): string {
  switch (p.kind) {
    case "isDemon":
      return `${seatName(p.seat)}는 악마다`;
    case "isEvil":
      return `${seatName(p.seat)}는 악하다`;
    case "isRole":
      return `${seatName(p.seat)}는 ${roleLabel(p.role)}다`;
    case "roleInPlay":
      return `${roleLabel(p.role)}이(가) 판에 있다`;
  }
}

/** 주장 정보 한 건의 표시 문장 — 교환 이력(asRole)이 있으면 당시 역할을 앞에 밝힌다 */
export function renderClaimInfo(inf: { data?: InfoData; text?: string; asRole?: RoleId }): string {
  const body = inf.text ?? (inf.data ? renderInfo(inf.data) : "");
  return inf.asRole !== undefined ? `(당시 ${roleLabel(inf.asRole)}로서) ${body}` : body;
}

/** 마귀할멈 변신 이력의 표시 문장 — "밤 n부터 (그전엔 X)" */
export function renderRoleChange(rc: { night: number; from: RoleId }): string {
  return `밤 ${rc.night}부터 — 그전엔 ${roleLabel(rc.from)}`;
}

export function renderInfo(data: InfoData): string {
  switch (data.type) {
    case "washerwoman":
      return `${pair(...data.targets)} 중 한 명은 ${roleLabel(data.shownRole)}다`;
    case "librarian":
      if (data.targets === null) return "외지인이 없다";
      return `${pair(...data.targets)} 중 한 명은 ${roleLabel(data.shownRole)}다`;
    case "investigator":
      return `${pair(...data.targets)} 중 한 명은 ${roleLabel(data.shownRole)}다`;
    case "chef":
      return `인접해 앉은 악인 쌍: ${data.count}쌍`;
    case "empath":
      return `살아 있는 양옆 이웃 중 악인: ${data.count}명`;
    case "fortuneteller":
      return `${pair(...data.targets)} 중 악마가 ${data.yes ? "있다" : "없다"}`;
    case "undertaker":
      return `지난 낮 처형된 이의 역할: ${roleLabel(data.shownRole)}`;
    case "ravenkeeper":
      return `죽는 순간 ${seatName(data.target)}를 지목해 확인한 역할: ${roleLabel(data.shownRole)}`;
    case "clockmaker":
      return `악마와 가장 가까운 하수인 사이 거리: ${data.steps}칸`;
    case "seamstress":
      return `${pair(...data.targets)}는 ${data.sameTeam ? "같은 팀이다" : "서로 다른 팀이다"}`;
    case "juggler": {
      const guesses = data.guesses
        .map((g) => `${seatName(g.seat)}=${roleLabel(g.role)}`)
        .join(", ");
      return `공굴리기 추측(${guesses}) 중 ${data.correct}개 적중`;
    }
    case "mathematician":
      return `오늘 밤 능력이 비정상 작동한 플레이어: ${data.count}명`;
    case "chambermaid":
      return `${pair(...data.targets)} 중 어젯밤 깨어난 사람: ${data.count}명`;
    case "monk":
      return `${seatName(data.target)}를 악마로부터 보호했다`;
    case "exorcist":
      return `${seatName(data.target)}를 지목했다 (악마라면 그 밤 깨어나지 못한다)`;
    case "sailor":
      return `${seatName(data.target)}를 골랐다 — 나 또는 그가 아침까지 취한다`;
    case "innkeeper":
      return `${pair(...data.targets)}를 보호했다 — 둘은 오늘 밤 죽지 않고, 하나가 취한다`;
    case "courtier":
      return `${roleLabel(data.role)}을(를) 골랐다 — 그 역할이 3일 밤낮 취한다`;
    case "professor":
      return `${seatName(data.target)}의 시신을 골랐다 — 마을 사람이었다면 되살아났을 것이다`;
    case "snakecharmer":
      return `${seatName(data.target)}를 지목했다 — 악마라면 역할과 진영이 뒤바뀐다`;
    case "philosopher":
      return `${roleLabel(data.role)}의 능력을 얻었다 — 그 역할이 판에 있다면 원주인은 취한다`;
    case "artist":
      return `낮에 물었다: "${renderProp(data.question)}?" — 답은 "${data.yes ? "그렇다" : "아니다"}"`;
    case "savant":
      return `낮에 들었다: "${renderProp(data.statements[0])}" / "${renderProp(data.statements[1])}" — 하나는 참, 하나는 거짓`;
    case "dreamer":
      return `${seatName(data.target)}는 ${roleLabel(data.goodRole)} 아니면 ${roleLabel(data.evilRole)}이다`;
    case "oracle":
      return `죽은 플레이어 중 악인: ${data.count}명`;
    case "flowergirl":
      return data.yes ? "어제 악마가 투표했다" : "어제 악마는 투표하지 않았다";
    case "towncrier":
      return data.yes ? "어제 하수인이 지명했다" : "어제 하수인은 지명하지 않았다";
    case "grandmother":
      return `내 손주는 ${seatName(data.target)} — ${roleLabel(data.shownRole)}이다`;
    case "gambler":
      return `${seatName(data.target)}를 ${roleLabel(data.role)}로 추측했다 (틀리면 죽는다)`;
    case "sage":
      return `죽는 순간 배웠다: ${seatName(data.targets[0])}·${seatName(data.targets[1])} 중 하나가 나를 죽인 악마다`;
  }
}
