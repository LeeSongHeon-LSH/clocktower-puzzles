import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 마귀할멈 — "나는 원래 초공감자였는데 밤2부터 장의사가 됐다."
// 그런 일이 일어날 수 있는 대본인가, 아니면 지어낸 이야기인가.
export default definePuzzle({
  id: "mx-11",
  title: "탑 아래 여덟 사람",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 8,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  // 마귀할멈이 있는 대본은 하수인이 마귀할멈 하나, 악마도 한 종류여야 한다 —
  // 그래야 새 하수인이나 새 악마가 만들어지는 일이 없다.
  rolePool: [
    "chef", "empath", "undertaker", "washerwoman", "investigator",
    "clockmaker", "dreamer", "oracle", "seamstress", "mayor",
    "butler", "recluse", "saint", "tealady",
    "pithag",
    "imp",
  ],
  intro:
    "8인 게임, 2일차 아침. 낮1에 A가 처형됐고 밤2에 E가 죽었다. " +
    "B가 이상한 말을 한다 — '나는 첫날 밤에는 초공감자였는데, 밤2부터 장의사가 됐다.' " +
    "이 대본에 그런 일을 일으킬 수 있는 것은 마귀할멈뿐이다. " +
    "매일 밤 한 사람을 골라, 판에 없는 캐릭터로 바꿔 버리는 하수인.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 1, role: "undertaker", roleChange: { night: 2, from: "empath" }, info: [
        { night: 1, asRole: "empath", data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "undertaker", shownRole: "chef" } },
      ],
    },
    { seat: 2, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [4, 5], shownRole: "pithag" } }] },
    { seat: 3, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 2 } }] },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 7], shownRole: "chef" } }] },
    { seat: 5, role: "butler", info: [] },
    { seat: 6, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [2, 3], shownRole: "pithag" } }] },
    {
      seat: 7, role: "dreamer", info: [
        { night: 1, data: { type: "dreamer", target: 2, goodRole: "investigator", evilRole: "pithag" } },
        { night: 2, data: { type: "dreamer", target: 3, goodRole: "clockmaker", evilRole: "imp" } },
      ],
    },
  ],
  events: [
    { type: "execution", day: 1, seat: 0 },
    { type: "death", night: 2, seat: 4 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [3] },
    { id: "pithag", text: "마귀할멈은 누구인가?", answerSeats: [2] },
  ],
  hints: [
    "수사관을 주장하는 사람이 둘이다. 한쪽이 진짜라고 가정하고 그 사람의 정보를 그대로 믿어 보라 — 지목당한 두 사람이 이미 다른 역할로 밝혀져 있지는 않은가?",
    "시계공의 '거리 2'는 악마와 마귀할멈이 두 자리 떨어져 앉아 있다는 뜻이다. 후보를 하나씩 대입해 거리를 세어 보라.",
  ],
  walkthrough: [
    "① B의 이력 주장이 참이려면 마귀할멈이 실제로 판에 있고, 밤2에 살아서 멀쩡했으며, 그때 장의사 토큰이 판에 없었어야 한다. 8인 구성의 하수인 한 자리는 이 대본에서 마귀할멈뿐이므로 마귀할멈은 어차피 판에 있다.",
    "② 선한 몽상가 H의 두 문장을 축으로 삼는다. 밤1: 'C는 수사관이거나 마귀할멈'. 밤2: 'D는 시계공이거나 임프'.",
    "③ 8인 구성의 외지인 한 자리는 스스로 집사를 밝힌 F가 채운다. 선한 세탁부 E의 'A 또는 H가 요리사'에서 H는 몽상가이므로 A가 진짜 요리사다 — 그리고 그것은 B가 장의사로서 확인한 'A의 토큰은 요리사'와 정확히 맞물린다.",
    "④ C가 진짜 수사관이라고 하자. 그러면 C의 정보 '마귀할멈은 E 또는 F'가 참이어야 하는데, E는 세탁부이고 F는 집사다 — 둘 다 마귀할멈일 수 없다. 모순이므로 C는 악역이고, ②에 의해 C가 마귀할멈이다.",
    "⑤ 남은 악역 하나가 임프다. A(요리사)·E(세탁부)·F(집사)는 이미 선하므로 후보는 B·D·G·H뿐이다. 그런데 D를 뺀 누가 임프여도 D는 선한 시계공이 되고, 그 '거리 2' — 악마와 마귀할멈 C 사이가 정확히 두 자리 — 가 참이어야 한다. B는 C의 바로 옆(1), G는 네 자리(4), H는 세 자리(3)로 어느 쪽도 2가 아니다. 따라서 임프는 D이고, D의 시계공 주장은 처음부터 거짓이었다.",
    "⑥ 악역이 C와 D로 찼으므로 B는 선하다. 즉 B의 이력 주장은 참이다 — 마귀할멈 C가 밤2에 B를 초공감자에서 장의사로 바꿔 놓았다. 그날 밤 장의사 토큰이 판에 없었기 때문에 가능한 일이었다.",
    "⑦ 확인: 초공감자였던 밤1에 B가 센 1은 이웃 A(선)와 C(마귀할멈)를 가리키고, 선한 요리사 A의 '인접 악역 쌍 1'도 나란히 앉은 C와 D를 가리킨다. 진짜 수사관 G의 '마귀할멈은 C 또는 D' 역시 C로 좁혀진다.",
    "⑧ 재구성: 마귀할멈 C는 수사관을 사칭하며 무고한 E와 F에게 혐의를 씌웠고, 정작 자기가 밤2에 B의 역할을 갈아 끼웠다. 바뀐 사실을 숨기지 않고 그대로 밝힌 B의 한마디가 이 판을 열었다.",
  ],
  solution: ["chef", "undertaker", "pithag", "imp", "washerwoman", "butler", "investigator", "dreamer"],
});
