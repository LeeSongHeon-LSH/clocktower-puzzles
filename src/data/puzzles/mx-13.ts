import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 좀부울 — 대본에 악마가 셋이다. 죽음의 리듬이 그중 하나를 지목한다.
// 좀부울은 직전 낮에 처형으로 죽은 사람이 있으면 그 밤 아예 깨어나지 않는다.
export default definePuzzle({
  id: "mx-13",
  title: "사흘째 종소리",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 7,
  nights: 3,
  // 대본 — 풀이 화면에 공개된다. 악마가 세 종류이므로 '누구인가'와 함께 '무엇인가'도 물어야 한다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "clockmaker", "dreamer", "oracle", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp", "vortox", "zombuul",
  ],
  intro:
    "7인 게임, 3일차 아침. 낮1에 마을은 A를 처형했다. 그날 밤은 아무 일도 없었다. " +
    "낮2에는 처형이 없었고, 그날 밤 E가 죽었다. " +
    "이 대본의 악마는 임프·보르톡스·좀부울 셋 중 하나다. 그리고 군인도 수도사도 구마사제도 독살범도 없다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    {
      seat: 1, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
        { night: 3, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 2, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [0, 4], shownRole: "baron" } }] },
    { seat: 3, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 4, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 5], shownRole: "chef" } }] },
    { seat: 5, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "chef" } }] },
    {
      seat: 6, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [2, 3], yes: true } },
        { night: 3, data: { type: "fortuneteller", targets: [3, 5], yes: false } },
      ],
    },
  ],
  events: [
    { type: "execution", day: 1, seat: 0 },
    { type: "death", night: 3, seat: 4 },
  ],
  questions: [
    { id: "demon", text: "악마는 누구인가?", answerSeats: [2] },
    { id: "zombuul", text: "이 판의 악마는 좀부울이다. 그 좌석을 고르라", answerSeats: [2] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "밤2가 조용했던 이유부터 따지라. 이 대본에서 악마의 손을 막을 수 있는 역할은 하나도 없다 — 그렇다면 막힌 것이 아니라 애초에 깨어나지 않은 것이다.",
    "보르톡스 세계는 처형 없는 낮이 지나는 순간 악의 승리로 끝난다. 낮2를 보라.",
  ],
  walkthrough: [
    "① 밤2에 아무도 죽지 않았다. 이 대본에는 군인·수도사·구마사제·찻집 여인·선원·여관주인·어릿광대·독살범이 없다. 임프였다면 그 밤을 설명할 방법이 아예 없다.",
    "② 보르톡스도 아니다. 보르톡스가 판에 있으면 처형 없는 낮이 지나는 순간 악이 승리하는데, 낮2에는 처형이 없었고 게임은 3일차 아침까지 이어졌다.",
    "③ 남은 것은 좀부울이다. 좀부울은 직전 낮에 처형으로 죽은 사람이 있으면 그 밤 아예 깨어나지 않는다 — 낮1에 A를 처형했으니 밤2는 조용했고, 낮2에 처형이 없었으니 밤3에 다시 손을 뻗었다. 죽음의 리듬 자체가 악마의 이름이었다.",
    "④ 이제 좌석을 찾는다. B와 D가 모두 초공감자를 주장한다 — 토큰은 하나뿐이니 한 명은 악역이다.",
    "⑤ 선한 점쟁이 G의 밤1 'C·D 중 악마 있음'과 밤3 'D·F 중 악마 없음'을 겹치면 악마는 C다.",
    "⑥ D가 진짜 초공감자라면 '이웃에 악 0명'이 참이어야 하는데, D의 이웃 C가 악마다 — 모순이다. 이 대본에는 주정뱅이도 독살범도 없어 변명할 길이 없다. 따라서 D가 악역이고 B가 진짜 초공감자다. D는 악마가 아니므로 하수인 — 탕녀다.",
    "⑦ 확인: 선한 초공감자 B의 세 밤 연속 1은 이웃 중 악마 C를 계속 세고 있었던 것이고, 밤3에 A가 이미 처형돼 이웃이 G와 C로 바뀐 뒤에도 값은 그대로다. 선한 요리사 A의 '인접 악역 쌍 1'은 나란히 앉은 C와 D를 가리키며, 세탁부 E와 장의사 F의 증언이 A가 진짜 요리사임을 받쳐 준다.",
    "⑧ 재구성: 좀부울 C는 수사관을 사칭하며 A와 E에게 혐의를 씌웠다. 마을은 그 말에 넘어가 진짜 요리사 A를 처형했고 — 그 처형이 공교롭게도 악마를 하룻밤 재웠다.",
  ],
  solution: ["chef", "empath", "zombuul", "scarletwoman", "washerwoman", "undertaker", "fortuneteller"],
});
