import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 교수 — 시신을 골랐는데 아무도 일어나지 않았다. 되살아나지 않은 시신은
// 마을 주민이 아니었다는 뜻이고, 그 자리는 악역이 아니라 주정뱅이였다.
export default definePuzzle({
  id: "mx-28",
  title: "우물가의 사흘",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 8,
  nights: 3,
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "oracle", "seamstress", "chambermaid", "professor",
    "mayor", "virgin", "slayer", "soldier", "monk", "exorcist", "tealady", "fool", "minstrel",
    "sailor", "innkeeper", "courtier", "gambler", "grandmother",
    "butler", "drunk", "saint", "recluse", "klutz", "tinker",
    "scarletwoman", "baron", "godfather", "devilsadvocate", "eviltwin", "assassin",
    "po", "imp", "zombuul", "shabaloth", "pukka", "nodashii", "vortox", "fanggu", "vigormortis",
  ],
  intro:
    "8인 게임, 3일차 아침. 낮1에 C가 처형됐고, 그날 밤에는 아무도 죽지 않았다. " +
    "낮2에는 처형이 없었고, 밤3에 A와 G와 H가 한꺼번에 죽었다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 1, role: "professor", info: [{ night: 2, data: { type: "professor", target: 2 } }] },
    { seat: 2, role: "fortuneteller", info: [{ night: 1, data: { type: "fortuneteller", targets: [4, 7], yes: false } }] },
    {
      seat: 3, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [3, 6], shownRole: "empath" } }] },
    { seat: 5, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "fortuneteller" } }] },
    { seat: 6, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 1 } }] },
    {
      seat: 7, role: "dreamer", info: [
        { night: 1, data: { type: "dreamer", target: 5, goodRole: "clockmaker", evilRole: "scarletwoman" } },
        { night: 2, data: { type: "dreamer", target: 1, goodRole: "professor", evilRole: "baron" } },
        { night: 3, data: { type: "dreamer", target: 6, goodRole: "clockmaker", evilRole: "devilsadvocate" } },
      ],
    },
  ],
  events: [
    { type: "execution", day: 1, seat: 2 },
    { type: "death", night: 3, seat: 0 },
    { type: "death", night: 3, seat: 6 },
    { type: "death", night: 3, seat: 7 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [4] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "po" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [5] },
    { id: "drunk", text: "주정뱅이는 누구인가?", answerSeats: [2] },
  ],
  hints: [
    "주장과 토큰이 다른 좌석이 몇이나 되는지부터 세어 보라. 외지인을 주장한 사람이 하나도 없다는 사실이 그 수를 정한다.",
    "밤2에 고른 시신이 일어나지 않았다는 것은 그가 악역이었다는 뜻이 아니다. 그보다 약한 말이고, 그 약한 말이 정확히 필요한 만큼 말해 준다.",
  ],
  walkthrough: [
    "① 구성부터 센다. 8인 기본은 마을 주민 5, 외지인 1, 하수인 1, 악마 1이다. 외지인을 주장한 좌석이 하나도 없으니 그 자리는 자기가 무엇인지 모르는 사람이 채웠고, 이 대본에서 마을 주민을 사칭할 수 있는 외지인은 **주정뱅이 하나뿐**이다(광인·미치광이·건달이 없다). 그러므로 **주장과 토큰이 다른 좌석은 정확히 셋 — 주정뱅이·하수인·악마 — 이고 나머지 다섯은 말한 그대로다.** 취함의 원천도 주정뱅이 자신뿐이다 — 독살범은 대본에 없고 선원·여관주인·대신은 아무도 주장하지 않았다.",
    "② 교수 B는 밤2에 C의 시신을 골랐다. 멀쩡한 교수가 고른 시신이 마을 주민이었다면 그는 일어났을 것이다 — 그는 일어나지 않았다. **C는 마을 주민이 아니다.** 즉 C가 ①의 셋 중 하나다. 장의사를 주장한 F가 \"처형된 자는 점쟁이였다\"고 한 말과 정면으로 어긋난다. (B가 주정뱅이라 능력이 헛돌았을 가능성은 몽상가 H의 밤2 \"B는 교수 아니면 남작\"이 막는다 — B의 토큰이 주정뱅이면 H까지 거짓이 되어 어긋난 좌석이 넷이 된다.)",
    "③ 몽상가 H는 밤1에 \"F는 시계공 아니면 탕녀\"라고 했다. 그런데 F는 장의사를 주장했다. 정직한 좌석은 자기 역할을 그대로 말하므로 F의 토큰이 시계공일 수는 없고, 주정뱅이의 토큰은 주정뱅이다. **F가 탕녀다** — 셋 중 둘째를 찾았다. F의 장의사 증언은 통째로 지어낸 것이었다.",
    "④ 셋째가 악마다. 요리사 A의 \"인접한 악인 쌍 하나\"와 시계공 G의 \"악마와 하수인 사이 한 칸\"은 같은 말을 한다 — 악마는 탕녀 F의 옆자리, E 아니면 G다. 초공감자 D는 밤2와 밤3에 모두 \"이웃 중 악 1\"이라고 했는데, C가 죽은 뒤 D의 이웃은 B와 E였다. 악역이 F와 악마 둘뿐인 이상 그 악은 E일 수밖에 없다. **악마는 E다.**",
    "⑤ 그러면 C는 악역이 아니다. ②에서 C는 마을 주민도 아니었다. 남는 자리는 하나 — **C가 주정뱅이였다.** 마을은 결국 무고한 사람을 처형했고, 탕녀 F의 거짓말은 공교롭게도 절반이 맞았다: C는 정말로 자기가 점쟁이인 줄 알고 있었다. 밤1에 그가 내놓은 점괘는 술잔 바닥에서 나온 것이다.",
    "⑥ 종류를 가른다. 밤3에 셋이 한꺼번에 죽었다. 이 판에서 악마 말고 밤에 사람을 죽일 수 있는 것은 하수인 자리의 암살자·대부뿐이다 — 할머니를 주장한 사람이 없고, 외지인 자리는 ⑤의 주정뱅이가 차지해 땜장이도 들어올 수 없다. 그런데 ③에서 하수인은 탕녀로 정해졌다. **세 죽음은 전부 악마 하나의 것이다.**",
    "⑦ 한 밤에 셋을 죽이는 악마는 **포**뿐이다 — 샤발로스는 둘이 한계이고 임프·좀버얼·푸카·노 다시·비고르모르티스·팡 구는 하나다. 포가 셋을 고르는 밤은 '아무도 고르지 않은' 밤 바로 다음인데, 밤2의 침묵이 그 밤이었다. 그 침묵을 설명할 다른 것은 이 판에 없다 — 군인·수도사·구마사제·찻집 여인·어릿광대를 주장한 사람이 하나도 없다.",
    "⑧ 남은 악마 후보도 각각 무너진다. 팡 구는 외지인을 둘로 늘리는데 숨은 외지인은 하나가 한계이고, 비고르모르티스는 외지인 자리를 없애 ⑤의 주정뱅이를 지우며, 보르톡스는 처형 없는 낮이 지난 낮2에 이미 게임을 끝냈을 것이다.",
    "⑨ 검산. 주장과 토큰이 다른 좌석은 C(주정뱅이)·E(포)·F(탕녀) 셋이고, 나머지 다섯의 진술은 이 그리모어에서 전부 참이다. 요리사 A의 한 쌍은 나란히 앉은 E·F이고, 초공감자 D의 세 값은 모두 옆자리 E를 세고 있었으며, 시계공 G의 한 칸도 E와 F 사이였다. 포 E는 마을이 엉뚱한 사람을 처형한 그 밤을 통째로 쉬고, 다음 밤에 셋을 데려갔다.",
  ],
  solution: ["chef", "professor", "drunk", "empath", "po", "scarletwoman", "clockmaker", "dreamer"],
});
