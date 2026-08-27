// 자동 생성 파일 — 직접 편집하지 말 것.
// 생성: npm run rules:sync  (scripts/fetch-rule-sources.ts)
//
// 출처: Pandemonium Institute 공식 한국어 번역
// https://github.com/ThePandemoniumInstitute/botc-translations/blob/main/game/ko.json
// 판본: 342831b (2026-07-03)
//
// 역할 능력 문구는 공식 번역을 그대로 인용한다. 저작권은 The Pandemonium Institute에
// 있으며, 이 프로젝트는 공식과 무관한 비공식 팬 프로젝트다.

export interface RoleRule {
  /** 공식 한국어 역할명 */
  officialName: string;
  /** 공식 한국어 능력 문구 */
  ability: string;
  /** 영문 알마낙(상세 규칙·예시) 링크 */
  almanacUrl: string;
}

export const ROLE_TRANSLATION_SOURCE = {
  repo: "ThePandemoniumInstitute/botc-translations",
  path: "game/ko.json",
  url: "https://github.com/ThePandemoniumInstitute/botc-translations/blob/main/game/ko.json",
  commit: "342831b",
  committed: "2026-07-03",
} as const;

export const ROLE_RULES = {
  washerwoman: {
    officialName: "세탁부",
    ability: "게임 시작 시, 플레이어 2명 중 1명이 특정 주민임을 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Washerwoman",
  },
  librarian: {
    officialName: "사서",
    ability: "게임 시작 시, 플레이어 2명 중 1명이 특정 외지인임을 (또는 게임에 참여하는 외지인이 없음을) 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Librarian",
  },
  investigator: {
    officialName: "수사관",
    ability: "게임 시작 시, 플레이어 2명 중 1명이 특정 하수인임을 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Investigator",
  },
  chef: {
    officialName: "요리사",
    ability: "게임 시작 시, 서로 이웃하게 앉은 악한 플레이어 몇 쌍 있는지 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Chef",
  },
  empath: {
    officialName: "초공감자",
    ability: "매일 밤, 이웃 생존자 2명 중 몇 명이나 악한지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Empath",
  },
  fortuneteller: {
    officialName: "점쟁이",
    ability: "매일 밤, 플레이어 2명을 선택합니다: 그중 악마가 있는지 알게 됩니다. 단, 선한 플레이어 중 1명이 당신에게는 악마로 위장되어 보입니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Fortune_Teller",
  },
  undertaker: {
    officialName: "장의사",
    ability: "매일 밤*, 오늘 낮에 처형으로 사망한 플레이어의 캐릭터를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Undertaker",
  },
  ravenkeeper: {
    officialName: "까마귀지기",
    ability: "밤에 사망하면, 깨어나서 플레이어 1명을 선택합니다: 그의 캐릭터를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Ravenkeeper",
  },
  drunk: {
    officialName: "주정뱅이",
    ability: "당신은 자신이 주정뱅이라는 사실을 모릅니다. 대신 다른 주민 캐릭터라고 착각하지만, 사실은 주정뱅이입니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Drunk",
  },
  recluse: {
    officialName: "은둔자",
    ability: "당신은 악한 팀 소속의 하수인 또는 악마로 위장될 수도 있습니다(사망한 상태더라도).",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Recluse",
  },
  poisoner: {
    officialName: "독살범",
    ability: "매일 밤, 플레이어 1명을 선택합니다: 그는 황혼까지 중독됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Poisoner",
  },
  spy: {
    officialName: "첩자",
    ability: "매일 밤, 마도서를 확인해 봅니다. 당신은 선한 팀 소속의 특정 주민 또는 외지인으로 위장될 수도 있습니다(사망한 상태더라도).",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Spy",
  },
  baron: {
    officialName: "남작",
    ability: "외지인이 추가로 게임에 참여합니다. [외지인 +2명]",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Baron",
  },
  scarletwoman: {
    officialName: "탕녀",
    ability: "플레이어가 5명 이상(여행자는 세지 않음) 생존해 있는 상황에서 악마가 사망하면, 당신이 악마가 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Scarlet_Woman",
  },
  imp: {
    officialName: "임프",
    ability: "매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 이 방법으로 자결하면, 하수인 1명이 임프가 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Imp",
  },
  clockmaker: {
    officialName: "시계공",
    ability: "게임 시작 시, 악마와 가장 가까운 하수인 사이의 거리를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Clockmaker",
  },
  seamstress: {
    officialName: "재봉사",
    ability: "게임당 1번, 밤에, (당신을 제외하고) 플레이어 2명을 선택합니다: 그들이 같은 소속인지 아닌지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Seamstress",
  },
  juggler: {
    officialName: "곡예사",
    ability: "당신의 첫 번째 낮에, 공개적으로 플레이어들의 캐릭터를 최대 5번까지 추측합니다. 그날 밤, 그중 몇 개나 맞혔는지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Juggler",
  },
  mathematician: {
    officialName: "수학자",
    ability: "매일 밤, (새벽부터 지금까지) 다른 플레이어의 능력으로 인해 비정상적으로 작동한 플레이어 능력이 몇 개나 되는지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Mathematician",
  },
  chambermaid: {
    officialName: "객실 청소부",
    ability: "매일 밤, (당신을 제외하고) 생존한 플레이어 2명을 선택합니다: 그중 몇 명이 오늘 밤 자기 능력으로 인해 자신이 깨어났는지 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Chambermaid",
  },
} as const satisfies Record<string, RoleRule>;
