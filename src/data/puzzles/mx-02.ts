import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움 2: 수학자 — "어젯밤 능력이 이상하게 작동한 사람은 정확히 1명이다."
// 수학자 주장이 둘, 요리사 주장도 둘. 그리고 점쟁이는 자기 말을 뒤집었다.
export default definePuzzle({
  id: "mx-02",
  title: "숫자는 거짓말하지 않는다",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper", "clockmaker", "seamstress", "juggler", "mathematician", "chambermaid",
    "drunk", "recluse",
    "poisoner", "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 혼합 스크립트, 2일차 아침. 어제는 처형이 없었고 밤사이 D가 죽었다. " +
    "수학자 A는 '밤1엔 한 명의 능력이 비정상이었고, 밤2엔 전원 정상'이라 말한다. " +
    "또 다른 수학자 E는 '두 밤 모두 전원 정상'이라 우긴다. " +
    "초공감자 B는 첫날 '양옆이 모두 악하다'고 외쳤다가 오늘 '한 명'으로 정정했고, " +
    "점쟁이 F는 어제 'E나 B 쪽에 악마가 있다'더니 오늘은 'C·G는 깨끗하다'고 한다. 외지인은 없다.",
  claims: [
    {
      seat: 0, role: "mathematician", info: [
        { night: 1, data: { type: "mathematician", count: 1 } },
        { night: 2, data: { type: "mathematician", count: 0 } },
      ],
    },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 2 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [5, 0], shownRole: "fortuneteller" } }] },
    {
      seat: 4, role: "mathematician", info: [
        { night: 1, data: { type: "mathematician", count: 0 } },
        { night: 2, data: { type: "mathematician", count: 0 } },
      ],
    },
    {
      seat: 5, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [4, 1], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [2, 6], yes: false } },
      ],
    },
    { seat: 6, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
  ],
  events: [{ type: "death", night: 2, seat: 3 }],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [4] },
    { id: "poisoner", text: "독살범은 누구인가?", answerSeats: [2] },
  ],
  hints: [
    "수학자 쌍(A·E)과 요리사 쌍(C·G)에 악역이 하나씩이다 — 그러니 B·D·F는 선하다. 그리고 B의 이웃은 두 밤 모두 A와 C였다(죽은 D는 B의 이웃이 아니다).",
    "진짜 수학자의 숫자는 '그 밤에 중독된 채 깨어난 사람 수'다. B가 어느 밤에 중독됐는지가 모든 것을 결정한다.",
  ],
  walkthrough: [
    "① 외지인이 없으므로 같은 역할 주장 쌍마다 정확히 한 명이 악역이다. 수학자 쌍 {A, E}에 하나, 요리사 쌍 {C, G}에 하나 — 악역은 둘뿐이니 B·D·F는 선하고 정직하다.",
    "② 선한 초공감자 B의 이웃은 두 밤 모두 A와 C다. '밤1: 2명 → 밤2: 1명'은 등록이 고정된 이 스크립트에서 동시에 참일 수 없다(은둔자·첩자 없음). 즉 B는 어느 한 밤 중독됐다.",
    "③ B의 밤1 '2'가 참이라 가정하면 A·C가 모두 악역이고(각 쌍에서 하나씩 — 규칙과도 맞다), 밤2의 '1'이 거짓이므로 밤2 독은 B에게 가야 한다. 그러면 진짜 수학자 E의 밤2 '0'이 무너진다 — 중독된 B가 밤2에 깨어나므로 최소 1이어야 하니까. 모순 — B는 밤1에 중독됐다.",
    "④ 따라서 밤2의 '1'이 진실이다: 이웃 A·C 중 정확히 한 명이 악역이다.",
    "⑤ 수학자 쌍을 보자. E가 진짜 수학자라면 밤1 '0'을 말한 셈인데, 밤1엔 중독된 B가 깨어났으므로 실제 값은 최소 1이다. 모순 — A가 진짜 수학자이고 E가 악역이다. 실제로 A의 밤1 '1'은 B의 중독과 정확히 맞아떨어진다.",
    "⑥ A가 선하므로 ④에 의해 C가 악역이다. 악역은 {C, E}로 확정 — G는 진짜 요리사였다.",
    "⑦ 데몬은 누구인가. 진짜 수학자 A의 밤2 '0'은 '밤2에 중독된 채 깨어난 사람이 없다'는 뜻이다. 점쟁이 F는 밤2에 깨어났으므로 중독됐을 수 없다 — 즉 F의 밤2 'C·G에 악마 없음'은 정직하다. C는 악마가 아니다. 따라서 C가 독살범, E가 임프다.",
    "⑧ 재구성: 밤1 — 독살범 C가 이웃 B를 중독시켜 '양옆이 다 악하다'는 소동을 일으켰다. 밤2 — C의 독은 곧 임프에게 살해될 세탁부 D에게 낭비됐고(그래서 수학자의 밤2가 '0'이다), 임프 E는 D를 죽였다. F의 밤1 'E·B 쪽 있음'은 처음부터 임프 E를 가리키고 있었다.",
  ],
  solution: ["mathematician", "empath", "poisoner", "washerwoman", "imp", "fortuneteller", "chef"],
});
