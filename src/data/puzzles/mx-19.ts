import { definePuzzle } from "@/lib/puzzles/schema";

// 쉬움: 샤발로스 — 한 밤에 두 사람이 한꺼번에 죽었다. 이 대본에서 그럴 수 있는 것은 하나뿐이다.
export default definePuzzle({
  id: "mx-19",
  title: "안개가 걷힌 뒤",
  edition: "mixed",
  difficulty: "easy",
  playerCount: 6,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  // 취하게 하거나 중독시키는 수단도, 악마 말고 사람을 죽이는 수단도 일부러 넣지 않았다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "clockmaker",
    "dreamer", "oracle", "mayor", "soldier", "virgin", "slayer",
    "butler", "saint", "klutz",
    "scarletwoman",
    "imp", "zombuul", "shabaloth", "po", "vortox",
  ],
  intro:
    "6인 게임, 2일차 아침. 어제 낮에는 아무도 처형하지 못했고, 밤사이 A와 C가 한꺼번에 죽었다. " +
    "6인 구성에는 외지인이 정확히 1명 있고, 이 대본에는 주정뱅이도 광인도 독살범도 첩자도 은둔자도 없다 — " +
    "선한 사람이 낸 정보는 예외 없이 참이다. 요리사를 주장하는 사람이 둘이라는 것도 기억하라. " +
    "대본의 악마는 임프·좀버얼·샤발로스·포·보르톡스 다섯 중 하나다.",
  claims: [
    { seat: 0, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [2, 4], shownRole: "scarletwoman" } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "butler", info: [] },
    { seat: 3, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 3 } }] },
    { seat: 4, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 5, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
  ],
  events: [
    { type: "death", night: 2, seat: 0 },
    { type: "death", night: 2, seat: 2 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [3] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "shabaloth" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "요리사 토큰은 하나뿐인데 주장하는 사람은 둘이다. 어느 쪽이 진짜인지부터 가려라 — 진짜 쪽의 수치가 나머지를 연다.",
    "시계공을 자처한 사람의 '세 자리'와 요리사의 '인접한 악역 쌍 하나'는 동시에 참일 수 없다. 악역은 둘뿐이기 때문이다.",
  ],
  walkthrough: [
    "① 6인 구성은 마을 주민 3, 외지인 1, 하수인 1, 악마 1이다. 대본에 남작도 대부도 없으니 이 수는 바뀌지 않는다. C가 스스로 집사를 밝혔고, 대본에는 주정뱅이도 광인도 미치광이도 건달도 없다 — 마을 주민인 척 숨어 있을 외지인이 없으므로 외지인 한 자리는 C가 채운 것이고, C는 선하다. 취하게 만들 수단도 중독시킬 수단도 대본에 없으니 선한 사람의 정보는 예외 없이 참이다. 남은 다섯(A·B·D·E·F) 중 셋이 진짜 마을 주민, 둘이 악역이다.",
    "② 요리사 토큰은 하나뿐인데 E와 F가 둘 다 요리사를 주장한다. 둘 중 적어도 하나는 악역이다.",
    "③ F가 악역이라고 해 보자. 악역은 둘뿐이니 나머지 하나만 더 있다. 수사관 A가 선하다면 '탕녀는 C 아니면 E'가 참이고 C는 집사이므로 탕녀는 E다 — 악역이 E와 F로 정해진다. 그러면 A·B·D가 전부 진짜 마을 주민이고, 시계공 D의 '악마와 하수인은 세 자리 떨어져 있다'도 참이어야 하는데 E와 F는 나란히 앉아 있다. 모순이다.",
    "④ 그렇다면 A가 악역이어야 하니 악역은 A와 F다. 그런데 그러면 초공감자 B는 선하고, B가 밤1에 낸 '이웃 중 악 0'은 이웃인 A가 악역인 순간 거짓이 된다. 역시 모순이다. 따라서 **F가 진짜 요리사이고, ②에 의해 E가 악역이다.**",
    "⑤ 선한 요리사 F의 '인접한 악역 쌍 하나'는 악역 둘이 나란히 앉아 있다는 뜻이다. E의 옆자리는 D와 F인데 F는 선하므로, 나머지 악역은 D다. 악역 자리가 D와 E로 다 찼으니 수사관 A는 선하고, A의 '탕녀는 C 아니면 E'에서 C는 집사이므로 E가 탕녀다 — 그러면 남은 D가 악마다.",
    "⑥ 어떤 악마인가. 밤2에 A와 C가 한꺼번에 죽었다. 대본에 암살자도 대부도 할머니도 땜장이도 없으니 그 두 죽음은 둘 다 악마의 것이다. 임프도 좀버얼도 한 밤에 한 명뿐이고, 포가 세 명을 고르는 밤은 스스로 아무도 고르지 않은 밤 다음에만 열리는데 첫 밤에는 악마가 애초에 움직이지 않는다. 보르톡스라면 지나간 낮마다 처형이 있어야 하는데 낮1에는 처형이 없었다. 매밤 두 사람을 고르는 샤발로스만 남는다.",
    "⑦ 확인: 초공감자 B의 수치가 그것을 뒷받침한다. 밤1의 0은 이웃 A와 C가 둘 다 선했다는 뜻이고, 밤2에 그 둘이 죽자 B의 이웃은 D와 F로 바뀌었다 — 수치가 1로 오른 것은 새 이웃 D가 악하기 때문이다. 시계공을 자처한 D의 '세 자리'는 처음부터 거짓이었다. 나란히 앉은 D와 E 사이는 한 자리다.",
    "⑧ 재구성: 샤발로스 D와 탕녀 E는 나란히 앉아 각자 시계공과 요리사를 사칭했고, 밤2에 D가 A와 C를 한꺼번에 삼켰다. 죽은 수사관 A가 남긴 한 줄이 결국 옆자리의 가짜 요리사를 가리켰다.",
  ],
  solution: ["investigator", "empath", "butler", "shabaloth", "scarletwoman", "chef"],
});
