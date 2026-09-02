import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 포 — 조용한 밤은 공짜가 아니었다.
// 포는 '아무도 고르지 않은' 밤 다음에만 세 명을 고른다.
export default definePuzzle({
  id: "mx-17",
  title: "조용한 밤의 값",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 8,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 악마가 세 종류이므로 '누구인가'와 함께 '무엇인가'도 물어야 한다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "clockmaker", "dreamer", "oracle", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp", "po", "shabaloth",
  ],
  intro:
    "8인 게임, 3일차 아침. 낮1에 A가 처형됐다. 밤2에는 아무 일도 없었고 — 밤3에 F·G·H 셋이 한꺼번에 죽었다. " +
    "이 대본의 악마는 임프·포·샤바로스 셋 중 하나이고, 암살자도 대부도 할머니도 없다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [0, 5], shownRole: "baron" } }] },
    { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 4, role: "butler", info: [] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 6], shownRole: "chef" } }] },
    { seat: 6, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "chef" } }] },
    {
      seat: 7, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [2, 3], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [3, 4], yes: false } },
      ],
    },
  ],
  events: [
    { type: "execution", day: 1, seat: 0 },
    { type: "death", night: 3, seat: 5 },
    { type: "death", night: 3, seat: 6 },
    { type: "death", night: 3, seat: 7 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [2] },
    { id: "po", text: "이 판의 악마는 포다. 그 좌석을 고르라", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "한 밤에 셋을 죽일 수 있는 조합을 대본에서 찾아보라. 암살자도 대부도 할머니도 없다면 남는 것은 악마 자신뿐이다.",
    "점쟁이의 두 밤 정보를 겹치면 후보가 하나로 좁혀진다. 그다음 중복 주장을 처리하라.",
  ],
  walkthrough: [
    "① 밤3에 세 사람이 한꺼번에 죽었다. 이 대본에는 암살자도 대부도 할머니도 없으므로 추가 사망을 만들 수단이 없다 — 셋 모두 악마의 손이다. 임프는 하룻밤에 하나, 샤바로스는 최대 둘을 고른다. 셋을 고를 수 있는 것은 포뿐이다.",
    "② 그리고 포의 세 번의 손은 공짜가 아니다. 포는 '아무도 고르지 않은' 밤 다음 밤에만 반드시 세 명을 고른다 — 조용했던 밤2가 그 대가였다. 두 밤은 사실 하나의 사건이었다.",
    "③ 이제 좌석을 찾는다. B와 D가 모두 초공감자를 주장한다 — 토큰은 하나뿐이니 한 명은 악역이다.",
    "④ 선한 점쟁이 H의 밤1 'C·D 중 악마 있음'과 밤2 'D·E 중 악마 없음'을 겹치면 악마는 C다.",
    "⑤ D가 진짜 초공감자라면 '이웃에 악 0명'이 참이어야 하는데 D의 이웃 C가 악마다 — 이 대본에는 주정뱅이도 독살범도 없어 변명할 수 없다. 따라서 D가 악역이고 B가 진짜 초공감자다. D는 악마가 아니므로 탕녀다.",
    "⑥ 확인: 8인 구성의 외지인 한 자리는 스스로 집사를 밝힌 E가 채운다. 선한 세탁부 F의 'A 또는 G가 요리사'와 선한 장의사 G의 '처형된 A의 토큰은 요리사'가 맞물리고, 선한 요리사 A의 '인접 악역 쌍 1'은 나란히 앉은 C와 D를 가리킨다.",
    "⑦ 재구성: 포는 밤2에 일부러 손을 놓았다. 마을이 '드디어 조용한 밤'이라며 안도한 그 하루가, 다음 날 밤 세 사람의 목숨값이었다.",
  ],
  solution: ["chef", "empath", "po", "scarletwoman", "butler", "washerwoman", "undertaker", "fortuneteller"],
});
