import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 저글러 — 다섯을 찍어 넷을 맞혔다. 맞은 추측 하나가 악마의 종류를 대고,
// 틀린 하나는 거짓말쟁이가 아니라 자기 역할을 잘못 알고 있는 사람(주정뱅이)이다.
export default definePuzzle({
  id: "mx-26",
  title: "서리 내린 아침",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 8,
  nights: 2,
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "juggler", "oracle", "seamstress", "chambermaid",
    "monk", "soldier", "mayor", "virgin", "slayer",
    "butler", "drunk", "recluse", "saint", "klutz",
    "scarletwoman", "baron", "godfather", "devilsadvocate", "eviltwin",
    "imp", "zombuul", "po", "shabaloth", "vortox", "fanggu", "vigormortis",
  ],
  intro:
    "8인 게임, 2일차 아침. 낮1에 A가 저글러임을 밝히며 다섯 사람의 역할을 공개로 찍었고, " +
    "마을은 그 말을 믿지 않아 아무도 처형하지 않았다. 그리고 밤2에 D가 죽었다. " +
    "여덟 사람 중 외지인을 주장한 사람은 하나도 없다.",
  claims: [
    {
      seat: 0, role: "juggler", info: [
        {
          night: 2,
          data: {
            type: "juggler",
            guesses: [
              { seat: 1, role: "chef" },
              { seat: 2, role: "empath" },
              { seat: 3, role: "dreamer" },
              { seat: 6, role: "investigator" },
              { seat: 4, role: "imp" },
            ],
            correct: 4,
          },
        },
      ],
    },
    { seat: 1, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 2, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    {
      seat: 3, role: "dreamer", info: [
        { night: 1, data: { type: "dreamer", target: 5, goodRole: "washerwoman", evilRole: "baron" } },
        { night: 2, data: { type: "dreamer", target: 4, goodRole: "chef", evilRole: "baron" } },
      ],
    },
    {
      seat: 4, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [2, 6], yes: false } },
        { night: 2, data: { type: "fortuneteller", targets: [0, 5], yes: false } },
      ],
    },
    { seat: 5, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 3 } }] },
    { seat: 6, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [5, 7], shownRole: "scarletwoman" } }] },
    { seat: 7, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [2, 4], shownRole: "empath" } }] },
  ],
  events: [
    { type: "death", night: 2, seat: 3 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [4] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "imp" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [5] },
    { id: "drunk", text: "주정뱅이는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "저글러의 다섯 중 '틀린 하나'가 무엇인지를 두 갈래로 나눠 보라. 한쪽 갈래에서는 D가 진짜 몽상가여야 한다.",
    "여덟 자리에 외지인은 정확히 하나인데 아무도 외지인이라 말하지 않았다. 그 자리를 채울 수 있는 역할이 이 대본에 몇이나 있는가.",
  ],
  walkthrough: [
    "① 구성부터 본다. 8인 기본은 마을 주민 5, 외지인 1, 하수인 1, 악마 1이다. 그런데 외지인을 주장한 좌석이 하나도 없다. 은둔자·집사·성자·얼간이라면 스스로 밝혔을 테니, 그 자리를 채운 사람은 자기가 무엇인지 모르는 쪽이다 — 이 대본에서 주민을 사칭할 수 있는 외지인은 **주정뱅이 하나뿐**이다(광인도 미치광이도 건달도 없다). 취함의 원천도 그것뿐이다: 독살범·선원·여관주인·대신·스위트하트가 전부 대본 밖이다.",
    "② 악마 둘이 여기서 바로 떨어진다. 팡 구는 외지인을 하나 늘리는데 숨은 외지인은 한 명이 한계라 두 자리를 채울 수 없다. 보르톡스는 처형 없는 낮이 지나면 그 자리에서 악의 승리로 끝나는데, 낮1에는 아무도 처형되지 않았다.",
    "③ 저글러 A의 다섯 추측 중 넷이 맞았다 — 즉 **정확히 하나가 틀렸다**. 넷은 그 좌석이 스스로 말한 역할 그대로이고, 하나만 다르다: \"E는 임프\". (A 자신이 저글러가 아닐 가능성은 ⑨에서 닫는다.)",
    "④ \"E는 임프\"가 틀린 추측이라고 해 보자. 그러면 B·C·D·G 넷은 전부 맞았고, 특히 **D의 토큰은 진짜 몽상가**다. 취하게 할 수단이 없으니(①) D의 밤2 \"E는 요리사 아니면 남작\"은 참이어야 하는데, 요리사 토큰은 B가 갖고 있고 남작이 있으면 외지인이 둘 늘어 주정뱅이 하나로는 못 메운다. **모순이다 — E는 임프다.** 악마의 자리와 종류가 한 번에 정해졌다.",
    "⑤ 비고르모르티스 갈래도 여기서 죽는다. 그 악마는 외지인 자리를 없애 주정뱅이를 지우지만, 악마가 비고르모르티스라면 \"E는 임프\"가 틀린 추측이어야 하고 ④가 그 갈래를 이미 닫았다.",
    "⑥ 그러면 D의 밤2 진술은 거짓이고, ③의 '틀린 하나'가 바로 D다. 따라서 **B·C·G는 주장한 역할 그대로이고 멀쩡하다** — 이 셋의 정보는 전부 참으로 읽어도 된다.",
    "⑦ 수사관 G: 하수인은 F 아니면 H. 요리사 B: 인접해 앉은 악인 쌍이 하나 — 임프 E 옆에 악역이 앉아 있다는 뜻이다. H는 E와 붙어 있지 않고 F는 붙어 있다. **하수인은 F, 탕녀다.** 초공감자 C의 밤2 값도 이것을 받는다: 밤2에 D가 죽어 C의 이웃은 B와 E가 되고, 그중 악은 임프 E 하나다.",
    "⑧ 남은 것은 D의 정체다. 초공감자 C의 밤1 \"이웃 중 악 0\"에서 이웃은 B와 D였다 — **D는 악하지 않다.** 주장과 토큰이 다른데 악하지도 않은 좌석은 주정뱅이뿐이다. ①의 외지인 자리를 채운 사람이 D였다.",
    "⑨ 검산 — A가 진짜 저글러가 아니었다면? 수사관 G에 따르면 하수인은 F나 H이므로 A는 악마여야 한다. 그러면 초공감자 C의 밤2 \"이웃(B·E) 중 악 1\"을 채울 악역이 남지 않는다. C가 주정뱅이라 그 값이 헛것이라 해도, 이번엔 D가 온전한 몽상가가 되어 \"E는 요리사 아니면 남작\"이 참이어야 한다 — 요리사는 B이고 하수인은 F나 H다. 어느 쪽이든 막힌다.",
    "⑩ 재구성: D는 자기가 몽상가인 줄 알고 두 밤을 성실히 깨어났지만 술잔만 비웠다. 그가 밤2에 지목한 상대가 하필 진짜 임프 E였고, 술에 취한 그의 눈에는 그 자리가 요리사나 남작으로 보였다. 임프는 자기를 짚은 그 사람을 그 밤에 죽였다. 마을이 믿지 않았던 저글러의 외침만이 처음부터 정확했고, 시계공을 사칭한 탕녀 F는 악마와 자기 사이가 세 칸이라고 우겼지만 실제로는 바로 옆자리였다.",
  ],
  solution: ["juggler", "chef", "empath", "drunk", "imp", "scarletwoman", "investigator", "washerwoman"],
});
