import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 사냥꾼 허세 — 낮에 총을 쏜 사람이 진짜 사냥꾼이라는 보장은 없다.
// 총알이 빗나간 이유는 대상이 선해서가 아니라, 쏜 사람에게 애초에 능력이 없어서였다.
export default definePuzzle({
  id: "tb-08",
  title: "빈 총을 쏜 사람",
  edition: "tb",
  difficulty: "normal",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "monk", "ravenkeeper", "virgin", "slayer", "soldier", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 게임, 2일차 아침. 어제 낮 A가 '나는 사냥꾼이다'라며 F를 쏘았지만 아무 일도 일어나지 않았고, " +
    "마을은 그 뒤 D를 처형했다. 밤사이 B가 죽었다. " +
    "그런데 사냥꾼을 주장하는 사람도 둘, 초공감자를 주장하는 사람도 둘이다.",
  claims: [
    { seat: 0, role: "slayer", info: [] },
    { seat: 1, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 2, role: "slayer", info: [] },
    { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    {
      seat: 4, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [2, 6], shownRole: "slayer" } }] },
    { seat: 6, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "scarletwoman" } }] },
  ],
  events: [
    { type: "slayerShot", day: 1, seat: 0, target: 5, died: false },
    { type: "execution", day: 1, seat: 3 },
    { type: "death", night: 2, seat: 1 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [0] },
    { id: "slayer", text: "진짜 사냥꾼은 누구인가?", answerSeats: [2] },
  ],
  hints: [
    "같은 역할을 주장하는 쌍이 둘이나 있다. 각 쌍에서 한 명씩 거짓말쟁이가 나온다면 악역 자리는 이미 다 찬 셈이다 — 나머지 좌석에 대해 무엇을 말할 수 있는가?",
    "총이 빗나간 데에는 두 가지 설명이 있다. 대상이 악마가 아니었거나, 쏜 사람이 사냥꾼이 아니었거나. 이 대본에 독살범이 없다는 점을 기억하라.",
  ],
  walkthrough: [
    "① 사냥꾼을 주장하는 사람이 둘(A, C)이고, 초공감자를 주장하는 사람도 둘(D, E)이다. 같은 역할 토큰은 판에 하나뿐이므로 각 쌍에서 적어도 한 명은 거짓을 말하고 있다. 이 대본에는 주정뱅이도 독살범도 없으므로 '틀린 주장 = 악역'이다.",
    "② 악역은 둘뿐이다. 그 둘이 {A, C}에서 하나, {D, E}에서 하나씩 나오므로 — 나머지 좌석 B·F·G는 전부 선하고 정직하다.",
    "③ 선한 장의사 G의 밤2 증언에 따라, 어제 처형된 D의 토큰은 탕녀였다. D가 하수인이고, 따라서 E가 진짜 초공감자다.",
    "④ 선한 세탁부 F의 'C 또는 G가 사냥꾼'에서 G는 장의사이므로 C가 진짜 사냥꾼이다. 그러면 A의 사냥꾼 주장은 거짓 — A가 남은 악역이다.",
    "⑤ 악역은 A와 D이고 D는 탕녀이므로, A가 임프다.",
    "⑥ 총격이 빗나간 이유는 이제 분명하다. A는 사냥꾼이 아니라 임프였다. 진짜 사냥꾼 C는 총을 쏜 적조차 없으니 능력이 그대로 남아 있다 — 그것을 숨기려고 A가 먼저 나서서 연극을 한 것이다.",
    "⑦ 확인: 선한 요리사 B의 '인접 악역 쌍 0'은 떨어져 앉은 A와 D와 맞고, 초공감자 E의 밤1 '1'은 이웃 D·F 중 D를 가리킨다. 밤2에 '0'으로 떨어진 것은 D가 처형돼 이웃이 C와 F로 바뀌었기 때문이다.",
  ],
  solution: ["imp", "chef", "slayer", "scarletwoman", "empath", "washerwoman", "undertaker"],
});
