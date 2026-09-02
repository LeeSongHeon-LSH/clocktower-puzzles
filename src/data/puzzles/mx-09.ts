import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 암살자 — 한 밤에 둘이 죽었고, 보호도 소용없는 칼이 있었다.
// 같은 역할을 주장하는 쌍이 둘이면 악역 자리는 이미 다 찬 것이다.
export default definePuzzle({
  id: "mx-09",
  title: "두 번째 칼",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "chambermaid", "exorcist", "grandmother", "gambler", "soldier", "mayor",
    "butler", "recluse", "saint",
    "assassin", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 게임, 2일차 아침. 어제 낮 마을은 A를 처형했고, 밤사이 E와 G가 함께 죽었다. " +
    "악마의 손은 하룻밤에 한 번뿐이다. 그런데 요리사를 주장하는 사람도 둘, 초공감자를 주장하는 사람도 둘이다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 4, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [3, 5], yes: false } }] },
    { seat: 5, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "chef" } }] },
    { seat: 6, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [2, 3], shownRole: "assassin" } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 0 },
    { type: "death", night: 2, seat: 4 },
    { type: "death", night: 2, seat: 6 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [2] },
    { id: "assassin", text: "암살자는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "중복 주장이 두 쌍이라는 사실만으로 좌석 셋의 결백이 증명된다. 그 셋의 정보부터 남김없이 쓰라.",
    "점쟁이의 '악마 없음'은 악역이 아니라는 뜻이 아니다. 하수인일 수는 있다.",
  ],
  walkthrough: [
    "① 처형은 낮에 한 번뿐이고 악마의 킬은 밤에 한 번뿐인데, 밤2에 두 사람이 죽었다. 이 대본에서 밤에 추가로 사람을 죽일 수 있는 것은 암살자뿐이다 — 할머니의 연쇄는 할머니 자신이 죽어야 하고 죽은 둘 중 누구도 할머니를 주장하지 않았으며, 도박사는 자기만 죽는다. 따라서 암살자가 판에 있고 밤2에 칼을 썼다.",
    "② 요리사를 주장하는 사람이 둘(A, C), 초공감자를 주장하는 사람도 둘(B, D)이다. 각 쌍에서 적어도 한 명은 악역이고 악역은 둘뿐이므로 — 각 쌍에서 정확히 하나씩이며, 나머지 E·F·G는 전부 선하고 정직하다.",
    "③ 선한 장의사 F의 밤2 증언에 따라 처형된 A의 토큰은 요리사였다. A는 진짜 요리사이므로 요리사 쌍의 악역은 C다.",
    "④ 선한 수사관 G의 정보에 따라 암살자는 C 또는 D다.",
    "⑤ 초공감자 쌍(B, D)에서 남은 악역 하나가 나온다. D가 선한 초공감자라면 그 수치 0은 이웃 C와 E가 모두 선하다는 뜻인데, ③에서 C는 악역이다 — 모순이다. 따라서 D가 악역이고 B가 진짜 초공감자다.",
    "⑥ 악역은 C와 D다. 선한 점쟁이 E의 'D·F 중 악마 없음'에 의해 D는 악마가 아니므로, D가 암살자이고 C가 임프다.",
    "⑦ 확인: 선한 초공감자 B의 밤1 수치 1은 이웃 A(선)와 C(악)를 센 것이고, 밤2에도 1인 것은 죽은 좌석을 건너뛴 이웃이 F와 C이기 때문이다. 선한 요리사 A의 '인접 악역 쌍 1'은 나란히 앉은 C와 D를 가리킨다.",
    "⑧ 재구성: 임프 C는 요리사를, 암살자 D는 초공감자를 사칭했다. 밤2에 임프가 점쟁이 E를 노리는 동안 암살자는 수사관 G를 찔렀다 — 자신을 지목한 단 하나의 정보를 지우기 위해서였지만, 이미 그 말은 마을에 남아 있었다.",
  ],
  solution: ["chef", "empath", "imp", "assassin", "fortuneteller", "undertaker", "investigator"],
});
