import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 팡 구 — 외지인이 있을 수 없는 판에 정직한 외지인이 하나 앉아 있다.
// 좌석을 먼저 찾고, 그 좌석이 무슨 악마인지는 구성이 답한다.
export default definePuzzle({
  id: "mx-22",
  title: "일곱 개의 촛불",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 7,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 외지인 수를 건드리는 것은 남작(+2)과 팡 구(+1),
  // 비고르모르티스(−1)뿐이고 대부는 없다. 숨은 외지인이 될 수 있는 역할도 없다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "oracle", "mayor", "virgin", "slayer",
    "butler", "saint", "klutz",
    "scarletwoman", "baron", "devilsadvocate",
    "imp", "fanggu", "po", "shabaloth", "zombuul", "vortox", "vigormortis",
  ],
  intro:
    "7인 게임, 3일차 아침. 처형은 한 번도 없었고, 밤2에 G가, 밤3에 A가 죽었다. " +
    "대본에 독살범도 첩자도 은둔자도 없다 — 선한 사람의 말은 전부 참이고 등록도 흔들리지 않는다. " +
    "초공감자를 주장하는 사람이 둘이라는 것을 기억하라.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 1, role: "butler", info: [] },
    {
      seat: 2, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 3, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [1, 2], yes: true } }] },
    { seat: 4, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 2 } }] },
    {
      seat: 5, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 0 } },
        { night: 3, data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 6, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [0, 5], shownRole: "scarletwoman" } }] },
  ],
  events: [
    { type: "death", night: 2, seat: 6 },
    { type: "death", night: 3, seat: 0 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [3] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "fanggu" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [5] },
  ],
  hints: [
    "초공감자 둘 중 누가 진짜인지는 밤2에 갈린다. G가 죽으면서 한쪽의 이웃이 바뀌었다.",
    "좌석을 다 찾은 뒤에도 질문 하나가 남는다 — B가 정직한 집사라면, 7인 판의 외지인 자리는 대체 어디서 왔는가?",
  ],
  walkthrough: [
    "① 7인 기본 구성은 마을 주민 5, 외지인 0, 하수인 1, 악마 1이다. 대본에 독살범·첩자·은둔자가 없고 숨은 외지인이 될 수 있는 역할(주정뱅이·광인·미치광이·건달)도 없으니, **선한 좌석의 말은 전부 참**이고 악역은 정확히 둘이다.",
    "② C와 F가 둘 다 초공감자를 주장한다. 토큰은 하나뿐이니 한 명은 악역이다.",
    "③ 수사관 G가 선하다고 해 보자. 그러면 하수인은 A 아니면 F다. 여기서 C가 악역이라면 ②에 따라 C는 하수인이거나 악마인데, 하수인 자리는 A·F뿐이므로 C는 악마여야 한다. 그러면 하수인은 A 아니면 F이고, 시계공 E의 '악마와 하수인은 두 자리'가 하수인을 A로 못박는다(F는 C에서 세 자리다). 그런데 그 세계에서 F는 진짜 초공감자다 — 밤2에 G가 죽어 F의 이웃이 E와 **A**로 바뀌었으니 F의 밤2 값은 0이 아니라 1이어야 한다. 모순이다. **따라서 C가 진짜 초공감자이고 F가 악역이다.**",
    "④ 그러면 F는 악역인데, 악마일까 하수인일까. F가 악마라면 수사관 G의 '하수인은 A 아니면 F'에서 하수인은 A이고, 그때 초공감자 C는 선한데 그 밤1 '이웃 중 악 1명'이 깨진다 — C의 이웃 B와 D가 둘 다 선해지기 때문이다. **F는 하수인이다.**",
    "⑤ 시계공 E의 '악마와 하수인은 두 자리'에서 악마는 F에서 두 자리 떨어진 A 아니면 D다. A라면 다시 C의 밤1이 깨진다(이웃 B·D가 모두 선해진다). **악마는 D다.**",
    "⑥ 그러면 C의 이웃 중 악한 쪽은 D이고, B는 선하다. **B는 정직한 집사 — 즉 이 판에 외지인이 한 명 있다.**",
    "⑦ 7인 판의 외지인 자리는 0이다. 그것을 늘릴 수 있는 것은 대본에서 남작(+2)과 팡 구(+1)뿐인데(대부는 대본에 없다), 남작이라면 외지인이 둘이어야 하고 나머지 한 명이 숨을 자리가 없다 — 이 대본에는 주민을 사칭할 수 있는 주정뱅이도 광인도 미치광이도 없기 때문이다. 비고르모르티스는 오히려 외지인을 지운다. **남는 것은 팡 구 하나뿐이고, D가 그것이다.**",
    "⑧ 확인: 팡 구의 점프는 첫 **외지인** 킬에서 일어난다. D는 밤2에 수사관 G를, 밤3에 요리사 A를 골랐다 — 둘 다 마을 주민이라 점프는 아직 일어나지 않았고, 그래서 지금 이 순간의 악마도 여전히 D다. 선한 요리사 A의 '인접한 악역 쌍 0'도 떨어져 앉은 D와 F를 정확히 반영한다.",
    "⑨ 재구성: 팡 구 D는 점쟁이를 사칭하며 '집사 B와 초공감자 C 중에 악마가 있다'고 못을 박았고, 옆에서 탕녀 F가 초공감자를 사칭해 그 말을 받쳤다. 마을이 이틀 동안 아무도 처형하지 못한 것이 그 연극의 결과다. 정작 D가 지목한 B는 이 판에 외지인이 있다는 사실 자체로 악마의 종류를 알려 주고 있었다.",
  ],
  solution: ["chef", "butler", "empath", "fanggu", "clockmaker", "scarletwoman", "investigator"],
});
