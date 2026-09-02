import { definePuzzle } from "@/lib/puzzles/schema";

// 보통: 구마사제 — 아무도 죽지 않은 밤에는 반드시 이유가 있다.
// 이 대본에는 군인도 수도사도 독살범도 없다. 악마를 막을 수 있었던 것은 하나뿐이다.
export default definePuzzle({
  id: "mx-07",
  title: "잠들지 못한 악마",
  edition: "mixed",
  difficulty: "normal",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper",
    "exorcist", "grandmother", "gambler", "chambermaid", "mayor",
    "butler", "recluse", "saint",
    "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 게임, 2일차 아침. 어제 낮 마을은 A를 처형했다. 그리고 밤에는 — 아무 일도 없었다. " +
    "이 대본에 군인도, 수도사도, 찻집 여인도, 독살범도 없다는 것을 기억하라. " +
    "악마가 손을 뻗지 못한 밤에는 그것을 막은 사람이 있다.",
  claims: [
    { seat: 0, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 1, role: "exorcist", info: [{ night: 2, data: { type: "exorcist", target: 4 } }] },
    {
      seat: 2, role: "empath", info: [
        { night: 1, data: { type: "empath", count: 1 } },
        { night: 2, data: { type: "empath", count: 1 } },
      ],
    },
    { seat: 3, role: "investigator", info: [{ night: 1, data: { type: "investigator", targets: [5, 6], shownRole: "baron" } }] },
    { seat: 4, role: "empath", info: [{ night: 1, data: { type: "empath", count: 0 } }] },
    { seat: 5, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [0, 2], shownRole: "chef" } }] },
    { seat: 6, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "chef" } }] },
  ],
  events: [{ type: "execution", day: 1, seat: 0 }],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [4] },
    { id: "scarletwoman", text: "탕녀는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "조용한 밤을 설명할 수 있는 역할을 대본에서 하나씩 지워 보라. 남는 것이 하나뿐이라면, 그 사람의 기록은 곧 사실이다.",
    "초공감자를 주장하는 사람이 둘이다. 한쪽이 악마라면 다른 쪽의 수치가 무엇을 가리키는지 보라.",
  ],
  walkthrough: [
    "① 밤2에 아무도 죽지 않았다. 악마의 킬이 실패하는 경우를 대본에서 따져 보면 — 군인·수도사·찻집 여인·선원·여관주인·어릿광대·독살범이 모두 없다. 남은 것은 구마사제의 봉쇄 하나뿐이다.",
    "② 그러므로 B는 진짜 구마사제이고 그 밤 멀쩡했으며, B가 지목한 E가 악마다. 구마사제가 악마를 짚었기 때문에 악마는 아예 깨어나지 못했다.",
    "③ C와 E가 모두 초공감자를 주장한다. E는 임프이므로 C가 진짜 초공감자다.",
    "④ 선한 C의 수치는 두 밤 모두 1이다. C의 이웃은 B와 D인데 B는 구마사제로 선하므로, D가 악하다 — D가 남은 악역, 곧 하수인이다.",
    "⑤ 이 대본의 하수인은 남작과 탕녀다. 남작이 있으면 외지인이 2명이어야 하는데, 외지인을 주장하는 사람도 없고 정체를 감출 수 있는 주정뱅이·광인도 대본에 없다 — 외지인 2명을 앉힐 자리가 없으므로 D는 탕녀다.",
    "⑥ 확인: 선한 세탁부 F의 'A 또는 C가 요리사'와 선한 장의사 G의 '처형된 A의 토큰은 요리사'가 서로를 받쳐 준다. 선한 요리사 A의 '인접 악역 쌍 1'은 나란히 앉은 D와 E를 정확히 가리킨다.",
    "⑦ 재구성: 임프 E는 초공감자를 사칭했고 탕녀 D는 수사관 행세로 선한 F와 G를 겨눴다. 마을은 엉뚱하게 진짜 요리사 A를 처형했지만, 그날 밤 구마사제가 조용히 악마의 이름을 짚었다 — 아무도 죽지 않았다는 사실 자체가 그 증거였다.",
  ],
  solution: ["chef", "exorcist", "empath", "scarletwoman", "imp", "washerwoman", "undertaker"],
});
