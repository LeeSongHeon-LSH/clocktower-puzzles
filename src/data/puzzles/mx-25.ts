import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 처단자가 악마로 등록된 은둔자를 맞혔다 — 마을은 이겼다고 믿었지만 악마는 그대로다.
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
    "8인 게임, 3일차 아침. 낮1에 A가 처단자임을 밝히며 C를 쐈고, C는 그 자리에서 죽었다. " +
    "마을은 악마를 잡았다고 믿었지만 밤2에 D가, 밤3에 A와 G가 죽었다. 낮2에는 처형이 없었다. " +
    "대본에는 암살자도 대부도 할머니도 땜장이도 없고, 주민을 사칭해 숨을 수 있는 역할(주정뱅이·변종·미치광이·건달)도 없다. " +
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
    { seat: 4, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 4 } }] },
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
    "처단자의 총알이 맞은 것은 '악마로 등록된 사람'이지 반드시 악마인 것은 아니다.",
    "밤3의 두 죽음을 설명할 수 있는 악마가 몇이나 되는지 세어 보라. 그 답이 나머지를 전부 정한다.",
  ],
  walkthrough: [
    "① 총격이 명중했다는 사실은 세 가지를 한꺼번에 못박는다. **A는 진짜 처단자이고**(허세로는 사람이 죽지 않는다), 그 낮에 멀쩡했으며, **C는 악마로 등록되어 있었다.** 그런데 그 뒤로도 사람이 죽었다.",
    "② 밤3에 두 사람이 한꺼번에 죽었다. 이 대본에는 암살자도 대부도 할머니도 땜장이도 험담꾼도 달의 자손도 없으니 두 죽음 모두 악마의 것이다. 한 밤에 둘을 죽일 수 있는 악마는 매밤 두 명을 고르는 **샤발로스**뿐이다 — 포가 셋을 고르는 밤은 '아무도 고르지 않은' 밤 다음에만 열리는데 밤2에는 D가 죽었다. 임프·좀버얼·보르톡스·푸카·팡 구·비고르모르티스는 한 밤에 하나다.",
    "③ 악마가 샤발로스라면 구성은 8인 기본값 — 마을 주민 5, 외지인 1, 하수인 1, 악마 1이다(외지인을 줄이는 비고르모르티스도, 늘리는 팡 구도, 남작도 아니다). 외지인 자리는 정확히 하나인데 외지인을 주장한 사람은 C뿐이고, 주민을 사칭해 숨을 수 있는 역할은 대본에 없다. **C는 정직한 은둔자였다.**",
    "④ 은둔자는 악마로 등록될 수 있다 — 처단자의 총알이 맞힌 것은 악마가 아니라 은둔자였다. 악마는 한 번도 죽지 않았으므로 이어받은 자도 없다. **지금도 처음의 그 악마가 살아 있다.**",
    "⑤ 시계공을 자처한 E의 '네 칸'을 보자. 8인 원탁에서 네 칸은 정확히 **맞은편**이다 — E가 진짜라면 악마와 그 가장 가까운 하수인(은둔자 C가 그중 하나로 등록됐을 수도 있다)이 마주 앉아야 한다. 마주 앉은 쌍은 A–E, B–F, C–G, D–H 넷뿐이고, A와 E는 이 가정에서 둘 다 선하니 셋이 남는다.",
    "⑥ **D–H**: D는 밤2에 악마에게 죽었으니 하수인, H가 악마다. 그러면 초공감자 B는 선한데 밤2엔 이웃 C·D가 죽어 B의 이웃이 A·E — 둘 다 선하니 '악 1명'이 불가능하다. **C–G**: C는 은둔자라 진짜 악이 아니다 — G가 악마면 진짜 하수인이, G가 하수인이면 악마가 맞은편 C에 앉아야 하는데 어느 쪽도 아니다. **B–F**: 악이 B·F로 끝나 점쟁이 H는 선한데, H의 밤3 'B·F 중 악마 없음'이 악마 B와 어긋난다. **E는 거짓말을 하고 있고, 곧 악이다.**",
    "⑦ E가 하수인(탕녀)이라 해 보자. 수사관 G가 악이라면 악은 E·G 둘인데, G는 밤3에 악마에게 죽었으니 악마가 아니라 하수인 — 하수인이 둘이 되어 8인 구성과 어긋난다. 그러므로 G는 선하고, G의 '탕녀는 F 아니면 H'에 따라 탕녀는 E가 아니다. **E는 악마다.** 점쟁이 H의 밤1 'D와 E 중 악마 있음'과도 맞아떨어진다.",
    "⑧ 하수인을 찾는다. 수사관 G에 따르면 F 아니면 H인데, H가 하수인이라면 초공감자 B는 선하고, 밤3에 A·C·D가 죽어 B의 살아 있는 이웃은 H와 E — 둘 다 악이 되어 '1'이 아니라 '2'여야 한다. **하수인은 F다.** 요리사 D의 '인접한 악역 쌍 하나'도 나란히 앉은 E·F를 가리킨다.",
    "⑨ 재구성: 샤발로스 E와 탕녀 F는 나란히 앉아 각각 시계공과 세탁부를 사칭했다. 마을은 가장 수상한 좌석 — 스스로 은둔자라 밝힌 C — 에 총을 쐈고, 은둔자가 악마로 등록되는 바람에 그가 정말 죽었다. 승리를 확신한 그날 밤부터 악마는 다시 손을 뻗었고, 마지막 밤에는 처단자와 수사관을 한꺼번에 삼켰다.",
  ],
  solution: ["slayer", "empath", "recluse", "chef", "shabaloth", "scarletwoman", "investigator", "fortuneteller"],
});
