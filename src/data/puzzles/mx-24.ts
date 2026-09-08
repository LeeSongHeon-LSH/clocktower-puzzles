import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 보르톡스 — 학자의 두 진술이 둘 다 거짓이다. 멀쩡한 학자에게는 있을 수 없는 일이다.
export default definePuzzle({
  id: "mx-24",
  title: "마을회관의 정오",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 2,
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "oracle", "savant", "mayor", "virgin", "slayer",
    "butler", "saint", "klutz",
    "scarletwoman", "baron",
    "imp", "vortox", "po", "shabaloth", "zombuul",
  ],
  intro:
    "7인 게임, 2일차 아침. 낮1에 마을은 F를 처형했고, 그날 밤 C가 죽었다. " +
    "7인 구성에 외지인은 0명이고, 대본에는 독살범도 주정뱅이도 광인도 미치광이도 없다 — " +
    "선한 사람의 정보를 틀리게 만들 수 있는 것은 악마 자신뿐이다. " +
    "A는 낮1에 학자로서 두 문장을 내놓았다.",
  claims: [
    {
      seat: 0, role: "savant", info: [
        { night: 1, data: { type: "savant", statements: [{ kind: "isDemon", seat: 1 }, { kind: "roleInPlay", role: "baron" }] } },
      ],
    },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 0 } },
      ],
    },
    { seat: 2, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 3, role: "dreamer", info: [{ night: 1, data: { type: "dreamer", target: 5, goodRole: "washerwoman", evilRole: "scarletwoman" } }] },
    { seat: 4, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 3 } }] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [1, 6], shownRole: "chef" } }] },
    {
      seat: 6, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [4, 5], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [0, 1], yes: false } },
      ],
    },
  ],
  events: [
    { type: "execution", day: 1, seat: 5 },
    { type: "death", night: 2, seat: 2 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [3] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "vortox" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "학자는 매일 낮 두 문장을 내놓고, 멀쩡하다면 그중 정확히 하나가 참이다. 두 문장이 각각 참일 수 있는지를 따로 따져 보라.",
    "둘 다 거짓인 세계가 딱 한 종류 있다.",
  ],
  walkthrough: [
    "① 7인 기본 구성은 마을 주민 5, 외지인 0, 하수인 1, 악마 1이다. 남작이 판에 있다면 외지인이 둘이어야 하는데, 외지인을 주장한 사람도 없고 주민을 사칭해 숨을 수 있는 역할(주정뱅이·광인·미치광이·건달)도 대본에 없다. **학자 A의 둘째 문장 '남작이 판에 있다'는 거짓이다.** 그러므로 A가 멀쩡한 학자라면 첫째 문장 'B가 악마다'는 참이어야 한다.",
    "② B가 악마라고 해 보자. 점쟁이 G가 선하다면 밤2의 'A와 B 중 악마는 없다'가 참이어야 하는데 B가 악마다 — 모순이다. 그러니 G가 악역, 즉 하수인이어야 하고 악역은 B와 G로 다 찬다. 그러면 시계공 E는 선하고 그 '악마와 하수인은 세 자리'가 참이어야 하는데 B와 G 사이는 두 자리다. **B는 악마가 아니고, 따라서 학자의 두 문장은 둘 다 거짓이다.**",
    "③ 멀쩡한 학자에게 두 문장이 모두 거짓인 일은 일어나지 않는다. 대본에 독살범도 주정뱅이도 없으니 학자를 취하게 할 수단은 악마뿐이고, 남은 가능성은 둘이다 — A가 학자를 사칭한 악역이거나, **보르톡스가 판에 있어 마을 주민의 정보가 전부 거짓이거나.**",
    "④ 먼저 보르톡스가 없는 세계를 닫는다. 그 세계에서는 선한 사람의 말이 전부 참이다. A가 악역이라면 초공감자 B의 밤2 '이웃(A·D) 중 악 0명'이 A를 선하다고 말하므로 B도 악역이어야 하고, 그러면 악역은 나란히 앉은 A와 B다 — 요리사 C의 '인접 악역 쌍 0'이 깨진다. A가 선하다면 ①에 의해 'B가 악마다'가 참이어야 하는데 ②에서 닫았다. **보르톡스가 없는 세계는 없다.**",
    "⑤ 그러면 이 판에 보르톡스가 있고, 살아 있는 마을 주민의 정보는 예외 없이 **거짓**이다. 여기서부터는 모든 주장을 뒤집어 읽는다. 낮1에 처형이 있었다는 것도 중요하다 — 처형 없는 낮이 지나면 그 순간 악이 이기므로, 보르톡스 세계는 지나간 낮마다 처형이 있어야만 성립한다.",
    "⑥ 점쟁이 G의 밤1 '예'(E와 F 중 악마 있음)가 거짓이므로 **E도 F도 악마가 아니다.** 학자의 첫 문장이 거짓이므로 B도 악마가 아니다. C는 밤2에 죽었는데 악마는 자기 손에 죽지 않으니 C도 아니다(스타 패스는 임프만 하고, 이 판의 악마는 보르톡스다). 남은 후보는 A·D·G다.",
    "⑦ A가 악마라면, 초공감자 B의 밤1 '이웃 중 악 1명'이 거짓이어야 하므로 이웃 A·C 중 악이 0명이거나 2명 — A가 악마이니 C도 하수인이다. 그러면 몽상가를 주장한 D가 선한 마을 주민인데, 'F는 선한 세탁부 아니면 악한 탕녀'가 F가 실제로 선한 세탁부인 이 배치에서 참이 되어 버린다. 모순이다.",
    "⑧ G가 악마라면 같은 식으로 B의 밤2 '이웃(A·D) 중 악 0명'이 거짓이어야 하니 D가 하수인이고, 그러면 시계공을 주장한 E가 선한 마을 주민인데 '악마와 하수인은 세 자리'가 G(6)와 D(3) 사이에서 정확히 참이 된다 — 역시 모순이다. **악마는 D이고, 보르톡스다.**",
    "⑨ 하수인을 찾는다. 요리사 C의 '인접 악역 쌍 0'이 거짓이므로 나란히 앉은 악역 쌍이 있고, 하수인은 D의 옆자리 — C 아니면 E다. C가 하수인이라면 초공감자 B의 밤1 '이웃 중 악 1명'이 이웃 A(선)·C(악)에서 참이 되어 버린다. **하수인은 E다.**",
    "⑩ 재구성: 보르톡스 D는 몽상가를, 탕녀 E는 시계공을 사칭하고 나란히 앉았다. 마을이 낮1에 처형한 F는 진짜 세탁부였고, 그날 밤 죽은 C는 진짜 요리사였다 — 두 사람이 남긴 말이 전부 뒤집힌 채로 남아 있었을 뿐이다. 학자 A가 정오에 내놓은 두 문장이 둘 다 거짓이었던 것, 그것이 이 판의 유일한 정직한 신호였다.",
  ],
  solution: ["savant", "empath", "chef", "vortox", "scarletwoman", "washerwoman", "fortuneteller"],
});
