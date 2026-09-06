import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 비고르모르티스 — 외지인을 주장한 사람이 하나뿐인데 그가 거짓말쟁이다.
// 그리고 악마가 밤에 죽인 것은 자기 하수인이었다.
export default definePuzzle({
  id: "mx-20",
  title: "여섯 개의 이름",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 6,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  // 취하게 하거나 중독시키는 수단은 비고르모르티스 자신뿐이다 — 독살범도 주정뱅이도
  // 노 다시도 푸카도 넣지 않았다. 그래야 틀린 정보의 범인이 하나로 수렴한다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller",
    "undertaker", "ravenkeeper", "clockmaker", "dreamer", "oracle", "mayor", "soldier",
    "butler", "saint", "recluse",
    "scarletwoman",
    "imp", "zombuul", "po", "shabaloth", "vortox", "vigormortis",
  ],
  intro:
    "6인 게임, 2일차 아침. 어제 낮에는 아무도 처형하지 못했고, 밤사이 C가 죽었다. " +
    "6인 구성이라면 외지인이 정확히 1명 있어야 하는데 외지인을 주장한 사람은 죽은 C뿐이었고, " +
    "이 대본에는 주정뱅이도 광인도 미치광이도 건달도 없다 — 마을 주민인 척 숨어 있을 외지인은 없다. " +
    "요리사를 주장하는 사람이 둘이라는 것도 기억하라. 대본의 악마는 여섯 종류다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 2, role: "butler", info: [] },
    { seat: 3, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 4, role: "mayor", info: [] },
    { seat: 5, role: "soldier", info: [] },
  ],
  events: [{ type: "death", night: 2, seat: 2 }],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [3] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "vigormortis" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [2] },
  ],
  hints: [
    "요리사 주장이 둘이라는 사실과, 초공감자의 수치가 밤1의 1에서 밤2의 0으로 내려갔다는 사실. 이 둘을 동시에 만족시킬 수 있는지부터 따져 보라.",
    "집사를 주장한 C가 정말 집사였다고 해 보라. 그러면 이 대본에는 선한 사람의 정보를 틀리게 만들 수단이 하나도 남지 않는다.",
  ],
  walkthrough: [
    "① 6인 기본 구성은 마을 주민 3 · 외지인 1 · 하수인 1 · 악마 1이다. 이 대본에서 그 수를 바꿀 수 있는 것은 외지인을 하나 줄이는 비고르모르티스뿐이다 — 남작도 대부도 팡 구도 없다.",
    "② 요리사 토큰은 하나뿐인데 A와 D가 둘 다 요리사를 주장한다. 둘 중 하나는 반드시 악역이다.",
    "③ C가 진짜 집사라고 해 보자. 그러면 외지인 자리가 채워졌으니 악마는 비고르모르티스가 아니고, 이 대본에는 취하게 하거나 중독시킬 수단이 하나도 남지 않는다. 보르톡스라면 마을 주민의 정보가 전부 거짓이 되지만, 보르톡스가 판에 있는 게임은 처형 없는 낮에 그대로 끝난다 — 어제 낮에는 처형이 없었다. 즉 이 가정에서는 선한 사람의 정보가 예외 없이 참이다.",
    "④ 그 가정 위에서 초공감자 B를 보자. 밤2에 C가 죽어 B의 이웃은 A와 C에서 A와 D로 바뀌었다. B가 선하다면 밤2의 '0'은 A와 D가 둘 다 선하다는 뜻인데, ②에 어긋난다. 그러니 B가 악역이어야 하고, 나머지 악역 하나는 ②에 의해 A 아니면 D다. A라면 D가 진짜 요리사이고 그 '인접 악역 쌍 0'이 참이어야 하는데 A와 B는 나란히 앉아 있다. D라면 A가 진짜 요리사이고 그 '인접 악역 쌍 1'이 참이어야 하는데 B와 D는 떨어져 앉아 있다. 어느 쪽도 안 된다 — **C는 집사가 아니었다.**",
    "⑤ 그러면 외지인을 주장한 선한 사람이 아무도 없다. 숨어 있을 외지인도 대본에 없으니 외지인 자리 자체가 없어야 하고, ①에 의해 그렇게 만드는 것은 **비고르모르티스**뿐이다. 구성은 마을 주민 4 · 하수인 1 · 악마 1이고, C는 외지인을 사칭한 악역이다.",
    "⑥ 악역은 C와, ②에 의해 A 아니면 D다. A라면 초공감자 B의 밤1 수치가 이웃 A와 C 둘 다 악이 되어 2여야 한다 — 밤1에는 아직 아무도 죽지 않았으니 비고르모르티스의 독도 아직 없고, B의 그 수치는 참이어야 한다. 모순이므로 **악역은 C와 D**다.",
    "⑦ 밤에 죽은 것은 C다. 악마는 밤에 저 혼자 죽지 않으므로 C가 하수인이고, **D가 비고르모르티스**다. 자기 하수인을 죽인 것이다.",
    "⑧ 확인: 초공감자 B의 밤2 '0'이 왜 틀렸는지가 여기서 나온다. 비고르모르티스에게 죽은 하수인은 능력을 유지한 채, 양옆에서 가장 가까운 마을 주민 하나를 계속 중독시킨다 — 죽은 C의 한쪽 이웃이 바로 B다. 그 밤 B는 이미 중독돼 있었고, 실제 수치는 새 이웃이 된 악마 D 때문에 1이었다. 밤1의 '1'은 아직 멀쩡할 때 옆자리 C를 센 참값이다.",
  ],
  solution: ["chef", "empath", "scarletwoman", "vigormortis", "mayor", "soldier"],
});
