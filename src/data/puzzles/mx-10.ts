import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 건달 — 자기를 고른 첫 사람이 취하고, 건달은 그 사람의 진영이 된다.
// 악마가 건달을 고르면 악마 자신이 취해 아무도 죽지 않는다.
export default definePuzzle({
  id: "mx-10",
  title: "세 밤을 지나",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 8,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "chambermaid", "oracle", "clockmaker", "mayor",
    "goon", "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp", "vortox", "zombuul", "vigormortis",
  ],
  intro:
    "8인 게임, 3일차 아침. 낮1에 F가 처형됐고 밤2에 H가 죽었다. 그리고 밤3에는 아무 일도 없었다. " +
    "C는 자기가 건달이라고 밝혔다 — 매일 밤 자기를 고른 첫 사람을 취하게 만들고, " +
    "그 사람의 진영이 되어 버리는 외지인이다. " +
    "이 대본에 군인도 수도사도 구마사제도 독살범도 없다는 것을 기억하라.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 0 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "goon", info: [] },
    { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [1, 6], shownRole: "scarletwoman" } }] },
    { seat: 4, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 6], shownRole: "chef" } }] },
    {
      seat: 6, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [3, 4], yes: true } },
        { night: 3, data: { type: "fortuneteller", targets: [0, 4], yes: false } },
      ],
    },
    { seat: 7, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [3, 4], shownRole: "scarletwoman" } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 5 },
    { type: "death", night: 2, seat: 7 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [3] },
    { id: "imp", text: "이 판의 악마는 임프다. 그 좌석을 고르라", answerSeats: [3] },
    { id: "goon", text: "건달은 누구인가?", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "B의 이웃은 세 밤 내내 A와 C로 똑같았다. 그런데 수치만 뒤집혔다면, 이웃 중 하나가 '바뀐' 것이다.",
    "밤3이 조용했던 이유를 대본에서 찾아보라. 킬을 막을 수 있는 역할을 전부 지우고 나면 무엇이 남는가?",
  ],
  walkthrough: [
    "① 밤3에 아무도 죽지 않았다. 이 대본에는 군인·수도사·구마사제·찻집 여인·선원·여관주인·어릿광대·독살범이 없다. 악마의 킬이 실패할 수 있는 길은 하나뿐이다 — 악마가 건달을 골랐고, 고르는 순간 스스로 취해 버린 것이다.",
    "② 그 대가로 건달은 자기를 고른 사람의 진영이 된다. 악마가 골랐으니 건달 C는 밤3부터 악하다.",
    "③ 초공감자 B의 수치가 정확히 그 이야기를 한다. B의 이웃은 A와 C뿐이고 셋 다 세 밤 내내 살아 있었는데, 수치가 0·0·1로 바뀌었다. 죽음도 자리 이동도 없이 이웃의 진영만 바뀔 수 있는 것은 건달뿐이다.",
    "④ 이제 악역을 찾는다. 수사관을 주장하는 사람이 둘(D, H), 요리사를 주장하는 사람도 둘(A, E)이다. 각 쌍에서 적어도 하나가 악역인데 악역은 둘(하수인 1, 악마 1)뿐이므로 각 쌍에서 정확히 하나씩이고 — 나머지 B·C·F·G는 전부 선하다.",
    "⑤ 선한 점쟁이 G의 밤1 'D·E 중 악마 있음'과 밤3 'A·E 중 악마 없음'을 겹치면 E는 악마가 아니다. 따라서 악마는 D다.",
    "⑥ ④에 의해 수사관 쌍의 악역이 D로 정해졌으므로 H가 진짜 수사관이고, 그 정보 '탕녀는 D 또는 E'에서 D는 임프이므로 E가 탕녀다. 요리사 쌍의 악역도 E로 맞아떨어진다.",
    "⑦ 확인: 선한 세탁부 F의 'A 또는 G가 요리사'에서 G는 점쟁이이므로 A가 진짜 요리사이고, 선한 요리사 A의 '인접 악역 쌍 1'은 나란히 앉은 D와 E를 가리킨다.",
    "⑧ 악마의 종류도 죽음의 기록이 정한다. 좀부울이라면 낮1에 처형 사망이 있었으니 밤2에 깨어나지 못해 H가 죽을 수 없다. 보르톡스라면 처형 없는 낮2를 넘기는 순간 게임이 끝났어야 한다. 비고르모르티스라면 외지인이 한 명 줄어 스스로 건달을 밝힌 C의 자리가 사라진다. 남는 것은 임프뿐이다.",
    "⑨ 재구성: 임프 D는 밤2에 자신을 지목한 진짜 수사관 H를 침묵시켰다. 그러나 밤3에 건달 C를 고른 순간 스스로 취해 아무도 죽이지 못했고, 대신 C를 자기 편으로 끌어들였다 — 조용한 밤과 초공감자의 뒤집힌 수치는 같은 사건의 앞뒤였다.",
  ],
  solution: ["chef", "empath", "goon", "imp", "scarletwoman", "washerwoman", "fortuneteller", "investigator"],
});
