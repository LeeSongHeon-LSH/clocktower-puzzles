// 역할 사전 — UI 표기의 유일한 원본. 관리자 페이지(/admin)가 이 파일을 GitHub 커밋으로 갱신한다.
// UI 표기는 항상 `한국어(영어)` 형식을 쓴다: roleLabel() 참조.
//
// 한국어 표기 기준: Pandemonium Institute 공식 번역(github.com/ThePandemoniumInstitute/botc-translations
// 의 game/ko.json). 예외 없이 전 역할이 공식 표기와 일치하며, `npm run rules:check`가 대조한다.

import type { Edition, RoleId, Team } from "@/lib/solver/types";

export interface RoleMeta {
  en: string;
  ko: string;
  team: Team;
  edition: Edition;
}

export const ROLES: Record<RoleId, RoleMeta> = {
  washerwoman: { en: "Washerwoman", ko: "세탁부", team: "townsfolk", edition: "tb" },
  librarian: { en: "Librarian", ko: "사서", team: "townsfolk", edition: "tb" },
  investigator: { en: "Investigator", ko: "수사관", team: "townsfolk", edition: "tb" },
  chef: { en: "Chef", ko: "요리사", team: "townsfolk", edition: "tb" },
  empath: { en: "Empath", ko: "초공감자", team: "townsfolk", edition: "tb" },
  fortuneteller: { en: "Fortune Teller", ko: "점쟁이", team: "townsfolk", edition: "tb" },
  undertaker: { en: "Undertaker", ko: "장의사", team: "townsfolk", edition: "tb" },
  ravenkeeper: { en: "Ravenkeeper", ko: "까마귀지기", team: "townsfolk", edition: "tb" },
  drunk: { en: "Drunk", ko: "주정뱅이", team: "outsider", edition: "tb" },
  recluse: { en: "Recluse", ko: "은둔자", team: "outsider", edition: "tb" },
  poisoner: { en: "Poisoner", ko: "독살범", team: "minion", edition: "tb" },
  spy: { en: "Spy", ko: "첩자", team: "minion", edition: "tb" },
  baron: { en: "Baron", ko: "남작", team: "minion", edition: "tb" },
  scarletwoman: { en: "Scarlet Woman", ko: "탕녀", team: "minion", edition: "tb" },
  imp: { en: "Imp", ko: "임프", team: "demon", edition: "tb" },
  clockmaker: { en: "Clockmaker", ko: "시계공", team: "townsfolk", edition: "sv" },
  seamstress: { en: "Seamstress", ko: "재봉사", team: "townsfolk", edition: "sv" },
  juggler: { en: "Juggler", ko: "곡예사", team: "townsfolk", edition: "sv" },
  mathematician: { en: "Mathematician", ko: "수학자", team: "townsfolk", edition: "sv" },
  chambermaid: { en: "Chambermaid", ko: "객실 청소부", team: "townsfolk", edition: "bmr" },
};

export const TEAM_LABELS: Record<Team, { ko: string; en: string }> = {
  townsfolk: { ko: "마을 주민", en: "Townsfolk" },
  outsider: { ko: "외지인", en: "Outsider" },
  minion: { ko: "하수인", en: "Minion" },
  demon: { ko: "악마", en: "Demon" },
};

export const EDITION_LABELS: Record<Edition | "mixed", { ko: string; en: string }> = {
  tb: { ko: "점철되는 혼란", en: "Trouble Brewing" },
  bmr: { ko: "피로 물든 달", en: "Bad Moon Rising" },
  sv: { ko: "화단에 꽃피운 이단", en: "Sects & Violets" },
  mixed: { ko: "혼합 스크립트", en: "Custom Script" },
};

/** UI 표준 표기: "임프(Imp)" */
export function roleLabel(id: RoleId): string {
  const r = ROLES[id];
  return `${r.ko}(${r.en})`;
}
