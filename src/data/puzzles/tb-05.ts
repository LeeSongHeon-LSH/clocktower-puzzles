import { definePuzzle } from "@/lib/puzzles/schema";

// 보통 2: 남작 — 7인 판에 외지인은 0명이어야 한다. 그런데 처형된 '요리사'의 토큰이 주정뱅이였다.
// 보이는 외지인(은둔자) + 파낸 외지인(주정뱅이) = 남작의 존재 증명.
export default definePuzzle({
  id: "tb-05",
  title: "있어선 안 될 외지인",
  edition: "tb",
  difficulty: "normal",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "drunk", "recluse",
    "poisoner", "spy", "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 게임, 2일차 아침. 어제 낮, '인접한 악역 쌍이 둘이나 보인다'는 요리사 C의 수상한 정보에 " +
    "질린 마을이 C를 처형했고, 밤사이 B가 죽었다. " +
    "기본 구성이라면 7인 판에 외지인은 없다 — 그런데 E는 태연히 은둔자를 주장하고 있고, " +
    "장의사 A는 'C의 토큰은 주정뱅이였다'고 증언한다.",
  claims: [
    { seat: 0, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "drunk" } }] },
    { seat: 1, role: "librarian", info: [{ night: 1, data: { type: "librarian", targets: [2, 4], shownRole: "drunk" } }] },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 2 } }] },
    { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [6, 0], shownRole: "empath" } }] },
    { seat: 4, role: "recluse", info: [] },
    {
      seat: 5, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 2 } },
      ],
    },
    {
      seat: 6, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [3, 4], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [5, 0], yes: false } },
      ],
    },
  ],
  events: [
    { type: "execution", day: 1, seat: 2 },
    { type: "death", night: 2, seat: 1 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [3] },
    { id: "baron", text: "남작은 누구인가?", answerSeats: [5] },
    { id: "drunk", text: "주정뱅이는 누구였나?", answerSeats: [2] },
  ],
  hints: [
    "이 판의 외지인 수는 0명 아니면 2명이다 — 남작이 없으면 0, 있으면 2. '외지인 0명'이라 가정하고 요리사 C의 '2쌍' 정보를 설명할 수 있는지부터 따져보라.",
    "F의 초공감자 수치는 이웃(E·G)이 그대로인데 하룻밤 새 0에서 2로 뒤집혔다. 등록이 흔들릴 수 있는 건 은둔자 하나뿐이다 — 이 정보가 정직할 수 있는가?",
  ],
  walkthrough: [
    "① 이 스크립트에서 외지인 수는 남작의 유무로만 갈린다: 남작이 없으면 0명, 있으면 2명(은둔자+주정뱅이). '외지인 1명'은 불가능하다.",
    "② F의 초공감자 정보(밤1: 0 → 밤2: 2)는 정직할 수 없다. 이웃 E·G는 두 밤 모두 살아 있었는데, 0이려면 둘 다 선하게 등록되고 2려면 둘 다 악하게 등록되어야 한다. 등록이 흔들리는 것은 은둔자(E)뿐이고 G의 등록은 고정이므로 모순 — F는 악역이거나 주정뱅이다.",
    "③ 외지인이 0명이라 가정하면: 주정뱅이가 없으므로 F는 악역, 은둔자 주장 E도 사칭(악역)이라 악역은 {E, F}로 확정된다. 그럼 나머지 전원이 선하고 정직해야 하는데, 요리사 C의 '인접 악역 쌍 2'는 E(4)·F(5) 인접 쌍 하나뿐이라 거짓이 된다. 변명해줄 주정뱅이도 없으니 모순 — 외지인은 2명이다.",
    "④ 따라서 남작이 실존하고, 은둔자 E는 진짜이며(악역이 사칭했다면 외지인 수가 안 맞는다), 주정뱅이가 마을 주민 주장자 중에 숨어 있다.",
    "⑤ 사서 B의 'C 또는 E가 주정뱅이'에서 E는 은둔자이므로 C가 주정뱅이다 — 장의사 A의 '주정뱅이 토큰' 증언과 정확히 맞물린다. (B나 A가 악역인 배치는 끝까지 밀면 점쟁이의 밤2 정보나 밤2 사망과 충돌해 전부 무너진다 — 두 증언은 서로를 지지한다.)",
    "⑥ 주정뱅이 자리가 C로 찼으므로 ②의 F는 악역으로 확정. 남은 악역 한 명은 D 또는 G다. G가 악역이라면 선한 세탁부 D의 'G 또는 A가 초공감자'가 성립할 수 없다(G 악역, A는 장의사) — 따라서 악역은 {D, F}다.",
    "⑦ 선한 점쟁이 G의 밤2 'F·A에 악마 없음'에 의해 F는 악마가 아니다. 즉 D가 임프, F가 남작이다. G의 밤1 '있음'(D·E)은 처음부터 임프 D를 가리키고 있었다.",
    "⑧ 재구성: 남작 F는 초공감자를 사칭하며 앞뒤 안 맞는 수치를 던졌고, 임프 D는 세탁부를 사칭했다. 마을은 헛정보를 낸 취한 '요리사'를 처형했고, 임프는 외지인을 정확히 짚어낸 사서 B를 밤에 침묵시켰다.",
  ],
  solution: ["undertaker", "librarian", "drunk", "imp", "recluse", "baron", "fortuneteller"],
});
