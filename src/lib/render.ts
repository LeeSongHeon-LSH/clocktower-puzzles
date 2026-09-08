// InfoData → 한국어 문장 자동 생성. 역할명은 항상 roles.ts 사전을 거친다.
// ClaimInfo.text가 있으면 그것을 우선하고, 없으면 renderInfo(data)를 쓴다.

import { roleLabel } from "@/data/roles";
import { seatName } from "@/lib/puzzles/schema";
import type { GameEvent, InfoData, Prop, RoleId, Seat } from "@/lib/solver/types";

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

// ── 타임라인 문장 ─────────────────────────────────────────────────
// 풀이 화면(PuzzleClient)과 에디터 미리보기(PuzzleCreator)가 같은 문장을 쓴다.
// 역할명이 들어가는 문장(처단자 총격·성결자 발동)은 사전을 거친다.

/** 낮 공개 행동 한 건 (day 필드는 없어도 된다 — 에디터 초안도 같은 모양이다) */
export type DayActionLike =
  | { type: "slayerShot"; seat: Seat; target: Seat; died: boolean }
  | { type: "nomination"; nominator: Seat; nominee: Seat }
  | { type: "virginTrigger"; nominator: Seat; nominee: Seat };

export function renderDayAction(act: DayActionLike): string {
  const slayer = roleLabel("slayer");
  if (act.type === "slayerShot") {
    return act.died
      ? `${seatName(act.seat)}가 ${slayer}를 자처하며 ${seatName(act.target)}를 쐈다 — ${seatName(act.target)}가 죽었다!`
      : `${seatName(act.seat)}가 ${slayer}를 자처하며 ${seatName(act.target)}를 쐈지만, 아무 일도 일어나지 않았다.`;
  }
  if (act.type === "nomination") {
    return `${seatName(act.nominator)}가 ${seatName(act.nominee)}를 지명했지만, 아무 일도 일어나지 않았다.`;
  }
  return `${seatName(act.nominator)}가 ${seatName(act.nominee)}를 지명한 순간, ${roleLabel("virgin")} 발동으로 ${seatName(act.nominator)}가 그 자리에서 처형됐다!`;
}

/** 밤 n의 문장. 첫 밤은 사망이 없다 */
export function renderNightLine(night: number, dead: readonly Seat[]): string {
  if (night === 1) return "첫 밤 — 마을이 잠들고 정보 역할들이 깨어났다. 악마는 아직 죽이지 않는다.";
  return dead.length === 0 ? "아무도 죽지 않았다." : `${dead.map(seatName).join(", ")}가 죽은 채 발견됐다.`;
}

/** 지나간 낮의 처형 문장. 성결자 발동으로 처형이 이미 일어난 낮은 행동 문장이 대신하므로 없다 */
export function renderExecutionLine(executed: Seat | null, virginDay: boolean): string | null {
  if (virginDay) return null;
  return executed === null ? "처형이 없었다." : `마을은 ${seatName(executed)}를 처형했다.`;
}

/** 그날 투표에 손을 든 사람 (부분 기록) */
export function renderVoteLine(voters: readonly Seat[]): string | null {
  return voters.length === 0 ? null : `이날 투표에 손을 든 사람: ${voters.map(seatName).join(", ")}.`;
}

/** 현재 낮 — 처형 전, 풀이자의 차례 */
export const NOW_LINE = "지금 — 처형 전. 당신의 추리 차례다.";

export interface TimelineItem {
  label: string;
  text: string;
  kind: "night" | "day" | "now";
}

/** 사건 원장 전체를 밤1 → 낮1 → … → 지금 순서의 문장으로 */
export function renderTimeline(events: readonly GameEvent[], nights: number): TimelineItem[] {
  const dayLines = (d: number): string[] => {
    const lines: string[] = [];
    const vote = renderVoteLine(events.flatMap((e) => (e.type === "vote" && e.day === d ? [e.seat] : [])));
    if (vote) lines.push(vote);
    for (const e of events) {
      if ((e.type === "slayerShot" || e.type === "nomination" || e.type === "virginTrigger") && e.day === d) {
        lines.push(renderDayAction(e));
      }
    }
    return lines;
  };
  const items: TimelineItem[] = [{ label: "밤 1", text: renderNightLine(1, []), kind: "night" }];
  for (let d = 1; d < nights; d++) {
    const exec = events.find((e): e is Extract<GameEvent, { type: "execution" }> => e.type === "execution" && e.day === d);
    const virginDay = events.some((e) => e.type === "virginTrigger" && e.day === d);
    const lines = dayLines(d);
    const execLine = renderExecutionLine(exec?.seat ?? null, virginDay);
    if (execLine) lines.push(execLine);
    items.push({ label: `낮 ${d}`, text: lines.join(" "), kind: "day" });
    const dead = events.flatMap((e) => (e.type === "death" && e.night === d + 1 ? [e.seat] : []));
    items.push({ label: `밤 ${d + 1}`, text: renderNightLine(d + 1, dead), kind: "night" });
  }
  items.push({ label: `낮 ${nights}`, text: [...dayLines(nights), NOW_LINE].join(" "), kind: "now" });
  return items;
}
