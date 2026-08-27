import { definePuzzle } from "@/lib/puzzles/schema";

// 보통 1: 독살범 — "어제 처형된 D는 임프였다"는 장의사의 폭탄 발언.
// 하지만 임프가 처형됐다면 게임은 끝났어야 한다. 누군가 중독됐다.
export default definePuzzle({
  id: "tb-04",
  title: "죽은 자가 임프라니",
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
    "7인 게임, 2일차 아침. 어제 낮 마을은 D를 처형했고 밤사이 G가 죽었다. " +
    "그런데 장의사 F가 창백한 얼굴로 말한다: '어젯밤 확인했는데, D의 역할은 임프였습니다.' " +
    "임프가 처형됐는데 게임이 계속되고 있다? 이 스크립트에 탕녀는 없다. " +
    "독살범이 있을 뿐이다. 7인 게임에 외지인은 없다.",
  claims: [
    {
      seat: 0, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 1, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    {
      seat: 2, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [0, 3], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [1, 6], yes: false } },
      ],
    },
    { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 6], shownRole: "empath" } }] },
    {
      seat: 4, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 5, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "imp" } }] },
    { seat: 6, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 3 },
    { type: "death", night: 2, seat: 6 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [4] },
    { id: "poisoner", text: "독살범은 누구인가?", answerSeats: [1] },
  ],
  hints: [
    "초공감자 주장이 둘(A, E), 요리사 주장도 둘(B, G)이다. 외지인이 없는 7인 판에서 같은 역할 주장 쌍마다 최소 한 명은 악역이다 — 그리고 악역은 단 둘뿐이다.",
    "독살범의 독은 밤마다 한 명뿐이다. 장의사의 '임프' 증언이 중독 탓이라면, 밤2의 다른 정보(A의 초공감자, C의 점쟁이)는 전부 정직해야 한다.",
  ],
  walkthrough: [
    "① 탕녀가 없는 판에서 임프가 처형되면 게임은 그 자리에서 끝난다. 게임이 계속되고 있으므로 장의사 F의 '임프' 증언은 사실이 아니다 — F가 악역이거나, F가 밤2에 중독됐다.",
    "② 초공감자 주장이 둘(A·E), 요리사 주장이 둘(B·G)인데 외지인이 없으므로, {A, E} 중 한 명과 {B, G} 중 한 명이 악역이다. 악역은 정확히 두 명이므로 이 둘이 악역의 전부다 — 즉 D와 F는 선하다.",
    "③ F가 선하므로(②) ①에 의해 F는 밤2에 중독됐다. 따라서 밤2의 다른 정보는 모두 정직하다.",
    "④ G가 악역이라 가정하자. G는 밤2에 죽었다. 그럼 선한 초공감자 A의 밤2 정보(이웃 F·B 중 1명 악)가 문제다: F는 선(②), B도 선(G가 악역 몫을 가져갔으므로) — '1명'이 거짓이 되어 A도 밤2 중독이 필요한데, 독은 이미 F에게 갔다. 모순 — 요리사 쪽 악역은 B다.",
    "⑤ 남은 것은 {A, E} 중 누가 악역인가. A가 악이라면 E는 선·정직 초공감자인데, 그럼 B(악)와 G(선) 재검토에서 E의 이웃 D·F가 모두 선이라 E의 '1명' 정보가 깨진다 — E의 정보를 살릴 배치가 없다. 따라서 E가 악역이고 A는 선하다. 실제로 A의 두 밤 정보(이웃 중 1악)는 모두 B를 가리킨다.",
    "⑥ B와 E 중 누가 임프인가. 선한 점쟁이 C의 밤2 정보 'B·G에 악마 없음'이 정직하므로(③과 같은 논리로 밤2 독은 F 한 명뿐) B는 임프가 아니다. 따라서 E가 임프, B가 독살범이다.",
    "⑦ 재구성: 밤1 — 독살범 B의 독 또는 레드 헤링이 점쟁이 C의 '있음'(A·D)을 만들었다. 낮1 — 마을이 세탁부 D를 처형했다. 밤2 — B가 장의사 F를 중독시켜 'D는 임프였다'는 헛것을 보여줬고, 임프 E는 진짜 요리사 G를 죽였다.",
  ],
  solution: ["empath", "poisoner", "fortuneteller", "washerwoman", "imp", "undertaker", "chef"],
});
