import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 푸카 — 밤1에 깨어난 악역이 있다. 이 대본에서 밤1에 깨어나는 악역은 푸카뿐이다.
// (임프·포·샤바로스·좀부울은 밤2부터, 하수인 후보 넷은 아예 깨지 않는다.)
export default definePuzzle({
  id: "mx-23",
  title: "여관 이층의 사흘",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 하수인 후보(탕녀·남작·악의 쌍둥이)는 모두 밤에 깨지 않는다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker",
    "ravenkeeper", "clockmaker", "dreamer", "oracle", "chambermaid", "mayor", "virgin", "slayer",
    "butler", "saint", "klutz",
    "scarletwoman", "baron", "eviltwin",
    "imp", "pukka", "po", "shabaloth", "zombuul", "vortox",
  ],
  intro:
    "7인 게임, 3일차 아침. 마을은 이틀 동안 아무도 처형하지 못했고, 밤2에 B가, 밤3에 A가 죽었다. " +
    "7인 구성에 외지인은 0명이고 대본에 남작 말고는 구성을 바꾸는 것이 없다 — 주정뱅이도 광인도 있을 수 없다. " +
    "독살범도 첩자도 은둔자도 없다. 시장을 주장하는 사람이 둘이라는 것을 기억하라.",
  claims: [
    {
      seat: 0, role: "chambermaid", info: [
        { night: 1, data: { type: "chambermaid", targets: [1, 3], count: 1 } },
        { night: 2, data: { type: "chambermaid", targets: [3, 5], count: 0 } },
      ],
    },
    { seat: 1, role: "mayor", info: [] },
    {
      seat: 2, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 3, role: "mayor", info: [] },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 2], shownRole: "chambermaid" } }] },
    { seat: 5, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 6, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [1, 4], shownRole: "scarletwoman" } }] },
  ],
  events: [
    { type: "death", night: 2, seat: 1 },
    { type: "death", night: 3, seat: 0 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [3] },
    { id: "demonType", text: "그 악마는 어떤 악마인가?", answerRole: "pukka" },
    { id: "minion", text: "하수인은 누구인가?", answerSeats: [4] },
  ],
  hints: [
    "시장은 밤에 깨어나지 않는다. 그런데 객실 청소부는 밤1에 누군가 깨어나는 것을 보았다.",
    "이 대본의 악마 다섯 중 넷은 밤2가 되어서야 처음 깨어난다.",
  ],
  walkthrough: [
    "① 7인 구성은 마을 주민 5, 외지인 0, 하수인 1, 악마 1이다. 남작이 판에 있으면 외지인이 둘이어야 하는데, 외지인을 주장한 사람도 없고 주민을 사칭해 숨을 수 있는 역할(주정뱅이·광인·미치광이·건달)도 대본에 없다 — **남작은 판에 없고, 외지인도 없다.** 악역은 정확히 둘이다.",
    "② 밤1의 말은 전부 믿어도 된다. 대본에 독살범도 첩자도 은둔자도 주정뱅이도 없고, 스스로 중독시키는 악마는 푸카 하나뿐인데 푸카가 밤1에 고른 좌석은 밤2에 죽은 좌석 — 즉 B다. B는 아무 정보도 내지 않았다. (반면 **밤2·밤3의 말은 다르다.** 밤2에 고른 좌석은 밤3에 죽은 A이고, 마지막 밤에는 누가 중독됐는지 알 길이 없다.)",
    "③ B와 D가 둘 다 시장을 주장한다. 토큰은 하나뿐이니 한 명은 악역이다.",
    "④ 객실 청소부 A는 밤1에 **B와 D 중 정확히 한 명이 깨어났다**고 말한다. 시장은 밤에 깨어나지 않고 주정뱅이도 없으니, 깨어난 쪽은 자기 역할을 감춘 악역이다. 그런데 이 대본에서 **밤1에 깨어나는 악역은 푸카뿐이다** — 임프·포·샤바로스·좀부울·보르톡스는 모두 밤2부터 움직이고, 탕녀·남작·악의 쌍둥이는 아예 깨지 않는다. 그러니 A가 정직하다면 악마는 B 아니면 D이고, 그 악마는 푸카다.",
    "⑤ 먼저 A를 의심해 보자. A가 악역이라면, 세탁부 E의 밤1 'A와 C 중 하나가 객실 청소부'가 거짓이 되므로 E도 악역이다 — 악역 둘이 A와 E로 차고 요리사 F는 선하다. 그런데 F는 '나란히 앉은 악역 쌍이 하나 있다'고 했고 A와 E 사이에는 세 자리가 있다. 모순이다. **A는 정직한 객실 청소부다.**",
    "⑥ 수사관 G(밤1)는 '하수인은 B 아니면 E'라고 한다. G가 악역이라면 G는 하수인이거나 악마인데, 악마는 ④에서 B 아니면 D이므로 G는 하수인이어야 한다 — 그러면 요리사 F가 선하고, F의 '인접 악역 쌍'은 악마가 G(6)의 옆자리여야 한다고 말한다. B(1)도 D(3)도 G의 옆이 아니다. 모순이다. **G도 정직하다 — 하수인은 B 아니면 E다.**",
    "⑦ 악마가 B라면 하수인은 E여야 하는데(⑥, B는 악마이므로), B(1)와 E(4)는 붙어 있지 않아 요리사 F의 '인접 악역 쌍 하나'가 깨진다. F까지 악역이면 악역이 셋이 된다. **따라서 악마는 D이고, D는 푸카다.** 하수인은 D의 옆자리이면서 B 아니면 E여야 하니 **E**다. 초공감자 C의 밤1 '이웃 중 악 1명'(이웃은 B와 D)도 D 쪽을 가리킨다.",
    "⑧ 마지막으로 밤2의 어긋남이 그 이름을 확인해 준다. A는 밤2에 'D와 F 중 아무도 깨어나지 않았다'고 했지만 D는 그 밤에도 깨어 있었다 — **A는 그때 이미 푸카의 독을 받고 있었고, 그래서 다음 밤에 죽었다.** 푸카는 밤 n에 고른 사람을 중독시키고 그 다음 밤에 죽인다. 밤1에 고른 B가 밤2에 죽었고, 밤2에 고른 A가 밤3에 죽었다.",
    "⑨ 재구성: 푸카 D는 시장을 사칭해 정직한 시장 B와 나란히 섰고, 옆자리 탕녀 E가 세탁부를 자처하며 그를 받쳤다. 마을이 끝내 아무도 처형하지 못한 사이, 첫날 밤부터 깨어 있던 발소리 하나가 객실 청소부의 장부에 남았다.",
  ],
  solution: ["chambermaid", "mayor", "empath", "pukka", "scarletwoman", "chef", "investigator"],
});
