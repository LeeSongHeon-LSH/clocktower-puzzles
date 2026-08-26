import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움 4: 부정한 여인 승계 — 임프는 확실히 처형됐다. 장의사도 확인했다.
// 그런데 사람이 계속 죽는다. 악마는 죽지 않았다. 옮겨갔을 뿐이다.
export default definePuzzle({
  id: "mx-04",
  title: "죽은 악마 만세",
  edition: "tb",
  difficulty: "hard",
  playerCount: 7,
  nights: 3,
  rolePool: [
    "imp", "scarletwoman",
    "undertaker", "washerwoman", "chef", "empath", "fortuneteller",
  ],
  intro:
    "7인 게임, 3일차 아침. 첫날 낮 마을은 B를 처형했고, 장의사 A가 확인했다: '임프였다!' " +
    "마을은 축배를 들었다 — 그러나 밤사이 F가 죽었다. 둘째 날 혼란 속에 마을은 요리사 G를 처형했고, " +
    "밤사이 이번엔 장의사 A가 죽었다. 점쟁이 주장이 둘(C, E)인데, E는 매일 밤 '있음'만 나온다며 " +
    "떨고 있다. 부정한 여인이 스크립트에 있다. 외지인은 없다.",
  claims: [
    { seat: 0, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "imp" } }] },
    { seat: 1, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [3, 6], shownRole: "empath" } }] },
    {
      seat: 2, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [1, 5], yes: false } },
        { night: 2, data: { type: "fortuneteller", targets: [0, 3], yes: false } },
        { night: 3, data: { type: "fortuneteller", targets: [3, 4], yes: true } },
      ],
    },
    {
      seat: 3, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    {
      seat: 4, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [1, 2], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [2, 6], yes: true } },
        { night: 3, data: { type: "fortuneteller", targets: [2, 0], yes: true } },
      ],
    },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 4], shownRole: "undertaker" } }] },
    { seat: 6, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 1 },
    { type: "death", night: 2, seat: 5 },
    { type: "execution", day: 2, seat: 6 },
    { type: "death", night: 3, seat: 0 },
  ],
  questions: [
    { id: "demon", text: "지금 이 순간, 악마는 누구인가?", answerSeats: [2] },
    { id: "imp", text: "처형된 최초의 임프는 누구였나?", answerSeats: [1] },
  ],
  hints: [
    "밤3에 A가 죽었다. A가 악역이라면 — 특히 A가 임프라면 — 그 죽음을 설명할 방법이 있는가? 승계 규칙(부정한 여인, 스타 패스)까지 따져보라.",
    "요리사의 '1쌍'은 처형 전 첫날 밤 정보다. 그때 악역 둘은 붙어 앉아 있었다 — 임프 B의 이웃을 보라.",
  ],
  walkthrough: [
    "① A가 악역이라고 가정해 보자. 외지인이 없으니 세탁부 주장 쌍 {B, F} 중에도 정확히 한 명이 악역이다 — 악역은 둘뿐이므로 악역 조합은 {A, B} 또는 {A, F}다. 어느 쪽이든 밤3의 'A 사망'이 설명되지 않는다: 임프가 A라면 자살(스타 패스)인데 승계할 하수인이 그 시점에 함께 죽어 있거나 처형돼 게임이 이미 끝났어야 하고, A가 하수인이라면 임프가 제 하수인을 죽인 셈이라 역시 월드가 성립하지 않는다. 따라서 A는 선하고 정직한 장의사다.",
    "② 정직한 장의사 A의 증언에 의해, 첫날 처형된 B의 토큰은 임프였다. 진짜 임프가 처형됐는데 게임이 계속됐다 — 튜즈베리에서 그 방법은 하나뿐이다: 처형 시점에 5인 이상 생존(7인 전원 생존)이었고 부정한 여인이 임프를 승계했다.",
    "③ B가 임프였으므로 세탁부 쌍 {B, F}의 악역 몫은 B가 채웠다. F는 진짜 세탁부다.",
    "④ 남은 것은 부정한 여인 한 명. 요리사 G가 처형됐지만 그의 밤1 정보는 유효하다 — G가 악역이라면 악역이 셋(B, G, +여인)이 되니 G도 선·정직이다. 요리사의 '인접 악역 쌍 1'은 밤1 기준으로 임프 B의 양옆(A 또는 C) 중 하나가 부정한 여인이라는 뜻이다. A는 ①에서 선함이 증명됐다 — 부정한 여인은 C다.",
    "⑤ 검증: 초공감자 D의 3밤 연속 '1'은 살아 있는 이웃 C(악)를 정확히 세고 있다. '점쟁이' E의 3연속 '있음'(B·C → C·G → C·A)의 공통분모도 C다 — E는 첫날 밤부터 답을 쥐고 있었지만, 그 대상이 매번 C였다는 걸 마을이 눈치채지 못했을 뿐이다. C의 점쟁이 주장은 진짜 점쟁이 E를 흐리기 위한 사칭이었다.",
    "⑥ 결론: 처형된 최초의 임프는 B, 그리고 지금 이 순간의 악마는 임프를 승계한 부정한 여인 C다. 마을은 악마를 죽였다 — 그리고 악마는 여전히 살아 있다.",
  ],
  solution: ["undertaker", "imp", "scarletwoman", "empath", "fortuneteller", "washerwoman", "chef"],
  currentDemonSeat: 2,
});
