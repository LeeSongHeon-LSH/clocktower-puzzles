// 자동 생성 파일 — 직접 편집하지 말 것.
// 생성: npm run rules:sync  (scripts/fetch-rule-sources.ts)
//
// 출처: Blood on the Clocktower 공식 알마낙 위키 (https://wiki.bloodontheclocktower.com).
// 규칙 서술의 정합성을 독자가 직접 확인할 수 있도록 원문 문장을 짧게 인용하고
// 해당 문서·판본으로 연결한다. 저작권은 The Pandemonium Institute에 있으며,
// 이 프로젝트는 공식과 무관한 비공식 팬 프로젝트다.

export interface RuleSource {
  /** 공식 위키 문서 제목 */
  page: string;
  /** 대조용 원문 인용 (영문) */
  quote: string;
  /** 해당 문서(및 섹션) 링크 */
  url: string;
  /** 대조한 판본 번호 */
  revid: number;
  /** 그 판본의 최종 수정일 (YYYY-MM-DD) */
  revised: string;
}

export const RULE_SOURCES = {
  "same-thing": {
    page: "States",
    quote: "Being drunk and being poisoned do the same thing.",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "no-ability": {
    page: "States",
    quote: "A drunk or poisoned player has no ability.",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "alive-or-dead": {
    page: "States",
    quote: "Alive and dead players alike can be drunk or poisoned.",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "once-per-game": {
    page: "States",
    quote: "If a player tries to use their “once per game” ability while drunk or poisoned, they do not get to use it again.",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "regain": {
    page: "States",
    quote: "If a drunk player becomes sober again, or if a poisoned player becomes healthy again, they regain their ability.",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "dont-tell": {
    page: "States",
    quote: "Do not tell them they are drunk or poisoned!",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "false-info": {
    page: "States",
    quote: "If their ability gives them information, you can give them incorrect information.",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "wasted": {
    page: "States",
    quote: "If an ability is triggered or used when the player is drunk or poisoned, the ability is wasted.",
    url: "https://wiki.bloodontheclocktower.com/States#Drunkenness_and_Poisoning",
    revid: 1039,
    revised: "2023-03-23",
  },
  "drunk-setup": {
    page: "Drunk",
    quote: "During setup, the Drunk's token does not go in the bag.",
    url: "https://wiki.bloodontheclocktower.com/Drunk",
    revid: 3110,
    revised: "2026-07-08",
  },
  "drunk-outsider": {
    page: "Drunk",
    quote: "They are now an Outsider, and do not have the ability of this Townsfolk character.",
    url: "https://wiki.bloodontheclocktower.com/Drunk",
    revid: 3110,
    revised: "2026-07-08",
  },
  "poison-duration": {
    page: "Poisoner",
    quote: "Each night, the Poisoner chooses someone to poison for that night and the entire next day.",
    url: "https://wiki.bloodontheclocktower.com/Poisoner",
    revid: 1737,
    revised: "2024-01-25",
  },
  "poison-dusk": {
    page: "Poisoner",
    quote: "Each dusk, the poisoned player becomes healthy—remove their POISONED reminder.",
    url: "https://wiki.bloodontheclocktower.com/Poisoner",
    revid: 1737,
    revised: "2024-01-25",
  },
  "poison-source-gone": {
    page: "Poisoner",
    quote: "The Poisoner poisons the Mayor, then becomes the Imp. The Mayor is no longer poisoned because there is no Poisoner in play.",
    url: "https://wiki.bloodontheclocktower.com/Poisoner",
    revid: 1737,
    revised: "2024-01-25",
  },
} as const satisfies Record<string, RuleSource>;

export type RuleSourceKey = keyof typeof RULE_SOURCES;
