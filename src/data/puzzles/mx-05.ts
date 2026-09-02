import { definePuzzle } from "@/lib/puzzles/schema";

// 쉬움: 시계공과 몽상가 — 좌석 사이의 '거리'와 '둘 중 하나'라는 두 종류의 정보만으로
// 6인 판의 악마를 짚어낸다. 거짓말을 변명해 줄 술도 독도 이 대본에는 없다.
export default definePuzzle({
  id: "mx-05",
  title: "시계는 하나를 가리킨다",
  edition: "mixed",
  difficulty: "easy",
  playerCount: 6,
  nights: 1,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "clockmaker", "dreamer", "oracle", "seamstress",
    "empath", "chef", "washerwoman", "investigator", "fortuneteller",
    "butler", "recluse", "saint",
    "scarletwoman", "baron",
    "imp",
  ],
  intro:
    "6인 게임의 첫날 아침. 아무도 죽지 않았고 전원이 정보를 공개했다. " +
    "6인 구성에는 외지인이 정확히 1명 있고, 이 대본에는 주정뱅이도 독살범도 첩자도 없다 — " +
    "선한 사람이 낸 정보는 예외 없이 참이다. 거짓말을 하고 있는 사람은 악역뿐이다.",
  claims: [
    { seat: 0, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 1 } }] },
    { seat: 1, role: "dreamer", info: [{ night: 1, data: { type: "dreamer", target: 3, goodRole: "chef", evilRole: "imp" } }] },
    { seat: 2, role: "butler", info: [] },
    { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [1, 5], shownRole: "baron" } }] },
    { seat: 4, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 5, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
  ],
  events: [],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [3] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "몽상가 B의 정보는 '넷 중 하나'가 아니라 '둘 중 하나'다. D는 요리사이거나 임프이고, 그 사이에 다른 선택지는 없다.",
    "E가 진짜 초공감자라면 이웃 D와 F가 모두 선해야 한다. 그 가정을 밀고 나가면 요리사 토큰이 어디로 가는지 보라.",
  ],
  walkthrough: [
    "① 이 대본에는 주정뱅이·독살범·첩자가 없다. 선하고 살아 있는 사람의 정보는 반드시 참이고, 틀린 정보를 낸 사람은 그 자체로 악역이다.",
    "② 몽상가 B의 정보는 'D는 요리사이거나 임프다'로 좁혀 준다. 그런데 D는 스스로 수사관을 주장하고 있다 — 셋 중 어느 것도 아닐 수는 없으므로, B가 선하다면 D의 수사관 주장은 거짓이다.",
    "③ E가 진짜 초공감자라고 하자. '이웃에 악 0명'은 D와 F가 모두 선하다는 뜻이다. 그러면 ②의 D는 요리사여야 하는데, F도 요리사를 주장하고 있고 F는 선하다 — 요리사 토큰이 둘이 되어 모순이다. 따라서 E가 악역이다.",
    "④ 6인 구성의 악역은 둘(하수인 1, 악마 1)이다. E가 그중 하나다.",
    "⑤ 선한 요리사 F의 '인접 악역 쌍 1'이 성립하려면 두 악역이 나란히 앉아야 한다. E(5번째 자리)의 이웃은 D와 F뿐인데 F는 요리사로 선하므로, 나머지 악역은 D다.",
    "⑥ ②에 의해 D는 요리사이거나 임프인데 ⑤에서 D는 악역이므로 — D가 임프다. 따라서 E는 탕녀다.",
    "⑦ 확인: 시계공 A의 '거리 1'은 악마 D와 가장 가까운 하수인 사이의 간격이 한 자리라는 뜻이고, D(4번째 자리)와 E(5번째 자리)는 실제로 이웃이다. 6인의 외지인 한 자리는 스스로 집사를 밝힌 C가 채운다. 임프 D는 수사관을 사칭해 선한 B와 F를 물고 늘어졌지만, 정작 자신을 지목한 몽상가의 한 문장을 지우지는 못했다.",
  ],
  solution: ["clockmaker", "dreamer", "butler", "imp", "scarletwoman", "chef"],
});
