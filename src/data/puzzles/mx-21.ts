import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 좀부울의 가짜 죽음 — 처형한 그 사람이 지금도 악마다.
// 대본에 탕녀가 없으므로 승계는 불가능하고, 그렇다면 악마는 애초에 죽지 않은 것이다.
export default definePuzzle({
  id: "mx-21",
  title: "장터에 도는 이야기",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 7,
  // 대본 — 풀이 화면에 공개된다. 취함·중독 원천도, 등록을 흔드는 은둔자·첩자도 없다.
  // 하수인 후보 셋은 모두 관측 가능한 흔적을 남기지 않는 역할이고, 탕녀는 일부러 뺐다.
  nights: 3,
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "oracle", "mayor", "virgin", "slayer",
    "butler", "saint", "klutz",
    "devilsadvocate", "witch", "eviltwin",
    "imp", "zombuul", "po", "shabaloth", "vortox", "nodashii",
  ],
  intro:
    "7인 게임, 3일차 아침. 낮1에 마을은 D를 처형했다. 그날 밤은 조용했고, 낮2에는 아무도 처형하지 못했으며, " +
    "밤3에 A가 죽었다. 7인 구성에 외지인은 0명이고 대본에는 남작도 대부도 없다 — 주정뱅이도 광인도 있을 수 없다. " +
    "독살범도 첩자도 은둔자도 없으니 선한 사람의 말은 전부 참이고 등록도 흔들리지 않는다. " +
    "그리고 이 대본에는 탕녀가 없다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 1, role: "clockmaker", info: [{ night: 1, data: { type: "clockmaker", steps: 1 } }] },
    {
      seat: 2, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 3, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 2], shownRole: "chef" } }] },
    { seat: 4, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
    { seat: 5, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [4, 6], shownRole: "devilsadvocate" } }] },
    { seat: 6, role: "mayor", info: [] },
  ],
  events: [
    { type: "execution", day: 1, seat: 3 },
    { type: "death", night: 3, seat: 0 },
  ],
  questions: [
    { id: "demon", text: "지금 이 순간의 악마는 누구인가?", answerSeats: [3] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "zombuul" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "요리사를 주장하는 사람이 둘이다. 둘 중 누가 거짓말을 하고 있는지부터 가르면 악역 둘의 자리가 잡힌다.",
    "악마의 자리를 찾은 다음, 그 자리가 이미 죽은 자리라면 대본에서 승계 수단을 찾아보라 — 없다면 죽음 쪽을 의심해야 한다.",
  ],
  walkthrough: [
    "① 7인 구성은 마을 주민 5, 외지인 0, 하수인 1, 악마 1이다. 대본에 남작·대부·팡 구가 없으니 외지인 자리는 0으로 고정이고, 그러면 주정뱅이·광인·미치광이 같은 숨은 외지인도 존재할 수 없다. 독살범도 첩자도 은둔자도 없다 — **선한 좌석의 주장은 예외 없이 참이고, 악으로 보이거나 선으로 보이는 오등록도 없다.** 악역은 정확히 둘이다.",
    "② A와 E가 둘 다 요리사를 주장한다. 토큰은 하나뿐이니 둘 중 하나는 악역이다.",
    "③ 수사관 F가 악마라고 해 보자. 그러면 남은 악역 하나가 하수인인데, 선한 초공감자 C의 밤1 '이웃 중 악 1명'은 그 하수인이 B 아니면 D라고 말한다 — 둘 다 F의 옆자리가 아니다. 나란히 앉은 악역 쌍이 없으니 요리사 A의 '1'이 거짓이 되고, A까지 악역이면 악역이 셋이 된다. 모순이다.",
    "④ F가 하수인이라면 악마는 B 아니면 D여야 하는데(C의 밤1), D라면 시계공 B의 '악마와 하수인은 한 자리'가 D–F 두 자리로 깨지고, B라면 B와 F가 떨어져 앉아 요리사 A의 '1'이 다시 깨진다. **F는 정직한 수사관이고, 하수인은 E 아니면 G다.**",
    "⑤ A가 악역이라고 해 보자. A가 악마라면 하수인은 B 아니면 D인데(C의 밤1), 하수인이 B면 A와 B가 나란히 앉아 요리사 E의 '0'이 깨지고, 하수인이 D면 ④에서 얻은 '하수인은 E 아니면 G'에 어긋난다. A가 하수인이어도 ④에 어긋난다. **따라서 A가 진짜 요리사이고, ②에 의해 E가 악역 — 즉 ④의 하수인은 E다.**",
    "⑥ 남은 악마 자리를 찾는다. E가 악마라면 하수인은 ④에 따라 G여야 하는데, 시계공 B의 '악마와 하수인은 한 자리 떨어져 있다'가 E–G 두 자리로 깨진다 — E는 하수인이다. 그 한 자리 규칙에서 악마는 E의 옆자리인 D 아니면 F인데, F는 ④에서 선하다. **악마는 D다.** 요리사 A의 '인접한 악역 쌍 하나'도, 초공감자 C의 세 밤 연속 '이웃 중 악 1명'도(밤1엔 옆자리 D, D가 죽은 뒤로는 그 너머의 E) 나란히 앉은 D·E를 가리킨다.",
    "⑦ 그런데 D는 낮1에 처형됐고, 밤3에 A가 죽었다. 악마가 죽었는데도 사람이 계속 죽는다면 누군가 악마 자리를 이어받았어야 하는데 — **이 대본에는 탕녀가 없다.** 팡 구의 점프도 없고(대본에 없다), 마스터마인드의 하루 연장도 없다. 이어받은 사람이 없다면 답은 하나뿐이다: 그 죽음이 진짜가 아니었다.",
    "⑧ 첫 죽음이 가짜인 악마는 좀부울뿐이다. 좀부울은 처형된 척 토큰을 넘기고 비밀리에 살아남는다. 죽음의 리듬도 그것을 받쳐 준다 — 좀부울은 직전 낮에 처형이 있었으면 그 밤 깨어나지 않으므로 밤2가 조용했고, 낮2에 처형이 없자 밤3에 다시 손을 뻗어 A를 죽였다. 임프·포·샤바로스·노 다시라면 처형과 함께 정말로 죽어 게임이 끝났을 것이고, 보르톡스라면 처형 없이 지나간 낮2에 이미 악이 승리했을 것이다.",
    "⑨ 재구성: 좀부울 D는 세탁부를 사칭하며 A가 진짜 요리사임을 확인해 주는 척했고, 그 덕에 마을은 요리사를 사칭한 하수인 E 대신 D를 처형했다 — 마을이 악마를 처형하고도 이기지 못한 이유가 그것이다. 지금 이 순간에도 악마는 D이고, 그 옆에서 E가 여전히 살아 있다.",
  ],
  solution: ["chef", "clockmaker", "empath", "zombuul", "devilsadvocate", "investigator", "mayor"],
});
