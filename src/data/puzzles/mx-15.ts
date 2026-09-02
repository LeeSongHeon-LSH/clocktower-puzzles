import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 노 다시 — 선한 사람 둘이 동시에 틀렸다.
// 한 밤에 두 명을 중독시킬 수 있는 악마는 하나뿐이고, 그 둘은 악마의 양옆이다.
export default definePuzzle({
  id: "mx-15",
  title: "양옆이 함께 틀렸다",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 악마가 세 종류이므로 '누구인가'와 함께 '무엇인가'도 물어야 한다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "clockmaker", "dreamer", "oracle", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp", "nodashii", "vigormortis",
  ],
  intro:
    "7인 게임, 2일차 아침. 처형은 없었고 밤사이 G가 죽었다. " +
    "초공감자를 주장하는 사람이 둘, 시계공을 주장하는 사람도 둘이다. " +
    "이 대본의 악마는 임프·노 다시·비고르모르티스 셋 중 하나이고, 주정뱅이도 독살범도 없다.",
  claims: [
    { seat: 0, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 1, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 1 } }] },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 3, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 3 } }] },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 3], shownRole: "empath" } }] },
    { seat: 5, role: "empath", info: [{ night: 1, data: { type: "empath", count: 1 } }] },
    {
      seat: 6, role: "dreamer", info: [
        { night: 1, data: { type: "dreamer", target: 5, goodRole: "empath", evilRole: "scarletwoman" } },
        { night: 2, data: { type: "dreamer", target: 1, goodRole: "clockmaker", evilRole: "nodashii" } },
      ],
    },
  ],
  events: [{ type: "death", night: 2, seat: 6 }],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [1] },
    { id: "nodashii", text: "이 판의 악마는 노 다시다. 그 좌석을 고르라", answerSeats: [1] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [5] },
  ],
  hints: [
    "같은 역할 주장이 두 쌍이면 악역 자리는 이미 다 찬 것이다. 어느 좌석이 확실히 선한지부터 적어 두라.",
    "시계공의 수치는 악마와 하수인 사이의 거리다. 후보를 하나씩 앉혀 보고 거리를 세면 한쪽이 무너진다.",
  ],
  walkthrough: [
    "① 초공감자를 주장하는 사람이 둘(A, F), 시계공을 주장하는 사람도 둘(B, D)이다. 각 쌍에서 적어도 하나가 악역인데 악역은 둘뿐이므로 각 쌍에서 정확히 하나씩이고 — 나머지 C·E·G는 전부 선하다.",
    "② 선한 세탁부 E의 'A 또는 D가 초공감자'를 보자. D가 악역이면 D는 초공감자가 아니고, D가 선하면 D는 자기 주장대로 시계공이다. 어느 쪽이든 초공감자는 A다 — A는 선하고, 따라서 ①의 초공감자 쌍에서 악역은 F다.",
    "③ 선한 몽상가 G의 밤1 'F는 초공감자이거나 탕녀'에서 F는 악역이므로 탕녀다.",
    "④ 그러면 남은 악역, 곧 악마는 시계공 쌍(B, D)에서 나온다. 선한 몽상가 G의 밤2 'B는 시계공이거나 노 다시'가 이 둘을 가른다.",
    "⑤ D가 악마라고 하자. 그러면 B는 선한 시계공이고 그 '거리 1'이 참이어야 한다. 악마 D와 탕녀 F 사이는 두 자리이므로 거짓 — 모순이다. 따라서 악마는 B이고, ④에 의해 노 다시다.",
    "⑥ 이제 A와 C의 정보를 다시 보자. 선한 초공감자 A의 '이웃에 악 0명'은 이웃 B가 악마이므로 거짓이고, 선한 요리사 C의 '인접 악역 쌍 1'도 거짓이다 — 악마 B와 탕녀 F는 떨어져 앉아 있다.",
    "⑦ 이 대본에는 주정뱅이도 독살범도 없다. 선한 사람 둘이 같은 밤에 틀리려면 악마가 직접 둘을 중독시켰어야 하고, 그럴 수 있는 악마는 노 다시뿐이다 — 자기 양옆의 가장 가까운 마을 주민 둘을 계속 중독시킨다. B의 양옆이 바로 A와 C다.",
    "⑧ 확인: 선한 시계공 D의 '거리 3'은 악마 B와 탕녀 F 사이가 세 자리라는 뜻이고 실제로 그렇다. 두 사람이 나란히 틀렸다는 사실 자체가 악마의 자리를 가리키고 있었다.",
  ],
  solution: ["empath", "nodashii", "chef", "clockmaker", "washerwoman", "scarletwoman", "dreamer"],
});
