import { definePuzzle } from "@/lib/puzzles/schema";

// 쉬움 2: 은둔자 입문 — 6인 구성상 외지인 1명이 반드시 존재하므로
// 은둔자 주장자는 선하다. 하지만 그의 존재가 요리사·점쟁이 정보를 뒤흔든다.
export default definePuzzle({
  id: "tb-02",
  title: "수상한 이웃",
  edition: "tb",
  difficulty: "easy",
  playerCount: 6,
  nights: 1,
  rolePool: [
    "imp", "scarletwoman", "recluse",
    "washerwoman", "librarian", "chef", "empath", "fortuneteller", "investigator",
  ],
  intro:
    "6인 게임의 첫날 아침. 아무도 죽지 않았고 전원이 정보를 공개했다. " +
    "6인 게임에는 외지인이 정확히 1명 있는데, 이 스크립트에서 가능한 외지인은 은둔자뿐이다. " +
    "은둔자는 선하지만, 악한 진영·하수인·악마로 잘못 등록될 수 있다는 것을 기억하라.",
  claims: [
    { seat: 0, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [2, 4], yes: false } }] },
    { seat: 1, role: "recluse", info: [] },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [5, 0], shownRole: "empath" } }] },
    { seat: 4, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 5, role: "empath", info: [{ night: 1, data: { type: "empath", count: 1 } }] },
  ],
  events: [],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [3] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "6인 구성(마을 주민 3, 외지인 1, 하수인 1, 악마 1)에서 외지인 자리는 은둔자뿐이다. 만약 B의 은둔자 주장이 거짓이라면 외지인 수가 맞아떨어지는지 따져보라.",
    "초공감자를 주장하는 사람이 둘(E, F)이다. 둘 다 진짜일 수 있는가? 한 명이 악역이라면, 어느 쪽인지는 D의 세탁부 정보와 C의 요리사 수치로 갈린다.",
  ],
  walkthrough: [
    "① 6인 구성에는 외지인이 정확히 1명 있고, 이 스크립트의 외지인은 은둔자뿐이다. 악역이 은둔자를 사칭했다면 실제 외지인이 0명이 되어 구성이 깨진다. 따라서 B는 진짜 은둔자이고 선하다.",
    "② E와 F가 모두 초공감자를 주장한다. 같은 역할 토큰은 한 판에 하나뿐이므로 둘 다 선할 수는 없다 — E와 F 중 정확히 한 명이 악역이다.",
    "③ F가 악역이라 가정하자. D의 세탁부 정보 'F 또는 A가 초공감자'는, F가 악역이고 A가 점쟁이 주장자인 이상 성립할 수 없다. 그럼 D도 악역이어야 하는데(악역은 F와 D 둘로 확정), 그 경우 요리사 C가 선·정직인데 인접한 악역 쌍이 없어 '1쌍' 정보가 거짓이 된다. 모순 — 따라서 악역은 E다.",
    "④ F는 선하고 정직하다. F의 초공감자 1은 이웃 E·A 중 정확히 한 명이 악하다는 뜻인데 E가 악역이므로 A는 선하다.",
    "⑤ 선한 점쟁이 A의 정보 'C·E에 악마 없음'에 의해 E는 악마가 아니다. 즉 E는 하수인 — 탕녀다.",
    "⑥ 남은 악역(악마)은 C 또는 D다. C가 악마라면 A의 점쟁이 정보가 'C·E에 악마 없음'과 모순된다(악마는 강제로 '있음'에 걸린다). 따라서 악마는 D — 임프다.",
    "⑦ 검증: 악역 D(3)·E(4)는 인접해 요리사의 '1쌍'과 맞고, 은둔자 B의 이웃은 모두 선해 추가 쌍을 만들 여지도 없다. 세탁부 D의 주장은 임프의 그럴듯한 사칭이었다.",
  ],
  solution: ["fortuneteller", "recluse", "chef", "imp", "scarletwoman", "empath"],
});
