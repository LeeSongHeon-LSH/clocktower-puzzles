// InfoData → 한국어 문장 자동 생성. 역할명은 항상 roles.ts 사전을 거친다.
// ClaimInfo.text가 있으면 그것을 우선하고, 없으면 renderInfo(data)를 쓴다.

import { roleLabel } from "@/data/roles";
import { seatName } from "@/lib/puzzles/schema";
import type { InfoData, Seat } from "@/lib/solver/types";

function pair(a: Seat, b: Seat): string {
  return `${seatName(a)}·${seatName(b)}`;
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
  }
}
