import { definePuzzle } from "@/lib/puzzles/schema";

// 보통 3: 까마귀지기 — 임프가 죽인 자는 마지막으로 한 명의 역할을 본다.
// 하수인은 드러났다. 그러나 악마는 아직 웃고 있다.
export default definePuzzle({
  id: "tb-06",
  title: "죽은 새의 눈",
  edition: "tb",
  difficulty: "normal",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "monk", "ravenkeeper", "soldier", "mayor",
    "butler", "drunk", "recluse", "saint",
    "spy", "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 게임, 2일차 아침. 어제 낮, '수사관' F가 C와 G를 탕녀로 지목했고 " +
    "마을은 요리사를 주장하던 G를 처형했다. 밤사이 A가 죽었다 — 그러나 까마귀지기였던 A는 " +
    "죽는 순간 눈을 떠 F의 역할을 확인했다: '탕녀'. " +
    "하수인은 드러났다. 이제 임프만 찾으면 된다. 7인 게임에 외지인은 없다.",
  claims: [
    { seat: 0, role: "ravenkeeper", info: [{ night: 2, data: { type: "ravenkeeper", target: 5, shownRole: "scarletwoman" } }] },
    { seat: 1, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [3, 4], shownRole: "fortuneteller" } }] },
    {
      seat: 2, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    {
      seat: 3, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [1, 5], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [0, 2], yes: false } },
      ],
    },
    { seat: 4, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "chef" } }] },
    { seat: 5, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [2, 6], shownRole: "scarletwoman" } }] },
    { seat: 6, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 6 },
    { type: "death", night: 2, seat: 0 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [1] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [5] },
  ],
  hints: [
    "A(까마귀지기)와 F(수사관 주장)의 정보는 정면충돌한다 — 둘 다 선·정직일 수는 없다. F가 정직하다는 가정을 스타 패스·승계 규칙까지 동원해 끝까지 밀어보라.",
    "장의사의 '요리사' 증언이 증명하는 것: 처형된 G는 임프가 아니었다. 그럼 임프 처형-승계 시나리오는 지워진다.",
  ],
  walkthrough: [
    "① 외지인이 없는 판이므로 선한 플레이어는 전원 정직하다. A는 'F가 탕녀', F는 '수사관인데 C 또는 G가 탕녀'라 주장한다 — 탕녀 토큰은 하나뿐이니 둘 다 선일 수 없다.",
    "② F가 정직한 수사관이라 가정하자. 그럼 A는 악역인데, A는 밤에 죽었으므로 A가 임프였다면 자살(스타 패스)이고 탕녀(C 또는 G)이 임프를 승계해야 한다. G라면 이미 처형돼 승계 불가 — 게임 종료 모순. C라면 C의 토큰이 임프가 되는데, 선한 점쟁이 D의 밤2 'A·C에 악마 없음'과 모순된다(죽은 A의 임프 토큰이든 승계한 C든 강제로 '있음'). A가 임프가 아니라 탕녀라 해도 수사관 정보의 탕녀(C/G)과 이중이 되어 모순. 따라서 F가 악역이고, A의 유언은 참이다: F = 탕녀.",
    "③ 처형된 G가 임프였다면 탕녀 F가 승계해 게임이 계속됐을 수 있다 — 하지만 선한 장의사 E가 본 G의 토큰은 '요리사'다. G는 임프가 아니었다.",
    "④ 남은 임프 후보는 B·C·D·E. 하나씩 소거한다: E가 임프라면 장의사 정보가 무효인데, 그럼 초공감자 C가 선·정직이 되어 '이웃(B·D) 중 1악'이 거짓이 된다(B·D 모두 선) — 모순. C가 임프라면 점쟁이 D의 밤2 'A·C에 악마 없음'이 거짓 — 모순. D가 임프라면 세탁부 B의 'D 또는 E가 점쟁이'가 성립 불가(D는 임프 토큰, E는 장의사) — 모순.",
    "⑤ 따라서 임프는 B다. 검증: 초공감자 C의 두 밤 '1'은 이웃 B를, 점쟁이 D의 밤1 'B·F 있음'은 임프 B를 가리킨다. B의 세탁부 주장은 진짜 점쟁이 D를 지지하는 척하며 신뢰를 사는 고급 사칭이었고, 임프는 밤2에 까마귀지기를 죽였다가 F의 정체만 내주고 말았다.",
  ],
  solution: ["ravenkeeper", "imp", "empath", "fortuneteller", "undertaker", "scarletwoman", "chef"],
});
