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
  monk: {
    officialName: "수도사",
    ability: "매일 밤*, (당신을 제외하고) 플레이어 1명을 선택합니다: 그는 오늘 밤 악마로부터 안전합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Monk",
  },
  ravenkeeper: {
    officialName: "까마귀지기",
    ability: "밤에 사망하면, 깨어나서 플레이어 1명을 선택합니다: 그의 캐릭터를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Ravenkeeper",
  },
  virgin: {
    officialName: "성결자",
    ability: "처음으로 지목당했을 때, 당신을 지목한 플레이어가 주민이라면, 그는 즉시 처형당합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Virgin",
  },
  slayer: {
    officialName: "처단자",
    ability: "게임당 1번, 낮 동안, 공개적으로 플레이어 1명을 선택합니다: 그가 악마면 그는 사망합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Slayer",
  },
  soldier: {
    officialName: "군인",
    ability: "악마로부터 안전합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Soldier",
  },
  mayor: {
    officialName: "시장",
    ability: "3명만 생존한 상황에서 처형이 일어나지 않았다면, 당신이 속한 팀이 승리합니다. 밤에 사망하면, 그 대신 다른 플레이어 1명이 사망할 수도 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Mayor",
  },
  butler: {
    officialName: "집사",
    ability: "매일 밤, (당신을 제외하고) 플레이어 1명을 선택합니다: 다음 날, 그가 투표에 참여한 경우에만 당신도 투표에 참여할 수 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Butler",
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
  saint: {
    officialName: "성자",
    ability: "당신이 처형으로 사망하면, 당신이 속한 팀이 패배합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Saint",
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
  scarletwoman: {
    officialName: "탕녀",
    ability: "플레이어가 5명 이상(여행자는 세지 않음) 생존해 있는 상황에서 악마가 사망하면, 당신이 악마가 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Scarlet_Woman",
  },
  baron: {
    officialName: "남작",
    ability: "외지인이 추가로 게임에 참여합니다. [외지인 +2명]",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Baron",
  },
  imp: {
    officialName: "임프",
    ability: "매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 이 방법으로 자결하면, 하수인 1명이 임프가 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Imp",
  },
  grandmother: {
    officialName: "할머니",
    ability: "게임 시작 시, 선한 플레이어 1명과 그의 캐릭터를 알게 됩니다. 악마가 그 플레이어를 죽이면, 당신도 사망합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Grandmother",
  },
  sailor: {
    officialName: "선원",
    ability: "매일 밤, 생존한 플레이어 1명을 선택합니다: 당신과 그중 1명은 황혼까지 취합니다. 당신은 사망할 수 없습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Sailor",
  },
  chambermaid: {
    officialName: "객실 청소부",
    ability: "매일 밤, (당신을 제외하고) 생존한 플레이어 2명을 선택합니다: 그중 몇 명이 오늘 밤 자기 능력으로 인해 자신이 깨어났는지 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Chambermaid",
  },
  exorcist: {
    officialName: "구마사제",
    ability: "매일 밤*, (지난밤에 선택하지 않았던) 플레이어 1명을 선택합니다: 악마가 선택된다면 그 악마는 당신의 정체를 알게 되지만 오늘 밤 깨지 않습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Exorcist",
  },
  innkeeper: {
    officialName: "여관 주인",
    ability: "매일 밤*, 플레이어 2명을 선택합니다: 이들은 오늘 밤 사망할 수 없으나, 그중 1명은 황혼까지 취합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Innkeeper",
  },
  gambler: {
    officialName: "도박사",
    ability: "매일 밤*, 플레이어 1명을 선택하고 그의 캐릭터를 추측합니다: 추측이 틀리면, 당신은 사망합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Gambler",
  },
  gossip: {
    officialName: "험담꾼",
    ability: "매일 낮, 당신은 공개 발언을 할 수 있습니다. 오늘 밤, 그 발언이 사실이었다면 플레이어 1명이 사망합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Gossip",
  },
  courtier: {
    officialName: "궁정대신",
    ability: "게임당 1번, 밤에, 캐릭터 1명을 선택합니다: 그 플레이어는 3일 밤낮 동안 취합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Courtier",
  },
  professor: {
    officialName: "교수",
    ability: "게임당 1번, 밤*에, 사망한 플레이어 1명을 선택합니다: 그 플레이어가 주민이라면, 그 플레이어는 부활합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Professor",
  },
  minstrel: {
    officialName: "음유시인",
    ability: "하수인 1명이 처형으로 사망하면, (여행자를 제외하고) 다른 모든 플레이어는 다음 날 황혼까지 취합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Minstrel",
  },
  tealady: {
    officialName: "찻집 여인",
    ability: "이웃 생존자 2명이 모두 선한 플레이어라면, 이들은 사망할 수 없습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Tea_Lady",
  },
  pacifist: {
    officialName: "평화주의자",
    ability: "처형당한 선한 플레이어는 사망하지 않을 수도 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Pacifist",
  },
  fool: {
    officialName: "어릿광대",
    ability: "처음으로 사망할 때, 사망하지 않습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Fool",
  },
  tinker: {
    officialName: "땜장이",
    ability: "당신은 언제든지 돌연 사망할 수도 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Tinker",
  },
  moonchild: {
    officialName: "달의 자손",
    ability: "당신이 사망했음을 알게 될 때, 생존한 플레이어 1명을 공개적으로 선택합니다. 그가 선한 플레이어라면, 오늘 밤 그는 사망합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Moonchild",
  },
  goon: {
    officialName: "건달",
    ability: "매일 밤, 자기 능력으로 당신을 선택하는 첫 플레이어는 황혼까지 취합니다. 당신은 그 플레이어가 소속한 팀이 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Goon",
  },
  lunatic: {
    officialName: "미치광이",
    ability: "당신은 악마가 아니지만, 악마라고 착각합니다. 악마는 당신이 누구인지 알고, 밤에 당신이 누구를 선택하는지 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Lunatic",
  },
  godfather: {
    officialName: "대부",
    ability: "게임 시작 시, 어느 외지인이 게임에 참여하는지 알게 됩니다. 낮에 외지인이 1명 사망하면, 그날 밤에 플레이어 1명을 선택합니다: 그는 사망합니다. [외지인 -1명 또는 +1명]",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Godfather",
  },
  devilsadvocate: {
    officialName: "악마의 변호사",
    ability: "매일 밤, (지난밤에 선택하지 않았던) 생존한 플레이어 1명을 선택합니다: 그 플레이어가 내일 처형당하면, 그는 사망하지 않습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Devil's_Advocate",
  },
  assassin: {
    officialName: "암살자",
    ability: "게임당 1번, 밤*에, 플레이어 1명을 선택합니다: 그는 이유불문 사망합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Assassin",
  },
  mastermind: {
    officialName: "주모자",
    ability: "악마가 처형으로 사망하면(게임 종료 조건), 하루 더 게임을 진행합니다. 그런 다음, 플레이어 1명이 처형당하면, 그 플레이어가 소속된 팀이 패배합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Mastermind",
  },
  zombuul: {
    officialName: "좀버얼",
    ability: "매일 밤*, 오늘 낮에 누구도 사망하지 않았다면, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신이 처음으로 사망할 때, 실제로는 생존해 있지만 사망한 상태로 위장합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Zombuul",
  },
  pukka: {
    officialName: "푸카",
    ability: "매일 밤, 플레이어 1명을 선택합니다: 그는 중독됩니다. 이전에 당신이 중독시켰던 플레이어는 사망하고, 건강한 상태가 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Pukka",
  },
  shabaloth: {
    officialName: "샤발로스",
    ability: "매일 밤*, 플레이어 2명을 선택합니다: 그는 사망합니다. 지난 밤에 당신이 선택했던 사망한 플레이어를 다시 토해낼 수도 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Shabaloth",
  },
  po: {
    officialName: "포",
    ability: "매일 밤*, 플레이어 1명을 선택할 수 있습니다: 그는 사망합니다. 이전에 누구도 선택하지 않았다면, 오늘 밤에는 사망할 플레이어 3명을 선택합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Po",
  },
  clockmaker: {
    officialName: "시계공",
    ability: "게임 시작 시, 악마와 가장 가까운 하수인 사이의 거리를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Clockmaker",
  },
  dreamer: {
    officialName: "꿈꾸는 자",
    ability: "매일 밤, (당신과 여행자를 제외하고) 플레이어 1명을 선택합니다: 선한 캐릭터 하나와 악한 캐릭터 하나를 알게 됩니다. 둘 중 하나가 그의 정체입니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Dreamer",
  },
  snakecharmer: {
    officialName: "뱀 조련사",
    ability: "매일 밤, 생존한 플레이어 1명을 선택합니다: 악마를 선택했다면, 악마는 당신과 소속 및 캐릭터를 맞바꾼 다음 중독됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Snake_Charmer",
  },
  mathematician: {
    officialName: "수학자",
    ability: "매일 밤, (새벽부터 지금까지) 다른 플레이어의 능력으로 인해 비정상적으로 작동한 플레이어 능력이 몇 개나 되는지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Mathematician",
  },
  flowergirl: {
    officialName: "꽃팔이 소녀",
    ability: "매일 밤*, 오늘 낮에 악마가 투표했는지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Flowergirl",
  },
  towncrier: {
    officialName: "포고꾼",
    ability: "매일 밤*, 오늘 낮에 하수인이 지목에 나섰는지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Town_Crier",
  },
  oracle: {
    officialName: "예언자",
    ability: "매일 밤*, 사망한 플레이어 가운데 몇 명이나 악한 팀인지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Oracle",
  },
  savant: {
    officialName: "백치천재",
    ability: "매일 낮, 개인적으로 이야기꾼을 찾아가 두 가지 정보를 알게 됩니다. 그 중 하나는 진실이고 다른 하나는 거짓입니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Savant",
  },
  seamstress: {
    officialName: "재봉사",
    ability: "게임당 1번, 밤에, (당신을 제외하고) 플레이어 2명을 선택합니다: 그들이 같은 소속인지 아닌지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Seamstress",
  },
  philosopher: {
    officialName: "철학자",
    ability: "게임당 1번, 밤에, 선한 캐릭터 1명을 선택합니다: 그의 능력을 얻습니다. 그 캐릭터가 이미 게임에 참여하고 있다면, 그는 취합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Philosopher",
  },
  artist: {
    officialName: "화가",
    ability: "게임당 1번, 낮 동안, 개인적으로 이야기꾼에게 예/아니오로 답할 수 있는 질문을 합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Artist",
  },
  juggler: {
    officialName: "곡예사",
    ability: "당신의 첫 번째 낮에, 공개적으로 플레이어들의 캐릭터를 최대 5번까지 추측합니다. 그날 밤, 그중 몇 개나 맞혔는지를 알게 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Juggler",
  },
  sage: {
    officialName: "현자",
    ability: "악마가 당신을 죽이면, 플레이어 2명을 알게 됩니다.그중 1명이 악마입니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Sage",
  },
  mutant: {
    officialName: "변종",
    ability: "당신이 “외지인”이라는 사실에 집착한다면, 당신은 처형당할 수도 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Mutant",
  },
  sweetheart: {
    officialName: "사랑꾼",
    ability: "당신이 사망할 때, 지금부터 플레이어 1명은 취함 상태가 됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Sweetheart",
  },
  barber: {
    officialName: "이발사",
    ability: "오늘 낮 또는 오늘 밤에 사망했다면, 악마는 플레이어 2명(다른 악마는 제외)을 선택하여 그 두 명의 캐릭터를 맞바꿀 수 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Barber",
  },
  klutz: {
    officialName: "얼뜨기",
    ability: "당신이 사망했음을 알게 될 때, 생존한 플레이어 1명을 공개적으로 선택합니다: 그가 악한 플레이어라면, 당신이 속한 팀이 패배합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Klutz",
  },
  eviltwin: {
    officialName: "사악한 쌍둥이",
    ability: "당신과 선한 쌍둥이는 서로를 알아봅니다. 선한 쌍둥이가 처형당하면, 악한 팀이 승리합니다. 쌍둥이가 둘 다 살아있는 한, 선한 팀은 승리할 수 없습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Evil_Twin",
  },
  witch: {
    officialName: "마녀",
    ability: "매일 밤, 플레이어 1명을 선택합니다: 그가 다음 날 누군가를 지목한다면, 그는 사망합니다. 생존한 플레이어가 3명만 남았다면, 이 능력을 잃습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Witch",
  },
  cerenovus: {
    officialName: "세레노버스",
    ability: "매일 밤, 플레이어 1명과 선한 캐릭터 하나를 선택합니다: 선택된 플레이어는 다음 날 자신이 해당 캐릭터라고 집착해야 합니다. 그렇지 않으면, 처형당할 수도 있습니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Cerenovus",
  },
  pithag: {
    officialName: "마귀할멈",
    ability: "매일 밤*, 플레이어 1명과 캐릭터 하나를 선택하고, (그 캐릭터가 게임에 참여하지 않았을 경우) 그를 선택한 캐릭터로 바꿉니다: 이 능력으로 악마를 만든다면, 오늘 밤 예측불허의 죽음이 찾아옵니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Pit-Hag",
  },
  fanggu: {
    officialName: "팡 구",
    ability: "매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 이 능력으로 사망한 첫 외지인만이 악한 팡 구가 되고 당신이 대신 사망합니다. [외지인 +1명]",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Fang_Gu",
  },
  vigormortis: {
    officialName: "비고르모르티스",
    ability: "매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신이 죽인 하수인은 능력을 유지하며, 그의 이웃 주민 중 1명이 중독됩니다. [외지인 -1명]",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Vigormortis",
  },
  nodashii: {
    officialName: "노 다시",
    ability: "매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신의 이웃 주민 2명은 중독됩니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/No_Dashii",
  },
  vortox: {
    officialName: "보르톡스",
    ability: "매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 주민의 능력은 거짓 정보만 제공합니다. 매일 낮, 누구도 처형되지 않으면 악한 팀이 승리합니다.",
    almanacUrl: "https://wiki.bloodontheclocktower.com/Vortox",
  },
} as const satisfies Record<string, RoleRule>;
