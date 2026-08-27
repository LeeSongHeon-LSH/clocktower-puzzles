// 규칙 페이지 본문 — 취함·중독 규칙의 한국어 서술.
//
// 각 서술에는 공식 알마낙 원문 인용 키를 단다. 원문은 자동 생성 파일
// (rule-sources.generated.ts)에서 오고, `npm run rules:check`가 인용이
// 여전히 공식 문서와 일치하는지 대조한다.
//
// 서술 자체는 우리가 직접 쓴 해설이다 — 공식 문장의 번역이 아니다.

import type { RuleSourceKey } from "./rule-sources.generated";

export interface RuleStatement {
  /** 굵게 표시되는 규칙 한 줄 */
  headline: string;
  /** 부연 설명 */
  body: string;
  /** 이 서술을 뒷받침하는 공식 원문 인용 */
  sources: RuleSourceKey[];
}

export interface RuleSection {
  id: string;
  title: string;
  lede: string;
  statements: RuleStatement[];
  /** 이 규칙이 퍼즐 풀이에서 갖는 의미 */
  puzzleNote?: string;
}

export const RULE_SECTIONS: RuleSection[] = [
  {
    id: "same-state",
    title: "취함과 중독은 같은 상태다",
    lede: "원인만 다를 뿐 게임에 미치는 효과는 완전히 동일하다. 둘이 겹쳐도 추가 효과는 없다.",
    statements: [
      {
        headline: "효과가 같다",
        body: "주정뱅이라서 취한 것과 독살자에게 중독된 것은 규칙상 구분되지 않는다. 그래서 이 사이트는 둘을 묶어 '능력 불능 상태'로 다룬다.",
        sources: ["same-thing"],
      },
      {
        headline: "죽은 사람도 취하거나 중독될 수 있다",
        body: "살아 있든 죽었든 상태는 붙는다. 죽으면 대개 능력이 없으니 의미가 없지만, 죽는 순간에 발동하는 능력(예: 까마귀지기)에는 결정적이다.",
        sources: ["alive-or-dead"],
      },
    ],
    puzzleNote:
      "퍼즐에서 '이 사람 정보가 왜 틀렸지?'의 답은 취함 아니면 중독 둘 중 하나다. 어느 쪽인지는 별개의 추리 대상이다.",
  },
  {
    id: "no-ability",
    title: "능력이 아예 없어진다",
    lede: "'약해진다'가 아니라 '없다'. 능력이 발동한 것처럼 진행되지만 게임에는 아무 영향이 없다.",
    statements: [
      {
        headline: "능력이 없는 것으로 취급된다",
        body: "취한 학살자는 아무도 죽이지 못하고, 중독된 악마는 살인에 실패하며, 취한 처녀는 처형을 일으키지 못한다.",
        sources: ["no-ability"],
      },
      {
        headline: "그 순간 발동한 능력은 낭비된다",
        body: "불능 상태에서 쓴 능력은 지금도 효과가 없고 나중에 멀쩡해져도 소급되지 않는다.",
        sources: ["wasted"],
      },
      {
        headline: "1회용 능력은 그대로 소진된다",
        body: "취하거나 중독된 채로 '게임당 한 번' 능력을 쓰면 아무 일도 일어나지 않으면서 사용 기회만 사라진다.",
        sources: ["once-per-game"],
      },
      {
        headline: "상태가 풀리면 능력은 돌아온다",
        body: "술이 깨거나 독이 풀리면 능력을 되찾는다. 다만 이미 날린 1회용 능력은 돌아오지 않는다.",
        sources: ["regain", "once-per-game"],
      },
    ],
    puzzleNote:
      "중독은 밤마다 갱신되므로 같은 사람이 1밤에는 엉터리 정보를, 2밤에는 참 정보를 말할 수 있다. 반면 주정뱅이는 전 기간 내내 불능이다.",
  },
  {
    id: "information",
    title: "정보는 '거짓'이 아니라 '임의'다",
    lede: "가장 많이 오해되는 지점. 불능 상태 플레이어가 받는 정보는 반드시 틀린 정보가 아니라, 텔러가 마음대로 정하는 정보다.",
    statements: [
      {
        headline: "텔러는 틀린 정보를 줄 수 있다 — 줘야 하는 게 아니다",
        body: "규칙은 '줄 수 있다(can)'라고 쓴다. 우연히 참인 정보를 줘도 규칙 위반이 아니다. 형식만 유효하면 내용은 자유이고, 게임에 없는 역할을 가리켜도 된다.",
        sources: ["false-info"],
      },
      {
        headline: "본인은 자기가 불능인지 모른다",
        body: "텔러는 멀쩡한 것처럼 진행한다. 취한 수도승도 매일 밤 깨어나 보호할 대상을 고르고, 본인은 자기 능력이 작동했다고 믿는다.",
        sources: ["dont-tell"],
      },
    ],
    puzzleNote:
      "솔버가 이 규칙을 지키는 방식이 퍼즐의 정확성을 좌우한다. 불능 상태의 주장은 '거짓이어야 한다'가 아니라 '아무 제약 없음'으로 처리해야 한다. '거짓'으로 모델링하면 실제로는 답이 여럿인 퍼즐을 유일해로 잘못 통과시킨다.",
  },
  {
    id: "drunk",
    title: "주정뱅이(Drunk)",
    lede: "자기가 마을 주민이라고 믿는 외지인. 게임 내내 능력이 작동하지 않는다.",
    statements: [
      {
        headline: "믿고 있는 그 역할은 실제로 게임에 없다",
        body: "셋업에서 주정뱅이 토큰 대신 마을 주민 토큰 하나를 가방에 넣고, 그걸 뽑은 사람이 주정뱅이가 된다. 즉 그가 믿는 역할은 아무도 갖고 있지 않다.",
        sources: ["drunk-setup"],
      },
      {
        headline: "실제 진영은 외지인이다",
        body: "본인은 마을 주민이라 믿지만 역할 구성상 외지인 자리를 차지하고, 다른 능력에도 외지인으로 인식된다. 사서가 '이 둘 중 하나가 주정뱅이'라는 정보를 받을 수 있는 이유다.",
        sources: ["drunk-outsider"],
      },
    ],
    puzzleNote:
      "같은 역할을 두 사람이 주장하면 한쪽이 주정뱅이일 수 있다 — 악역의 사칭과 함께 반드시 같이 검토해야 하는 갈림길이다.",
  },
  {
    id: "poisoner",
    title: "독살자(Poisoner)",
    lede: "취함과 달리 시간 축이 있다. 언제 걸리고 언제 풀리는지가 추리의 핵심이다.",
    statements: [
      {
        headline: "그날 밤과 다음 날 낮 전체",
        body: "매일 밤 한 명을 지목하고, 그 사람은 그 밤과 이어지는 낮 동안 중독된다. 같은 사람을 연달아 지목할 수도 있다.",
        sources: ["poison-duration"],
      },
      {
        headline: "해질녘(dusk)에 풀린다",
        body: "낮이 끝나는 순간 중독이 해제된다. 다음 밤에도 중독시키려면 다시 지목해야 한다.",
        sources: ["poison-dusk"],
      },
      {
        headline: "독살자가 사라지면 중독도 사라진다",
        body: "독살자가 게임에서 빠지면 그가 건 중독은 즉시 해제된다. 낮에 독살자가 처형되면 그날 중독돼 있던 사람은 그 순간 회복된다.",
        sources: ["poison-source-gone"],
      },
    ],
    puzzleNote:
      "1낮에 독살자가 처형되면 2밤에는 중독이 아예 없다. 장의사가 갑자기 참 정보를 받는 상황이 여기서 나온다.",
  },
];

/** 퍼즐 유일해가 성립하는 근거 — 위 규칙들에서 따라 나오는 예산 제약. */
export const BUDGET_NOTE =
  "한 게임에 주정뱅이는 최대 한 명, 독살 대상은 밤당 한 명뿐이고 둘은 겹칠 수도 있다. " +
  "그래서 세 사람의 주장이 서로 모순되는데 이를 해소하려면 세 명이 동시에 불능이어야 한다면, 그 가정은 불가능하다. " +
  "이 사이트의 모든 퍼즐은 이 예산 제약을 강제하는 솔버로 답이 하나뿐임을 확인한 뒤에만 올라온다.";
