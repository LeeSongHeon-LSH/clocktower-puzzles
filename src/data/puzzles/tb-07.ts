import { definePuzzle } from "@/lib/puzzles/schema";

// 쉬움: 처녀 발동 — 낮에 일어난 사건 하나가 두 좌석을 한꺼번에 못박는다.
// 지명당한 자는 진짜 처녀이고 멀쩡했으며, 지명한 자는 마을 주민으로 등록됐다.
export default definePuzzle({
  id: "tb-07",
  title: "손대지 말았어야 할 이름",
  edition: "mixed",
  difficulty: "easy",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "monk", "ravenkeeper", "virgin", "slayer", "soldier", "mayor",
    "butler", "recluse", "saint",
    "scarletwoman",
    "imp", "zombuul", "fanggu",
  ],
  intro:
    "7인 게임, 2일차 아침. 어제 낮 B가 A를 지명하자 A가 처녀임이 드러났고, " +
    "B는 그 자리에서 처형됐다. 그리고 밤사이 C가 죽었다. " +
    "남은 사람들이 각자 정보를 내놓았는데 — 초공감자를 주장하는 사람이 둘이다. " +
    "대본의 악마는 임프·좀부울·팡 구 셋 중 하나다.",
  claims: [
    { seat: 0, role: "virgin", info: [] },
    { seat: 1, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [2, 6], shownRole: "chef" } }] },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [0, 5], shownRole: "scarletwoman" } }] },
    { seat: 4, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    {
      seat: 5, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    {
      seat: 6, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [3, 4], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [4, 5], yes: false } },
      ],
    },
  ],
  events: [
    { type: "virginTrigger", day: 1, nominator: 1, nominee: 0 },
    { type: "death", night: 2, seat: 2 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [3] },
    { id: "imp", text: "이 판의 악마는 임프다. 그 좌석을 고르라", answerSeats: [3] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "밤 정보보다 낮에 일어난 일이 먼저다. 처녀의 능력이 실제로 발동했다는 것은 지명한 사람에 대해 무엇을 증명하는가?",
    "초공감자를 주장하는 사람이 둘(E, F)이다. 둘 중 한 명이 진짜라고 가정했을 때 그 수치가 다른 한 명의 정체와 앞뒤가 맞는지 따져 보라.",
  ],
  walkthrough: [
    "① 처녀의 능력이 발동했다는 것은 세 가지를 동시에 증명한다: 지명당한 A는 진짜 처녀이고, 그 순간 취하지도 중독되지도 않았으며, 지명한 B는 마을 주민으로 등록됐다. 이 대본에 첩자는 없으므로 B는 진짜 마을 주민 — 즉 A와 B는 둘 다 선하다.",
    "② E와 F가 모두 초공감자를 주장한다. 같은 역할 토큰은 판에 하나뿐이므로 둘 다 선할 수는 없다 — 정확히 한 명이 악역이다.",
    "③ E가 진짜 초공감자라고 하자. E의 '이웃에 악 0명'은 이웃 D와 F가 모두 선하다는 뜻인데, ②에 의해 F가 악역이어야 하므로 곧바로 모순이다. 따라서 악역은 E이고, F가 진짜 초공감자다.",
    "④ 선한 F의 밤1 수치 1은 이웃 E·G 중 정확히 한 명이 악하다는 뜻이다. E가 악역이므로 G는 선하다.",
    "⑤ 선한 점쟁이 G의 밤2 정보 'E·F 중 악마 없음'에 의해 E는 악마가 아니다. E는 악역이면서 악마가 아니므로 하수인 — 이 대본의 하수인은 탕녀뿐이다.",
    "⑥ 악역은 둘뿐이고 그중 하나가 E(탕녀)다. A·B·F·G가 선하므로 악마는 C 아니면 D다.",
    "⑦ 선한 세탁부 B의 'C 또는 G가 요리사'에서 G는 점쟁이이므로 C가 요리사다 — C는 선하다. 남은 것은 D뿐, D가 임프다.",
    "⑧ 악마의 종류도 이미 정해져 있었다. 좀부울이라면 낮1에 처형 사망이 있었으므로 그 밤 아예 깨어나지 못해 C가 죽을 수 없다. 팡 구라면 외지인이 한 명 늘어 7인 판에 외지인 자리가 생기는데, 아무도 외지인을 주장하지 않았고 정체를 감출 주정뱅이도 대본에 없다. 남는 것은 임프뿐이다.",
    "⑨ 재구성: 임프 D는 수사관을 사칭하며 선한 A와 F에게 혐의를 씌웠고, 탕녀 E는 초공감자를 사칭했다. 마을은 정보가 아니라 낮의 사고로 진실에 닿았다 — 처녀에게 손을 댄 B가 죽는 순간, 이미 두 사람의 결백이 증명되어 있었다. 선한 요리사 C의 '인접 악역 쌍 1'도 나란히 앉은 D와 E를 가리키고 있었다.",
  ],
  solution: ["virgin", "washerwoman", "chef", "imp", "scarletwoman", "empath", "fortuneteller"],
});
