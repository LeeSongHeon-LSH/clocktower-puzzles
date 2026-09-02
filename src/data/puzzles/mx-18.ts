import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: "외지인이 없다" — 구성상 외지인은 반드시 하나인데, 사서는 못 봤다고 한다.
// 은둔자라면 악으로 등록되어 숨을 수 있지만 집사에게는 그런 여지가 없다.
export default definePuzzle({
  id: "mx-18",
  title: "여덟 자리의 사흘",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 8,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 악마가 다섯 종류이므로 '누구인가'와 함께 '무엇인가'도 물어야 한다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "clockmaker", "dreamer", "oracle", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp", "zombuul", "vortox", "fanggu", "vigormortis",
  ],
  intro:
    "8인 게임, 3일차 아침. 낮1에 A가 처형됐고, 밤2에 H가, 밤3에 F가 죽었다. " +
    "초공감자를 주장하는 사람이 둘이고, 대본의 악마는 다섯 종류다. " +
    "이 대본에는 주정뱅이도 광인도 미치광이도 독살범도 없다 — 선한 사람의 정보는 예외 없이 참이다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 1, role: "butler", info: [] },
    { seat: 2, role: "librarian", info: [{ night: 1, data: { type: "librarian", targets: null } }] },
    { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    {
      seat: 4, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 6], shownRole: "chef" } }] },
    { seat: 6, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "chef" } }] },
    { seat: 7, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [3, 5], shownRole: "scarletwoman" } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 0 },
    { type: "death", night: 2, seat: 7 },
    { type: "death", night: 3, seat: 5 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [2] },
    { id: "imp", text: "이 판의 악마는 임프다. 그 좌석을 고르라", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "8인 판에 외지인은 몇 명인가. 그리고 이 대본에 자기 정체를 모르거나 감출 수 있는 외지인이 있는가?",
    "은둔자는 악한 역할로 등록되어 사서의 눈을 피할 수 있다. 집사에게도 그런 여지가 있는가?",
  ],
  walkthrough: [
    "① 8인 구성에는 외지인이 정확히 1명 있다. 그리고 이 대본에는 주정뱅이·광인·미치광이·건달이 없다 — 자기 정체를 모르거나 감추는 외지인이 하나도 없으므로, 이 판의 외지인은 스스로 밝힐 수밖에 없다.",
    "② 외지인을 주장한 사람은 B(집사) 하나뿐이다. 따라서 B가 진짜 집사이고, 외지인 한 자리는 B가 채운다.",
    "③ 그런데 사서를 주장한 C는 '외지인이 없다'고 했다. 이 정보가 참이려면 아무도 외지인으로 보이지 않아야 한다. 은둔자였다면 악한 역할로 등록되어 사서의 눈을 피할 수 있었겠지만, 집사에게는 그런 여지가 없다 — 멀쩡한 사서라면 B를 보았어야 한다.",
    "④ 이 대본에는 주정뱅이도 독살범도 없으니 틀린 정보를 변명할 길이 없다. C는 악역이다.",
    "⑤ D와 E가 모두 초공감자를 주장한다 — 토큰은 하나뿐이니 한 명은 악역이다. 악역은 둘뿐이고 그중 하나가 C이므로, 나머지 하나는 D 아니면 E다. 따라서 A·B·F·G·H는 전부 선하고 정직하다.",
    "⑥ 선한 수사관 H의 '탕녀는 D 또는 F'에서 F는 세탁부이므로 D가 탕녀다. 그러면 E가 진짜 초공감자이고, 남은 C가 악마다.",
    "⑦ 악마의 종류도 기록이 정한다. 좀부울이라면 낮1에 처형 사망이 있었으므로 밤2에 아예 깨어나지 못해 H가 죽을 수 없다. 보르톡스라면 처형 없는 낮2를 넘기는 순간 게임이 끝났어야 한다. 팡 구는 외지인을 하나 늘리고 비고르모르티스는 하나 줄이는데, 이 판의 외지인은 B 한 명으로 이미 딱 맞는다. 남는 것은 임프뿐이다.",
    "⑧ 확인: 선한 요리사 A의 '인접 악역 쌍 1'은 나란히 앉은 C와 D를 가리키고, 선한 세탁부 F의 'A 또는 G가 요리사'와 선한 장의사 G의 '처형된 A의 토큰은 요리사'가 서로를 받쳐 준다. 선한 초공감자 E의 세 밤 연속 1은 이웃에 있는 탕녀 D를 계속 세고 있었다.",
    "⑨ 재구성: 임프 C는 사서를 사칭하며 '외지인은 없다'고 단언했다. 판을 정리해 주는 듯한 그 한마디가 스스로를 무너뜨렸다 — 여덟 자리에 외지인은 반드시 하나 있고, 그것을 숨겨 줄 수 있는 외지인은 이 대본에 없었다.",
  ],
  solution: ["chef", "butler", "imp", "scarletwoman", "empath", "washerwoman", "undertaker", "investigator"],
});
