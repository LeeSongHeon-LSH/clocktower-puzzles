import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 보르톡스 — 맞는 정보가 하나도 없다.
// 보르톡스가 판에 있으면 멀쩡한 마을 주민의 정보도 전부 거짓이 된다.
export default definePuzzle({
  id: "mx-16",
  title: "아무도 맞지 않았다",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 악마가 세 종류이므로 '누구인가'와 함께 '무엇인가'도 물어야 한다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "clockmaker", "dreamer", "oracle", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp", "vortox", "vigormortis",
  ],
  intro:
    "7인 게임, 2일차 아침. 낮1에 G가 처형됐고 밤사이 E가 죽었다. " +
    "이 대본의 악마는 임프·보르톡스·비고르모르티스 셋 중 하나다. " +
    "보르톡스가 판에 있으면 멀쩡한 마을 주민의 정보조차 전부 거짓이 된다는 것을 기억하라.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 0 } },
        { night: 2, data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 2, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [4, 5], shownRole: "baron" } }] },
    { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 1 } }] },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [3, 5], shownRole: "empath" } }] },
    { seat: 5, role: "dreamer", info: [{ night: 1, data: { type: "dreamer", target: 2, goodRole: "investigator", evilRole: "scarletwoman" } }] },
    { seat: 6, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [0, 1], shownRole: "scarletwoman" } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 6 },
    { type: "death", night: 2, seat: 4 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [2] },
    { id: "vortox", text: "이 판의 악마는 보르톡스다. 그 좌석을 고르라", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "모든 정보가 참이라고 가정하고 끝까지 밀어 보라. 같은 역할을 주장한 두 쌍이 어디선가 서로를 부순다.",
    "보르톡스 세계에서는 선한 사람의 정보를 뒤집어 읽는다. '둘 중 하나'라는 정보가 거짓이면 둘 다 아니라는 뜻이다.",
  ],
  walkthrough: [
    "① 초공감자를 주장하는 사람이 둘(B, D), 수사관을 주장하는 사람도 둘(C, G)이다. 각 쌍에서 적어도 하나가 악역이고 악역은 둘뿐이므로 각 쌍에서 정확히 하나씩이며 — A·E·F는 전부 선하다.",
    "② 정보가 전부 참이라고 가정해 보자. 선한 초공감자 후보 B의 '이웃에 악 0명'이 참이면 A와 C가 모두 선해야 하는데, ①에 의해 수사관 쌍의 악역은 C 아니면 G다. C가 선하면 악역은 G이고, 그러면 초공감자 쌍의 악역은 D여야 한다. 여기까지는 버틴다.",
    "③ 그런데 선한 세탁부 E의 'D 또는 F가 초공감자'가 참이어야 한다. D는 악역이고 F는 몽상가이므로 초공감자는 둘 중 아무도 아니다 — 거짓이다. 선한 사람의 정보가 참일 수 없다면, 참을 전제한 가정 자체가 틀렸다.",
    "④ 이 대본에는 주정뱅이도 독살범도 없다. 비고르모르티스의 중독은 자기가 죽인 하수인의 이웃에게만 걸리는데 죽은 하수인이 없다. 선한 사람의 정보를 통째로 뒤집을 수 있는 것은 보르톡스뿐이다.",
    "⑤ 보르톡스 세계에서는 멀쩡한 마을 주민의 정보가 전부 거짓이다. 이제 거짓을 뒤집어 읽는다. 선한 몽상가 F의 'C는 수사관이거나 탕녀'가 거짓이므로 — C는 수사관도 탕녀도 아니다.",
    "⑥ C가 선하다면 수사관 쌍의 악역은 G이고 C는 자기 주장대로 수사관이어야 하는데, ⑤와 어긋난다. 따라서 C가 악역이고, 탕녀도 아니므로 C가 보르톡스다.",
    "⑦ 그러면 남은 악역인 탕녀는 초공감자 쌍에서 나온다. 선한 세탁부 E의 'D 또는 F가 초공감자'도 거짓이므로 D는 초공감자가 아니다 — D가 탕녀이고, B가 진짜 초공감자다.",
    "⑧ 확인: 선한 요리사 A의 '인접 악역 쌍 0'도 거짓이어야 하는데, 실제로 C와 D는 나란히 앉아 한 쌍을 이룬다. 이 판에서 맞는 말을 한 사람은 아무도 없었고, 그 사실 자체가 유일한 단서였다.",
  ],
  solution: ["chef", "empath", "vortox", "scarletwoman", "washerwoman", "dreamer", "investigator"],
});
