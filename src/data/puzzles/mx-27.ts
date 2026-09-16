import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 음유시인 — 하수인이 처형된 다음 밤은 전원이 취한다. 아무도 죽지 않은 밤 하나가
// "처형된 그 사람이 하수인이었다"를 증명하고, 그 밤의 장의사·초공감자 정보를 동시에 무효로 만든다.
export default definePuzzle({
  id: "mx-27",
  title: "아홉 개의 그림자",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 9,
  nights: 3,
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "oracle", "seamstress", "chambermaid", "minstrel",
    "mayor", "virgin", "slayer", "soldier", "monk", "exorcist", "tealady", "sailor", "innkeeper",
    "fool", "courtier", "gambler", "grandmother", "towncrier",
    "butler", "klutz", "saint", "recluse", "tinker",
    "scarletwoman", "baron", "godfather", "devilsadvocate", "eviltwin", "assassin", "spy",
    "imp", "fanggu", "vigormortis", "vortox",
  ],
  intro:
    "9인 게임, 3일차 아침. 낮1에 D가 처형됐고, 그날 밤에는 아무도 죽지 않았다. " +
    "낮2에는 아무도 처형하지 못했고, 밤3에 F가 죽었다. " +
    "마을은 무고한 사람을 죽였다고 자책하는 중이다.",
  claims: [
    { seat: 0, role: "minstrel", info: [] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 2 } },
        { night: 3, data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 2, role: "butler", info: [] },
    { seat: 3, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [4, 7], yes: false } }] },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [2, 7], shownRole: "investigator" } }] },
    { seat: 5, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 6, role: "klutz", info: [] },
    { seat: 7, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [3, 6], shownRole: "scarletwoman" } }] },
    { seat: 8, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "fortuneteller" } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 3 },
    { type: "death", night: 3, seat: 5 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [4] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "imp" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "밤2를 설명할 수 있는 역할이 이 판에 실제로 몇이나 있는지 세어 보라. 대본에 있는 것과 판에 있는 것은 다르다 — 선한 좌석은 자기 역할을 정직하게 말하고, 이 대본에는 그것을 어길 수단이 없다.",
    "같은 밤에 어긋난 증언이 둘이다. 둘을 따로따로 변명하려 들지 말고, 한꺼번에 설명하는 원인 하나를 찾아라.",
  ],
  walkthrough: [
    "① 먼저 판에 있는 역할이 무엇인지 못박는다. 이 대본에는 주정뱅이도 광인도 미치광이도 건달도 없다 — 선한 좌석은 예외 없이 자기 역할을 그대로 말한다. 악역은 하수인 하나와 악마 하나뿐이다. 따라서 **아무도 주장하지 않은 선한 역할은 판에 없다.** 대본에 이름만 올라 있을 뿐이다.",
    "② 밤2에 아무도 죽지 않았다. 조용한 밤에는 설명이 필요하다. 악마를 취하게 하는 독살범·대신·선원·여관주인, 킬을 막는 군인·수도사·구마사제·찻집 여인·어릿광대 — ①에 따라 **이 중 판에 있는 것은 하나도 없다.** 조용한 밤이 공짜인 악마(포·샤발로스·좀버얼·푸카)도 대본 밖이다.",
    "③ 남는 설명은 하나뿐이다. **음유시인**은 하수인이 처형되어 죽으면 그 다음 밤 전원을 취하게 한다 — 그 밤에는 아무도 깨지 않고 아무도 죽지 않는다. 그러므로 A는 진짜 음유시인이고(A가 악역이면 음유시인이 판에 없어 밤2를 설명할 수 없다), **낮1에 처형된 D가 하수인이다.** 마을이 무고한 사람을 죽였다고 자책한 그 밤의 침묵이 오히려 제대로 죽였다는 증거다.",
    "④ 그 밤이 전원 취한 밤이었다는 사실은 어긋난 증언 둘을 한꺼번에 설명한다. 장의사 I의 \"처형된 자는 점쟁이였다\"도, 초공감자 B의 밤2 \"이웃 중 악 2\"도 그 밤의 헛것이다. 실제로 B의 밤2 이웃은 A와 C인데, D가 죽은 뒤 남은 악역은 악마 하나뿐이라 둘이 모두 악일 수는 없다.",
    "⑤ 수사관 H의 밤1 정보는 D 아니면 G가 탕녀라고 말한다. 하수인은 한 명뿐이고 그것이 D이므로, G가 탕녀일 수는 없다 — **D는 탕녀였다.**",
    "⑥ 요리사 F의 밤1 \"인접한 악인 쌍 하나\". 악역은 D와 악마 둘뿐이니 그 쌍은 D와 악마가 나란히 앉은 것이다. **악마는 C 아니면 E다.**",
    "⑦ 초공감자 B는 밤1과 밤3에 모두 \"이웃 중 악 0\"이라고 했다. 죽은 사람이 D와 F뿐이라 두 밤 모두 B의 이웃은 A와 C다. 어긋난 값은 전원 취한 밤2 하나뿐이고 나머지 두 밤은 믿을 수 있다 — **C는 악하지 않다. 악마는 E다.**",
    "⑧ 종류를 가른다. 9인 기본 구성은 마을 주민 5, 외지인 2, 하수인 1, 악마 1이고, 외지인을 주장한 좌석은 C(집사)와 G(얼간이) 정확히 둘이다(①에 따라 숨은 외지인은 없다). 팡 구는 외지인을 하나 늘려 세 자리를 요구하고, 비고르모르티스는 하나로 줄여 C와 G 중 하나를 거짓말쟁이로 만든다 — 둘 다 이 판과 맞지 않는다. 보르톡스는 처형 없는 낮이 지나면 그 자리에서 악의 승리로 끝나는데, 낮2에는 처형이 없었다. **남는 악마는 임프뿐이다.**",
    "⑨ 재구성: 탕녀 D는 점쟁이를 사칭하다 첫날 처형됐다. 그 죽음이 음유시인 A의 능력을 깨워 다음 밤 아홉 사람 모두를 취하게 만들었고, 그래서 임프 E는 아무도 죽이지 못했으며 장의사 I는 시신에서 엉뚱한 토큰을 읽었다. 마을은 그 오독을 근거로 무고한 사람을 죽였다고 믿고 낮2에 아무도 처형하지 못했다. 임프는 그 망설임 덕에 밤을 하나 더 얻어 요리사 F를 죽였다 — 자기 옆자리를 가리키고 있던 유일한 정보였다.",
  ],
  solution: ["minstrel", "empath", "butler", "scarletwoman", "imp", "chef", "klutz", "investigator", "undertaker"],
});
