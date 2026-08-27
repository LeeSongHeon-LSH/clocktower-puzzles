import { definePuzzle } from "@/lib/puzzles/schema";

// 쉬움 1: 첫날 밤 정보만으로 악역 쌍과 데몬을 특정하는 입문 퍼즐.
export default definePuzzle({
  id: "tb-01",
  title: "다섯 명의 아침",
  edition: "tb",
  difficulty: "easy",
  playerCount: 5,
  nights: 1,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "monk", "ravenkeeper", "soldier", "mayor",
    "butler", "drunk", "recluse", "saint",
    "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "5인 게임의 첫날 아침. 밤에는 아무도 죽지 않았고, 다섯 명 전원이 자신의 역할과 밤 정보를 공개했다. " +
    "이 중 두 명 — 임프와 탕녀 — 는 거짓말을 하고 있다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 1, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [2, 3], shownRole: "scarletwoman" } }] },
    { seat: 2, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [3, 4], yes: true } }] },
    { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [1, 2], shownRole: "investigator" } }] },
    { seat: 4, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
  ],
  events: [],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [4] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "E의 초공감자 주장이 참이라면 D와 A는 둘 다 선해야 한다. 그럼 D의 세탁부 주장과 B의 수사관 주장을 동시에 믿을 수 있는지 따져보라.",
    "B의 수사관 정보(C 또는 D가 탕녀)가 참이라고 가정하고, C가 악역인 경우와 D가 악역인 경우를 각각 끝까지 밀어보라.",
  ],
  walkthrough: [
    "① 요리사(A)의 정보 '인접한 악역 쌍 1개'가 참이라면 악역 둘은 반드시 붙어 앉아 있다.",
    "② E의 초공감자 정보 0은 이웃인 D와 A가 모두 선하다는 뜻이다. E가 선하다면 악역은 B·C 중에서 붙어 있어야 하는데, 그 경우 D의 세탁부 정보(B 또는 C가 수사관)가 성립할 수 없다 — B·C가 모두 악역이면 수사관 토큰이 그 자리에 없기 때문이다. 따라서 E의 주장은 거짓이고 E는 악역이다.",
    "③ 악역은 붙어 있으므로(①) 나머지 한 명은 D 또는 A다. A가 악역이라면 B의 수사관 정보(C 또는 D가 탕녀)가 거짓이 되는데, B·C·D가 모두 선한 세계에서 이는 불가능하다. 따라서 악역 쌍은 D와 E다.",
    "④ B의 수사관 정보에 의해 D가 탕녀다. 그러므로 데몬(임프)은 E다. C의 점쟁이 '있음' 정보(D 또는 E에 데몬)와도 정확히 맞아떨어진다.",
  ],
  solution: ["chef", "investigator", "fortuneteller", "scarletwoman", "imp"],
});
