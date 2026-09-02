import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 팡 구의 점프 — 악마가 죽었는데 사람이 계속 죽는다.
// 탕녀가 이어받은 것이 아니다. 악마가 외지인의 몸으로 옮겨 앉은 것이다.
export default definePuzzle({
  id: "mx-12",
  title: "세 번째 새벽",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  // 팡 구가 있으면 외지인이 한 명 늘어난다 (7인: 마을 주민 4, 외지인 1, 하수인 1, 악마 1).
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "clockmaker", "dreamer", "oracle", "mayor",
    "butler", "recluse", "saint",
    "scarletwoman",
    "fanggu", "imp", "zombuul", "shabaloth",
  ],
  intro:
    "7인 게임, 3일차 아침. 밤2에 C가 죽었고, 낮2에 마을은 E를 처형했다. 그런데 밤3에 또 F가 죽었다. " +
    "이 대본의 악마는 팡 구·임프·좀부울·샤바로스 넷 중 하나다. " +
    "장의사를 주장하는 사람도 둘, 요리사를 주장하는 사람도 둘이다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "undertaker", info: [] },
    { seat: 3, role: "recluse", info: [] },
    { seat: 4, role: "chef", info: [{ night: 1, data: { type: "chef", count: 2 } }] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 6], shownRole: "chef" } }] },
    { seat: 6, role: "undertaker", info: [{ night: 3, data: { type: "undertaker", shownRole: "scarletwoman" } }] },
  ],
  events: [
    { type: "death", night: 2, seat: 2 },
    { type: "execution", day: 2, seat: 4 },
    { type: "death", night: 3, seat: 5 },
  ],
  currentDemonSeat: 3,
  questions: [
    { id: "demon", text: "지금 이 순간의 악마는 누구인가?", answerSeats: [3] },
    { id: "fanggu", text: "처음에 팡 구였던 사람은 누구인가?", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "중복 주장이 두 쌍이다. 그 사실만으로 세 사람의 결백이 먼저 증명된다 — 그들의 정보부터 쓰라.",
    "초공감자 B의 이웃은 밤2에 바뀌었다. C가 죽었으니 이웃은 A와 D가 된다. 그런데 수치는 그대로 1이다.",
  ],
  walkthrough: [
    "① 장의사를 주장하는 사람이 둘(C, G), 요리사를 주장하는 사람도 둘(A, E)이다. 각 쌍에서 적어도 하나가 악역인데 악역은 둘뿐이므로 각 쌍에서 정확히 하나씩이고 — 나머지 B·D·F는 전부 선하고 정직하다.",
    "② 선한 세탁부 F의 'A 또는 G가 요리사'를 보자. A가 악역이라면 요리사 토큰은 G에게 있어야 하는데, G가 요리사라면 장의사 쌍에서 악역은 G가 되어 악역이 A와 G 둘 다가 된다 — 그러면 요리사 토큰을 든 사람이 아무도 없다. 모순이므로 A가 진짜 요리사이고, 요리사 쌍의 악역은 E다.",
    "③ 그러면 장의사 쌍의 악역은 C이고 G가 진짜 장의사다. 선한 G의 밤3 증언에 따라 어제 처형된 E의 토큰은 탕녀였다.",
    "④ 악역은 C와 E이고 E가 탕녀이므로, 처음의 팡 구는 C다. 그런데 C는 밤2에 죽었고 그 뒤로도 F가 죽었다.",
    "⑤ 악마가 죽었는데 게임이 이어지는 길은 셋뿐이다 — 탕녀의 승계, 임프의 스타 패스, 또는 팡 구의 점프. 앞의 둘은 어느 쪽이든 E의 토큰이 악마의 것으로 바뀌는데, 장의사 G는 처형된 E에게서 탕녀를 보았다. 남은 것은 점프뿐이다.",
    "⑥ 그리고 외지인의 존재 자체가 악마의 종류를 못박는다. 7인 판은 원래 외지인이 0명인데 D가 은둔자를 밝혔고, 이 대본에서 외지인을 한 명 늘리는 것은 팡 구뿐이다 — 좀부울도 샤바로스도 아니다. 팡 구의 점프는 능력으로 죽인 첫 외지인에게 일어나며, 그 외지인 자리는 D가 채운다 — 밤2에 팡 구 C가 D를 노렸고, D가 새 팡 구가 되면서 C가 대신 죽었다. 지금 이 순간의 악마는 D다.",
    "⑦ 초공감자 B의 수치가 그것을 뒷받침한다. 밤1의 1은 이웃 A(선)와 C(팡 구)를 센 것이다. 밤2에 C가 죽어 이웃이 A와 D로 바뀌었는데도 수치는 그대로 1이다 — 옆자리의 은둔자가 이미 악마가 되어 있었다는 뜻이다.",
    "⑧ 확인: 선한 요리사 A의 밤1 '인접 악역 쌍 0'은 떨어져 앉은 C와 E에 맞는다(그 밤 D는 아직 선한 은둔자였다). 밤3에 세탁부 F를 죽인 것은 새 악마 D였다.",
  ],
  solution: ["chef", "empath", "fanggu", "recluse", "scarletwoman", "washerwoman", "undertaker"],
});
