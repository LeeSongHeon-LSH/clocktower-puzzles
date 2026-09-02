import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 철학자 역전 — 같은 역할을 두 사람이 주장하는데, 진짜 쪽이 취해 있다.
// 철학자가 능력을 가져가면 원주인은 그 밤부터 계속 취한다.
export default definePuzzle({
  id: "mx-08",
  title: "능력을 빼앗긴 사람",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "philosopher", "clockmaker", "dreamer", "oracle", "seamstress",
    "empath", "chef", "washerwoman", "investigator", "undertaker",
    "soldier", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 게임, 2일차 아침. 밤사이 F가 죽었다. " +
    "A는 '나는 철학자이고 첫날 밤 초공감자의 능력을 가져왔다'고 말한다. " +
    "그런데 B는 자기가 초공감자라며, 이웃 둘이 모두 악하다는 수치를 내놓았다.",
  claims: [
    {
      seat: 0, role: "philosopher", info: [
        { night: 1, data: { type: "philosopher", role: "empath" } },
        { night: 1, asRole: "empath", data: { type: "empath", count: 0 } },
        { night: 2, asRole: "empath", data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 1, role: "empath", info: [{ night: 1, data: { type: "empath", count: 2 } }] },
    { seat: 2, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 3 } }] },
    { seat: 3, role: "seamstress", info: [{ night: 1, data: { type: "seamstress", targets: [4, 6], sameTeam: false } }] },
    { seat: 4, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [4, 6], shownRole: "chef" } }] },
    {
      seat: 6, role: "dreamer", info: [
        { night: 1, data: { type: "dreamer", target: 2, goodRole: "chef", evilRole: "imp" } },
        { night: 2, data: { type: "dreamer", target: 3, goodRole: "washerwoman", evilRole: "scarletwoman" } },
      ],
    },
  ],
  events: [{ type: "death", night: 2, seat: 5 }],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [2] },
    { id: "empath", text: "진짜 초공감자는 누구인가?", answerSeats: [1] },
  ],
  hints: [
    "B의 '이웃에 악 2명'은 이웃이 둘뿐이므로 A와 C가 **모두** 악하다는 주장이다. 그 가정을 끝까지 밀어 보면 세탁부 토큰이 두 개가 된다.",
    "이 대본에는 주정뱅이도 독살범도 없다. 그런데도 선한 사람이 틀린 수치를 낼 수 있는 길이 딱 하나 있다.",
  ],
  walkthrough: [
    "① B의 수치 2는 이웃이 A와 C 둘뿐이므로 '둘 다 악하다'는 뜻이다. 그 말이 참이라고 가정하면 악역 자리가 A·C로 다 차고 D·E·F·G는 전부 선하다.",
    "② 그런데 선한 몽상가 G의 밤2 정보는 'D는 세탁부이거나 탕녀'다. D가 선하다면 세탁부여야 하는데, F도 세탁부를 주장하는 선한 사람이 된다 — 같은 토큰이 둘이 되어 모순이다. 따라서 B의 수치는 참일 수 없다.",
    "③ 이 대본에는 주정뱅이도 독살범도 없다. 선한 사람이 틀린 수치를 내는 길은 하나뿐이다 — 철학자가 초공감자 능력을 가져가 원주인을 취하게 만든 경우. 즉 A의 철학자 주장은 참이고 A는 선하며, B는 진짜 초공감자이지만 첫날 밤부터 계속 취해 있다.",
    "④ 이제 선한 몽상가 G의 두 문장을 쓴다. 밤1 'C는 요리사이거나 임프', 밤2 'D는 세탁부이거나 탕녀'.",
    "⑤ 선한 세탁부 F의 'E 또는 G가 요리사'에서 G는 몽상가이므로 요리사는 E다. 그러면 ④의 C는 요리사일 수 없으니 C가 임프다.",
    "⑥ 세탁부 토큰은 F가 들고 있으므로 ④의 D는 탕녀다. 악역 둘이 C와 D로 찼다.",
    "⑦ 확인: 선한 요리사 E의 '인접 악역 쌍 1'은 나란한 C·D와 맞고, 철학자 A가 초공감자로서 낸 두 번의 0은 이웃 G와 B가 모두 선하다는 사실과 맞는다. 임프 C의 시계공 주장과 탕녀 D의 재봉사 주장은 둘 다 거짓이었다.",
    "⑧ 이 판의 함정은 '누가 거짓말을 하는가'가 아니었다. B는 처음부터 끝까지 정직했고, 다만 자기 능력이 이미 남의 손에 넘어갔다는 것을 몰랐을 뿐이다.",
  ],
  solution: ["philosopher", "empath", "imp", "scarletwoman", "chef", "washerwoman", "dreamer"],
});
