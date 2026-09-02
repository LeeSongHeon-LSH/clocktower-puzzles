import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 할머니의 연쇄 — 한 밤에 두 사람이 죽었다면, 두 번째 죽음에는 반드시 이름이 있다.
export default definePuzzle({
  id: "mx-06",
  title: "손주를 따라간 사람",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "chef", "empath", "undertaker", "investigator", "fortuneteller", "grandmother",
    "soldier", "mayor", "monk", "ravenkeeper",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 게임, 2일차 아침. 처형은 없었는데 밤사이 두 사람이 죽었다 — A와 F가 함께 발견됐다. " +
    "악마의 손은 하룻밤에 한 번뿐이다. 그렇다면 나머지 한 사람은 무엇에 죽었는가.",
  claims: [
    { seat: 0, role: "grandmother", info: [{ night: 1, data: { type: "grandmother", target: 5, shownRole: "washerwoman" } }] },
    { seat: 1, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 2, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [1, 6], shownRole: "scarletwoman" } }] },
    {
      seat: 4, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [1, 6], shownRole: "chef" } }] },
    {
      seat: 6, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [2, 3], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [3, 4], yes: false } },
      ],
    },
  ],
  events: [
    { type: "death", night: 2, seat: 5 },
    { type: "death", night: 2, seat: 0 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "이 대본에서 한 밤에 두 명을 죽일 수 있는 조합은 하나뿐이다. 죽은 두 사람 중 한쪽이 다른 쪽의 죽음 때문에 죽었다면, 그 사람의 역할은 저절로 정해진다.",
    "점쟁이 G의 두 밤 정보를 겹쳐 보라. 밤1은 후보를 둘로 좁히고, 밤2는 그중 하나를 지운다.",
  ],
  walkthrough: [
    "① 처형이 없었는데 한 밤에 둘이 죽었다. 이 대본에서 악마의 킬 외에 사람을 죽일 수 있는 것은 할머니의 연쇄뿐이다 — 손주가 악마에게 죽으면 할머니도 함께 죽는다. 따라서 A는 진짜 할머니이고 그 밤 멀쩡했으며, 악마가 죽인 쪽은 A가 밤1에 배운 손주다.",
    "② 멀쩡한 할머니 A의 정보에 따라 손주 F는 세탁부다 — F는 선하고, 그 세탁부 정보도 참이다.",
    "③ C와 E가 모두 초공감자를 주장한다. 토큰은 하나뿐이므로 한 명은 악역이다.",
    "④ 선한 세탁부 F의 'B 또는 G가 요리사'를 보자. G가 선하다면 G는 점쟁이이므로 요리사는 B가 되고, B도 선해진다. G가 악역이라고 가정하면 어떻게 되는지 ⑤에서 따져 보자.",
    "⑤ G가 악역이라 하자. 악역은 둘이고 ③에 의해 나머지 하나는 C 아니면 E다. 그런데 선한 요리사 B(F의 정보로 B가 요리사임은 그대로다)의 '인접 악역 쌍 1'이 성립하려면 두 악역이 나란해야 하는데, G(7번째 자리)의 이웃은 F와 A이고 둘 다 선하다 — 인접 쌍이 0이 되어 모순이다. 따라서 G는 선하고 B가 요리사다.",
    "⑥ 선한 점쟁이 G의 밤1 'C·D 중 악마 있음'과 밤2 'D·E 중 악마 없음'을 겹치면 악마는 C다.",
    "⑦ 그러면 ③의 초공감자 쌍에서 C가 악역이므로 E가 진짜다. 선한 E의 밤1 수치 1은 이웃 D·F 중 하나가 악하다는 뜻이고 F는 선하므로 D가 남은 악역 — 탕녀다.",
    "⑧ 재구성: 임프 C는 초공감자를 사칭했고 탕녀 D는 수사관 행세를 하며 선한 B와 G를 걸고넘어졌다. 밤2에 임프가 세탁부 F를 노린 순간, F가 손주였다는 사실 하나로 할머니 A까지 함께 쓰러졌다 — 그 두 번째 시신이 이 판의 유일한 열쇠였다.",
  ],
  solution: ["grandmother", "chef", "imp", "scarletwoman", "empath", "washerwoman", "fortuneteller"],
});
