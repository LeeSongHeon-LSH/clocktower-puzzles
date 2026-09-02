import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움: 푸카 — 죽은 사람이 죽기 직전 밤에 낸 정보가 틀렸다.
// 푸카는 밤 n에 고른 사람을 중독시키고, 그 다음 밤에 죽인다.
export default definePuzzle({
  id: "mx-14",
  title: "남은 자들의 아침",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 악마가 세 종류이므로 '누구인가'와 함께 '무엇인가'도 물어야 한다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "clockmaker", "dreamer", "oracle", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp", "shabaloth", "pukka",
  ],
  intro:
    "7인 게임, 4일차… 가 아니라 3밤이 지난 아침. 낮1에 D가 처형됐고, 밤2에 B가, 밤3에 E가 죽었다. " +
    "B는 죽기 전날 밤 '내 이웃 둘이 모두 악하다'고 말했다. " +
    "이 대본의 악마는 임프·샤바로스·푸카 셋 중 하나이고, 주정뱅이도 독살범도 없다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 1, role: "empath", info: [{ night: 1, data: { type: "empath", count: 2 } }] },
    { seat: 2, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [0, 4], shownRole: "baron" } }] },
    { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 5], shownRole: "chef" } }] },
    { seat: 5, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "scarletwoman" } }] },
    {
      seat: 6, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [2, 3], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [4, 5], yes: false } },
      ],
    },
  ],
  events: [
    { type: "execution", day: 1, seat: 3 },
    { type: "death", night: 2, seat: 1 },
    { type: "death", night: 3, seat: 4 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [2] },
    { id: "pukka", text: "이 판의 악마는 푸카다. 그 좌석을 고르라", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "B의 '이웃에 악 2명'을 참이라고 가정하고 끝까지 밀어 보라. 장의사의 증언과 부딪히는 지점이 나온다.",
    "선한 사람의 정보가 틀렸다면 누군가 그를 취하게 하거나 중독시켰다는 뜻이다. 이 대본에서 그럴 수 있는 것은 악마 자신뿐이고, 셋 중 중독시키는 악마는 하나뿐이다.",
  ],
  walkthrough: [
    "① B의 수치 2는 이웃이 A와 C 둘뿐이므로 '둘 다 악하다'는 뜻이다. 그 말이 참이라면 악역 자리가 A와 C로 다 차고 나머지는 전부 선하다. 그런데 선한 장의사 F는 처형된 D의 토큰을 탕녀로 보았다 — D까지 악역이 되어 셋이 된다. 모순이므로 B의 수치는 거짓이다.",
    "② 이 대본에는 주정뱅이도 독살범도 없다. 선한 사람이 틀린 정보를 내려면 악마가 직접 중독시켰어야 하는데, 임프에게도 샤바로스에게도 중독 능력이 없다. 남은 것은 푸카뿐이다.",
    "③ 푸카는 밤 n에 고른 사람을 그 밤부터 중독시키고, 그 다음 밤에 죽인다. B는 밤1에 선택당해 헛것을 말했고 밤2에 죽었다 — 죽기 직전 밤의 정보가 이미 중독된 정보였던 것이다. 밤3의 E도 같은 방식으로 밤2에 선택당했다.",
    "④ 이제 좌석을 찾는다. 선한 장의사 F의 증언에 따라 처형된 D가 탕녀다.",
    "⑤ 선한 점쟁이 G의 밤1 'C·D 중 악마 있음'에서 D는 하수인이므로 악마는 C다. G의 밤2 'E·F 중 악마 없음'도 이와 어긋나지 않는다.",
    "⑥ 확인: 선한 요리사 A의 '인접 악역 쌍 1'은 나란히 앉은 C와 D를 가리키고, 세탁부 E의 'A 또는 F가 요리사'는 A를 가리킨다. C의 수사관 주장은 자신을 지키려는 거짓이었다.",
    "⑦ 재구성: 푸카 C는 이웃을 하나씩 지목해 이틀에 걸쳐 죽였다. B가 마지막으로 남긴 엉터리 수치는 거짓말이 아니라 이미 중독된 사람의 진심이었고, 그 어긋남 자체가 악마의 종류를 알려 주는 지문이었다.",
  ],
  solution: ["chef", "empath", "pukka", "scarletwoman", "washerwoman", "undertaker", "fortuneteller"],
});
