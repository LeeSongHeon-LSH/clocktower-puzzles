import { definePuzzle } from "@/lib/puzzles/schema";

// 쉬움 3: 장의사 입문 — 처형된 '요리사'는 정말 요리사였을까.
// 첩자는 죽어서도 마을 주민으로 등록될 수 있다.
export default definePuzzle({
  id: "tb-03",
  title: "장의사의 증언",
  edition: "tb",
  difficulty: "easy",
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
    "7인 게임, 2일차 아침. 어제 낮 마을은 요리사를 주장하던 C를 처형했고, " +
    "밤사이 G가 죽은 채 발견됐다. 장의사는 'C의 역할은 요리사가 맞았다'고 말한다. " +
    "그런데 요리사를 주장하는 사람이 또 있다 — E다. 7인 게임에 외지인은 없다.",
  claims: [
    { seat: 0, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "chef" } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [1, 6], shownRole: "spy" } }] },
    { seat: 4, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 5, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [3, 6], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [0, 6], yes: false } },
      ],
    },
    { seat: 6, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [4, 5], shownRole: "chef" } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 2 },
    { type: "death", night: 2, seat: 6 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [3] },
    { id: "spy", text: "첩자는 누구인가?", answerSeats: [2] },
  ],
  hints: [
    "요리사 주장이 둘(C, E)인데 외지인이 없는 판이다 — 최소 한 명은 악역이다. 그리고 처형된 C가 임프였다면, 탕녀가 없는 이 스크립트에서 게임이 계속될 수 있었을까?",
    "장의사의 '요리사' 증언은 C의 결백을 증명하지 않는다. 첩자는 죽어서도 마을 주민 역할로 등록될 수 있다.",
  ],
  walkthrough: [
    "① 7인 게임에는 외지인이 없으므로 선한 플레이어는 전원 정직하다. 요리사 토큰은 하나뿐이니 요리사를 주장하는 C·E 중 최소 한 명은 악역이다.",
    "② C·E가 둘 다 악역이라면 A·B·D·F·G 전원이 선·정직인데, 그럼 D의 수사관 정보 'B 또는 G가 첩자'가 성립할 수 없다. 따라서 C·E 중 정확히 한 명이 악역이고, 남은 악역 한 명은 나머지 다섯 중에 있다.",
    "③ G가 악역이라 가정하면: B의 2일밤 초공감자 정보가 참이려면(B 선) 이웃 A·D 중 한 명이 악역이어야 하는데, 악역 자리는 G와 C·E 중 하나로 이미 차 있다 — 그럼 A·D는 선하고 B의 '1명'은 거짓, 모순. 남는 배치를 끝까지 밀어도(G=첩자, E=임프 등) B의 2일밤 정보가 반드시 깨진다. 따라서 G는 선하다.",
    "④ 선한 세탁부 G의 정보에 의해 E 또는 F가 요리사인데 F는 점쟁이 주장자다 — E가 진짜 요리사이고, ①에 의해 C가 악역이다.",
    "⑤ 진짜 요리사 E의 '인접한 악역 쌍 1'에 의해 C의 파트너는 C의 이웃, 즉 B 또는 D다.",
    "⑥ 파트너가 B라면 A·D·F·G가 모두 선·정직이다. 그러면 D의 수사관 정보로 B가 첩자, 즉 C가 임프가 된다. 하지만 C는 낮에 처형됐고 탕녀가 없는 이 판에서 임프 처형은 곧 게임 종료다 — 게임은 계속되고 있으므로 모순. 게다가 선한 장의사 A가 봤을 토큰도 '요리사'가 아니라 '임프'였을 것이다.",
    "⑦ 따라서 악역은 C와 D다. 같은 논리로 처형된 C는 임프일 수 없으니 C가 첩자, D가 임프다.",
    "⑧ 검증: 장의사가 본 '요리사'는 죽은 첩자의 오등록. B의 2일밤 '1명'은 C가 죽은 뒤 새 이웃이 된 임프 D. F의 1일밤 '있음'도 D를 가리킨다. 수사관을 자칭하며 B·G에게 첩자 혐의를 씌운 것이 임프의 연막이었다.",
  ],
  solution: ["undertaker", "empath", "spy", "imp", "chef", "fortuneteller", "washerwoman"],
});
