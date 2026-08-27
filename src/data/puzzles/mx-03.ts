import { definePuzzle } from "@/lib/puzzles/schema";

// 어려움 3: 객실 청소부 — 요리사는 첫날 밤에만 깨어난다.
// 그런데 '요리사' 둘을 밤새 지켜봤더니 한 명이 일어났다.
export default definePuzzle({
  id: "mx-03",
  title: "밤에 깨어난 요리사",
  edition: "mixed",
  difficulty: "hard",
  playerCount: 7,
  nights: 2,
  // 대본 — 풀이 화면에 공개된다. 이 목록 안에서만 역할이 배정된다.
  rolePool: [
    "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "ravenkeeper", "clockmaker", "seamstress", "juggler", "mathematician", "chambermaid",
    "drunk", "recluse",
    "spy", "baron", "scarletwoman",
    "imp",
  ],
  intro:
    "7인 혼합 스크립트, 2일차 아침. 어제 낮 마을은 세탁부를 주장하던 B를 처형했고, 밤사이 E가 죽었다. " +
    "장의사 F가 선언한다: 'B의 토큰은 첩자였다. 하수인은 죽었으니 안심하라.' " +
    "요리사 주장은 둘이다 — D는 '악역 쌍 1', G는 '악역 쌍 0'. " +
    "객실 청소부 A는 어젯밤 점쟁이 C와 요리사 D를 지켜봤는데, 둘 다 깨어났다고 한다. " +
    "요리사는 첫날 밤에만 깨어나야 하는데. 외지인은 없다.",
  claims: [
    {
      seat: 0, role: "chambermaid", info: [
        { night: 1, data: { type: "chambermaid", targets: [2, 4], count: 2 } },
        { night: 2, data: { type: "chambermaid", targets: [2, 3], count: 2 } },
      ],
    },
    { seat: 1, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [4, 2], shownRole: "empath" } }] },
    {
      seat: 2, role: "fortuneteller", info: [
        { night: 1, data: { type: "fortuneteller", targets: [3, 5], yes: true } },
        { night: 2, data: { type: "fortuneteller", targets: [3, 0], yes: false } },
      ],
    },
    { seat: 3, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
    { seat: 4, role: "empath", info: [{ night: 1, data: { type: "empath", count: 1 } }] },
    { seat: 5, role: "undertaker", info: [{ night: 2, data: { type: "undertaker", shownRole: "spy" } }] },
    { seat: 6, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
  ],
  events: [
    { type: "execution", day: 1, seat: 1 },
    { type: "death", night: 2, seat: 4 },
  ],
  questions: [
    { id: "demon", text: "임프는 누구인가?", answerSeats: [5] },
    { id: "spy", text: "첩자는 누구인가?", answerSeats: [3] },
  ],
  hints: [
    "장의사 F의 'B는 첩자였다'가 참이라고 가정하고 끝까지 밀어보라 — 청소부 A의 밤2 '2명 기상'과 정면충돌한다.",
    "밤2에 깨어나는 자는 누구인가: 매일 밤 정보를 받는 역할, 그리모어를 보는 첩자, 그리고 칼을 든 임프다. 요리사는 아니다.",
  ],
  walkthrough: [
    "① 외지인이 없으므로 선한 플레이어는 전원 정직하고, 요리사 토큰은 하나뿐이니 요리사 주장 쌍 {D, G} 중 정확히 한 명이 악역이다.",
    "② 장의사 F가 정직하다고 가정하자. 그럼 처형된 B의 토큰이 정말 첩자였고(세탁부는 첩자로 등록될 수 없다), 악역은 B + {D 또는 G}로 확정된다. 그러면 A·C·E는 전부 선·정직이다. 선한 점쟁이 C의 밤2 'D·A에 악마 없음'에 의해 D는 임프가 아닌데, 첩자 토큰은 이미 B가 갖고 있으므로 D가 악역이라면 임프일 수밖에 없다 — 즉 악역은 B+G다. 그럼 D는 진짜 요리사인데, 선한 청소부 A의 밤2 정보가 'C와 D 둘 다 깨어났다'고 말한다. 요리사는 첫날 밤에만 깨어난다. 모순 — 장의사 F는 악역이다.",
    "③ 따라서 B는 모함당한 진짜 세탁부였고, 악역은 F + {D 또는 G}다. A·B·C·E는 선·정직으로 확정된다.",
    "④ 청소부 A의 밤2 '2명 기상'에서 D는 밤2에 깨어났다. 요리사가 아니라는 뜻이다 — 밤2에 깨어나는 것은 매일 밤 역할, 그리모어를 보는 첩자, 킬을 하는 임프뿐이다. 그러므로 ①의 악역은 D이고, G가 진짜 요리사다. 악역 = {D, F}.",
    "⑤ 선한 점쟁이 C의 밤2 'D·A에 악마 없음'에 의해 D는 임프가 아니다. 따라서 D가 첩자, F가 임프다.",
    "⑥ 검증: C의 밤1 'D·F 쪽에 악마 있음'은 임프 F를 가리키고 있었다. 초공감자 E의 '1'은 양옆 D·F가 모두 악역인데도 첩자 D가 선으로 등록된 결과다. 진짜 요리사 G의 '0쌍'도 D(3)·F(5)가 떨어져 앉아 참이다. 임프 F는 '장의사'를 사칭해 죽은 세탁부에게 첩자 누명을 씌웠고, 밤2에는 초공감자 E를 제거했다 — 하지만 청소부의 눈은 피하지 못했다.",
  ],
  solution: ["chambermaid", "washerwoman", "fortuneteller", "spy", "empath", "imp", "chef"],
});
