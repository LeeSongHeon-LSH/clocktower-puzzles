import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움 1: SV 논리 역할 혼합 스크립트 — 주장이 전부 쌍으로 겹친다.
// 점쟁이가 둘, 초공감자가 둘. 각 쌍에 악역이 하나씩 숨어 있다.
export default definePuzzle({
  id: "mx-01",
  title: "쌍둥이 마을",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 2,
  rolePool: [
    "imp", "poisoner",
    "clockmaker", "seamstress", "juggler",
    "fortuneteller", "empath",
  ],
  intro:
    "7인 혼합 스크립트, 2일차 아침. 어제는 처형이 없었고 밤사이 B가 죽었다. " +
    "시계공 A는 '악마와 하수인이 1칸 거리'라고 외쳤지만 아무도 믿지 않는 눈치다. " +
    "점쟁이 주장이 둘(C, F), 초공감자 주장도 둘(E, G). 외지인은 없다 — " +
    "겹치는 주장 쌍마다 거짓말쟁이가 하나씩 있다는 뜻이다. 독살범을 조심하라.",
  claims: [
    { seat: 0, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 1 } }] },
    { seat: 1, role: "seamstress", info: [{ night: 1, data: { type: "seamstress", targets: [4, 3], sameTeam: false } }] },
    {
      seat: 2, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [0, 5], yes: false } },
        { night: 2, data: { type: "fortuneteller", targets: [4, 6], yes: false } },
      ],
    },
    {
      seat: 3, role: "juggler", info: [
        {
          night: 2,
          data: {
            type: "juggler",
            guesses: [
              { seat: 0, role: "clockmaker" },
              { seat: 2, role: "poisoner" },
              { seat: 4, role: "seamstress" },
              { seat: 5, role: "fortuneteller" },
              { seat: 6, role: "empath" },
            ],
            correct: 3,
          },
        },
      ],
    },
    {
      seat: 4, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 0 } },
      ],
    },
    {
      seat: 5, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [2, 4], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [1, 4], yes: false } },
      ],
    },
    {
      seat: 6, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 0 } },
      ],
    },
  ],
  events: [{ type: "death", night: 2, seat: 1 }],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [2] },
    { id: "poisoner", text: "독살범은 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "주장이 겹치는 두 쌍 — 점쟁이(C·F), 초공감자(E·G) — 에 악역이 정확히 하나씩 있다. 즉 A·B·D는 선하다. 다만 독살범이 밤마다 한 명을 중독시킬 수 있다는 걸 잊지 마라.",
    "같은 밤에 '중독으로만 설명되는 거짓 정보'가 둘 이상 나오는 배치는 즉시 모순이다. 독은 밤마다 정확히 한 명이니까.",
  ],
  walkthrough: [
    "① 외지인이 없으므로 같은 역할을 주장하는 쌍마다 정확히 한 명이 악역이다. 악역은 둘뿐이니 점쟁이 쌍(C·F)에 하나, 초공감자 쌍(E·G)에 하나 — 그리고 A(시계공)·B(재봉사)·D(곡예사)는 전원 선하다.",
    "② 선한 두 밤1 정보부터: A의 '1스텝'이 정직하다면 악역 조합별 데몬-하수인 거리(C·E=2, C·G=3, F·E=1, F·G=1)에서 악역은 F를 포함해야 한다. B의 '(E·D) 다른 팀'이 정직하다면 D가 선하므로 E가 악역이다.",
    "③ A·B가 모두 정직하다고 하면 악역은 {F, E}다. 그러면 선한 곡예사 D의 실제 적중은 A·G 둘뿐(C는 점쟁이라 '독살범' 추측이 빗나가고, E·F 추측도 빗나간다)이라 '3'이 거짓 — 밤2 중독이 필요하다. 동시에 선한 초공감자 G의 밤2 '0'도 이웃 F(악) 탓에 거짓 — 역시 밤2 중독이 필요하다. 밤2의 독은 하나뿐이므로 모순. 즉 A·B 중 하나는 밤1에 중독됐다.",
    "④ B가 중독된 쪽이라 가정하면(A 정직) 악역은 {F,E} 또는 {F,G}다. 어느 배치를 골라도 — F가 임프면 C의 점쟁이 정보가, 아니면 D의 곡예사 적중 수와 G(또는 C)의 밤2 정보가 — 밤2에 중독이 두 건 필요해져 무너진다. 따라서 중독된 것은 A이고, B는 정직하다.",
    "⑤ B가 정직하므로 E는 악역이다(②). A는 중독됐으니 '1스텝'은 무시한다 — 남은 문제는 점쟁이 쌍 C·F 중 누가 악역인가.",
    "⑥ C가 선한 점쟁이라 가정하면: 악역은 {F, E}가 되는데 이는 ④에서 이미 죽은 배치다. 따라서 F가 진짜 점쟁이고 C가 악역 — 악역은 {C, E}로 확정된다.",
    "⑦ 데몬은 누구인가. 선한 점쟁이 F의 밤2 'B·E에 악마 없음'이 E를 지운다(밤1 독은 A에게 갔고 밤2 독이 F를 노렸다면 D의 '3'과 충돌한다). 따라서 C가 임프, E가 독살범이다. F의 밤1 'C·E에 있음'은 처음부터 임프 C를 가리키고 있었다.",
    "⑧ 재구성: 독살범 E는 밤1에 시계공 A를 중독시켜 '1스텝'(실제 C-E 거리는 2)이라는 헛소문을 만들었다. 임프 C는 밤2에 재봉사 B를 죽였다 — B의 가위질이 정확히 E를 가리켰기 때문이다. 곡예사 D는 C를 독살범으로 의심했지만, 그는 한 급 더 높은 놈이었다.",
  ],
  solution: ["clockmaker", "seamstress", "imp", "juggler", "poisoner", "fortuneteller", "empath"],
});
