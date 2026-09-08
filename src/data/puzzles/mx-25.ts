import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 사냥꾼이 악마로 등록된 은둔자를 맞혔다 — 마을은 이겼다고 믿었지만 악마는 그대로다.
// 종류는 그 뒤의 죽음이 말한다: 한 밤에 둘.
export default definePuzzle({
  id: "mx-25",
  title: "가을비 내린 사흘",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 8,
  nights: 3,
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "oracle", "chambermaid", "mayor", "virgin", "slayer",
    "butler", "saint", "recluse", "klutz",
    "scarletwoman", "baron", "eviltwin",
    "imp", "shabaloth", "po", "zombuul", "vortox", "pukka", "fanggu", "vigormortis",
  ],
  intro:
    "8인 게임, 3일차 아침. 낮1에 A가 사냥꾼임을 밝히며 C를 쐈고, C는 그 자리에서 죽었다. " +
    "마을은 악마를 잡았다고 믿었지만 밤2에 D가, 밤3에 A와 G가 죽었다. 낮2에는 처형이 없었다. " +
    "대본에는 암살자도 대부도 할머니도 땜장이도 없고, 주민을 사칭해 숨을 수 있는 역할(주정뱅이·광인·미치광이·건달)도 없다. " +
    "외지인을 주장한 사람은 C 하나뿐이었다.",
  claims: [
    { seat: 0, role: "slayer", info: [] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "recluse", info: [] },
    { seat: 3, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 4, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 3 } }] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [1, 3], shownRole: "chef" } }] },
    { seat: 6, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [5, 7], shownRole: "scarletwoman" } }] },
    {
      seat: 7, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [3, 4], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [0, 6], yes: false } },
        { night: 3, data: { type: "fortuneteller", targets: [1, 5], yes: false } },
      ],
    },
  ],
  events: [
    { type: "slayerShot", day: 1, seat: 0, target: 2, died: true },
    { type: "death", night: 2, seat: 3 },
    { type: "death", night: 3, seat: 0 },
    { type: "death", night: 3, seat: 6 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [4] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "shabaloth" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [5] },
  ],
  hints: [
    "사냥꾼의 총알이 맞은 것은 '악마로 등록된 사람'이지 반드시 악마인 것은 아니다.",
    "밤3의 두 죽음을 설명할 수 있는 악마가 몇이나 되는지 세어 보라. 그 답이 나머지를 전부 정한다.",
  ],
  walkthrough: [
    "① 총격이 명중했다는 사실은 세 가지를 한꺼번에 못박는다. **A는 진짜 사냥꾼이고**(허세로는 사람이 죽지 않는다), 그 낮에 멀쩡했으며, **C는 악마로 등록되어 있었다.** 그런데 그 뒤로도 사람이 죽었다.",
    "② 밤3에 두 사람이 한꺼번에 죽었다. 이 대본에는 암살자도 대부도 할머니도 땜장이도 소문꾼도 달의 자손도 없으니 두 죽음 모두 악마의 것이다. 한 밤에 둘을 죽일 수 있는 악마는 매밤 두 명을 고르는 **샤바로스**뿐이다 — 포가 셋을 고르는 밤은 '아무도 고르지 않은' 밤 다음에만 열리는데 밤2에는 D가 죽었다. 임프·좀부울·보르톡스·푸카·팡 구·비고르모르티스는 한 밤에 하나다.",
    "③ 악마가 샤바로스라면 구성은 8인 기본값 — 마을 주민 5, 외지인 1, 하수인 1, 악마 1이다(외지인을 줄이는 비고르모르티스도, 늘리는 팡 구도, 남작도 아니다). 외지인 자리는 정확히 하나인데 외지인을 주장한 사람은 C뿐이고, 주민을 사칭해 숨을 수 있는 역할은 대본에 없다. **C는 정직한 은둔자였다.**",
    "④ 은둔자는 악마로 등록될 수 있다 — 사냥꾼의 총알이 맞힌 것은 악마가 아니라 은둔자였다. 악마는 한 번도 죽지 않았으므로 이어받은 자도 없다. **지금도 처음의 그 악마가 살아 있다.**",
    "⑤ 점쟁이 H를 보자. 밤2 'A와 G 중 악마 없음', 밤3 'B와 F 중 악마 없음'. H가 정직하다면 악마는 A·B·F·G가 아니고, C는 은둔자이므로 남는 후보는 D·E·H다. D는 밤2에 죽었는데 샤바로스는 제 손으로 자신을 삼키지 않는다. **악마는 E 아니면 H다.**",
    "⑥ H가 악마라고 해 보자. 그러면 수사관 G의 '하수인은 F 아니면 H'에서 하수인은 F이고, 초공감자 B는 선하다. 그런데 B의 밤2 '이웃 중 악 1명'은 성립하지 않는다 — 밤2에 D가 죽어 B의 이웃은 A와 E가 되는데 그 둘은 이 가정에서 둘 다 선하다. **악마는 E다.**",
    "⑦ 하수인을 찾는다. 수사관 G에 따르면 F 아니면 H인데, H가 하수인이라면 초공감자 B의 밤3 이웃이 H와 E — 둘 다 악이 되어 '1'이 아니라 '2'여야 한다. **하수인은 F다.** 요리사 D의 '인접한 악역 쌍 하나'도 나란히 앉은 E·F를 가리키고, 시계공을 사칭한 E의 '세 자리'는 그 사이가 한 자리라는 사실과 어긋난다.",
    "⑧ 재구성: 샤바로스 E와 탕녀 F는 나란히 앉아 각각 시계공과 세탁부를 사칭했다. 마을은 가장 수상한 좌석 — 스스로 은둔자라 밝힌 C — 에 총을 쐈고, 은둔자가 악마로 등록되는 바람에 그가 정말 죽었다. 승리를 확신한 그날 밤부터 악마는 다시 손을 뻗었고, 마지막 밤에는 사냥꾼과 수사관을 한꺼번에 삼켰다.",
  ],
  solution: ["slayer", "empath", "recluse", "chef", "shabaloth", "scarletwoman", "investigator", "fortuneteller"],
});
