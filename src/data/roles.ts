// 역할 사전 — UI 표기의 유일한 원본. 이 파일을 직접 고쳐 커밋한다(런타임 편집 기능 없음).
// UI 표기는 항상 `한국어(영어)` 형식을 쓴다: roleLabel() 참조.
//
// 수록 범위: 3개 기본 판본(TB·BMR·SV)의 전 역할 72종. 여행자는 제외한다 —
// 팀 구성(composition.ts)과 좌석 모델이 여행자를 다루지 않는다.
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
  // ── 점철되는 혼란 (Trouble Brewing) ──
  washerwoman: { en: "Washerwoman", ko: "세탁부", team: "townsfolk", edition: "tb" },
  librarian: { en: "Librarian", ko: "사서", team: "townsfolk", edition: "tb" },
  investigator: { en: "Investigator", ko: "수사관", team: "townsfolk", edition: "tb" },
  chef: { en: "Chef", ko: "요리사", team: "townsfolk", edition: "tb" },
  empath: { en: "Empath", ko: "초공감자", team: "townsfolk", edition: "tb" },
  fortuneteller: { en: "Fortune Teller", ko: "점쟁이", team: "townsfolk", edition: "tb" },
  undertaker: { en: "Undertaker", ko: "장의사", team: "townsfolk", edition: "tb" },
  monk: { en: "Monk", ko: "수도사", team: "townsfolk", edition: "tb" },
  ravenkeeper: { en: "Ravenkeeper", ko: "까마귀지기", team: "townsfolk", edition: "tb" },
  virgin: { en: "Virgin", ko: "성결자", team: "townsfolk", edition: "tb" },
  slayer: { en: "Slayer", ko: "처단자", team: "townsfolk", edition: "tb" },
  soldier: { en: "Soldier", ko: "군인", team: "townsfolk", edition: "tb" },
  mayor: { en: "Mayor", ko: "시장", team: "townsfolk", edition: "tb" },
  butler: { en: "Butler", ko: "집사", team: "outsider", edition: "tb" },
  drunk: { en: "Drunk", ko: "주정뱅이", team: "outsider", edition: "tb" },
  recluse: { en: "Recluse", ko: "은둔자", team: "outsider", edition: "tb" },
  saint: { en: "Saint", ko: "성자", team: "outsider", edition: "tb" },
  poisoner: { en: "Poisoner", ko: "독살범", team: "minion", edition: "tb" },
  spy: { en: "Spy", ko: "첩자", team: "minion", edition: "tb" },
  scarletwoman: { en: "Scarlet Woman", ko: "탕녀", team: "minion", edition: "tb" },
  baron: { en: "Baron", ko: "남작", team: "minion", edition: "tb" },
  imp: { en: "Imp", ko: "임프", team: "demon", edition: "tb" },
  // ── 피로 물든 달 (Bad Moon Rising) ──
  grandmother: { en: "Grandmother", ko: "할머니", team: "townsfolk", edition: "bmr" },
  sailor: { en: "Sailor", ko: "선원", team: "townsfolk", edition: "bmr" },
  chambermaid: { en: "Chambermaid", ko: "객실 청소부", team: "townsfolk", edition: "bmr" },
  exorcist: { en: "Exorcist", ko: "구마사제", team: "townsfolk", edition: "bmr" },
  innkeeper: { en: "Innkeeper", ko: "여관 주인", team: "townsfolk", edition: "bmr" },
  gambler: { en: "Gambler", ko: "도박사", team: "townsfolk", edition: "bmr" },
  gossip: { en: "Gossip", ko: "험담꾼", team: "townsfolk", edition: "bmr" },
  courtier: { en: "Courtier", ko: "궁정대신", team: "townsfolk", edition: "bmr" },
  professor: { en: "Professor", ko: "교수", team: "townsfolk", edition: "bmr" },
  minstrel: { en: "Minstrel", ko: "음유시인", team: "townsfolk", edition: "bmr" },
  tealady: { en: "Tea Lady", ko: "찻집 여인", team: "townsfolk", edition: "bmr" },
  pacifist: { en: "Pacifist", ko: "평화주의자", team: "townsfolk", edition: "bmr" },
  fool: { en: "Fool", ko: "어릿광대", team: "townsfolk", edition: "bmr" },
  tinker: { en: "Tinker", ko: "땜장이", team: "outsider", edition: "bmr" },
  moonchild: { en: "Moonchild", ko: "달의 자손", team: "outsider", edition: "bmr" },
  goon: { en: "Goon", ko: "건달", team: "outsider", edition: "bmr" },
  lunatic: { en: "Lunatic", ko: "미치광이", team: "outsider", edition: "bmr" },
  godfather: { en: "Godfather", ko: "대부", team: "minion", edition: "bmr" },
  devilsadvocate: { en: "Devil's Advocate", ko: "악마의 변호사", team: "minion", edition: "bmr" },
  assassin: { en: "Assassin", ko: "암살자", team: "minion", edition: "bmr" },
  mastermind: { en: "Mastermind", ko: "주모자", team: "minion", edition: "bmr" },
  zombuul: { en: "Zombuul", ko: "좀버얼", team: "demon", edition: "bmr" },
  pukka: { en: "Pukka", ko: "푸카", team: "demon", edition: "bmr" },
  shabaloth: { en: "Shabaloth", ko: "샤발로스", team: "demon", edition: "bmr" },
  po: { en: "Po", ko: "포", team: "demon", edition: "bmr" },
  // ── 화단에 꽃피운 이단 (Sects & Violets) ──
  clockmaker: { en: "Clockmaker", ko: "시계공", team: "townsfolk", edition: "sv" },
  dreamer: { en: "Dreamer", ko: "꿈꾸는 자", team: "townsfolk", edition: "sv" },
  snakecharmer: { en: "Snake Charmer", ko: "뱀 조련사", team: "townsfolk", edition: "sv" },
  mathematician: { en: "Mathematician", ko: "수학자", team: "townsfolk", edition: "sv" },
  flowergirl: { en: "Flowergirl", ko: "꽃팔이 소녀", team: "townsfolk", edition: "sv" },
  towncrier: { en: "Town Crier", ko: "포고꾼", team: "townsfolk", edition: "sv" },
  oracle: { en: "Oracle", ko: "예언자", team: "townsfolk", edition: "sv" },
  savant: { en: "Savant", ko: "백치천재", team: "townsfolk", edition: "sv" },
  seamstress: { en: "Seamstress", ko: "재봉사", team: "townsfolk", edition: "sv" },
  philosopher: { en: "Philosopher", ko: "철학자", team: "townsfolk", edition: "sv" },
  artist: { en: "Artist", ko: "화가", team: "townsfolk", edition: "sv" },
  juggler: { en: "Juggler", ko: "곡예사", team: "townsfolk", edition: "sv" },
  sage: { en: "Sage", ko: "현자", team: "townsfolk", edition: "sv" },
  mutant: { en: "Mutant", ko: "변종", team: "outsider", edition: "sv" },
  sweetheart: { en: "Sweetheart", ko: "사랑꾼", team: "outsider", edition: "sv" },
  barber: { en: "Barber", ko: "이발사", team: "outsider", edition: "sv" },
  klutz: { en: "Klutz", ko: "얼뜨기", team: "outsider", edition: "sv" },
  eviltwin: { en: "Evil Twin", ko: "사악한 쌍둥이", team: "minion", edition: "sv" },
  witch: { en: "Witch", ko: "마녀", team: "minion", edition: "sv" },
  cerenovus: { en: "Cerenovus", ko: "세레노버스", team: "minion", edition: "sv" },
  pithag: { en: "Pit-Hag", ko: "마귀할멈", team: "minion", edition: "sv" },
  fanggu: { en: "Fang Gu", ko: "팡 구", team: "demon", edition: "sv" },
  vigormortis: { en: "Vigormortis", ko: "비고르모르티스", team: "demon", edition: "sv" },
  nodashii: { en: "No Dashii", ko: "노 다시", team: "demon", edition: "sv" },
  vortox: { en: "Vortox", ko: "보르톡스", team: "demon", edition: "sv" },
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
