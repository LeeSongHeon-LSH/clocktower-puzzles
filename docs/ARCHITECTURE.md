# 아키텍처 — 시계탑 퍼즐

> 요구사항은 [REQUIREMENTS.md](./REQUIREMENTS.md) 참조.

## 1. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) | Vercel 네이티브, 추후 텔러 앱 확장 대비 |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS v4 | |
| 테스트 | Vitest | 솔버 유일해 검증이 핵심 테스트 |
| 패키지 매니저 | npm | |
| 타운스퀘어 렌더링 | SVG 직접 구현 | 외부 차트 라이브러리 없음 |
| 배포 | Vercel (GitHub 연동 자동 배포) | |

## 2. 디렉토리 구조

```
src/
  app/
    page.tsx              # 홈: 퍼즐 목록 + 필터
    puzzles/[id]/page.tsx # 퍼즐 풀이 페이지
    about/page.tsx        # 소개 + 팬 고지문
    rules/page.tsx        # 규칙 허브: 취함·중독 + 역할 목록 (§8)
    rules/drunk-and-poison/page.tsx  # 취함·중독 해설 + 알마낙 원문 출처
    rules/role/[id]/page.tsx         # 역할별 규칙 문서 (공식 능력 문구 + 해설)
  components/             # TownSquare, InfoLog, QuestionPanel, HintBox, Walkthrough …
  lib/
    solver/               # 룰 엔진 (퍼즐 검증용, UI 비노출)
      types.ts            # World(그리모어 배정), 등록 시스템
      roles/              # 역할별 제약 로직 (1역할 1파일)
      solve.ts            # 전수 탐색 + 제약 평가
    progress.ts           # localStorage 풀이 기록
  data/
    roles.ts              # 역할 사전: id → { en, ko, team, edition } (공식 번역 고정)
    rules.ts              # 취함·중독 한국어 서술 (직접 작성, 출처 키 참조)
    role-notes.ts         # 역할별 한국어 해설 (직접 작성)
    rule-sources.generated.ts  # 알마낙 원문 인용 (자동 생성 — 직접 편집 금지)
    role-rules.generated.ts    # 공식 한국어 능력 문구 (자동 생성 — 직접 편집 금지)
    puzzles/
      index.ts            # 퍼즐 레지스트리
      tb-01.ts …          # 문제당 1파일
scripts/
  fetch-rule-sources.ts   # 공식 위키 API에서 규칙 원문 대조·생성 (§8)
tests/
  solver/                 # 솔버 단위 테스트 (역할 로직별)
  puzzles.test.ts         # 전 퍼즐 유일해 검증 (배포 게이트)
docs/                     # 이 문서들
```

## 3. 데이터 모델

### 3.1 퍼즐 파일 (`src/data/puzzles/*.ts`)

```ts
export default definePuzzle({
  id: "tb-01",
  title: "장의사의 증언",
  edition: "tb",              // tb | bmr | sv | mixed
  difficulty: "easy",         // easy | normal | hard
  playerCount: 7,
  // 좌석: A, B, C… (배열 인덱스 = 좌석 순서, 원형)
  claims: [                   // 좌석별 공개 주장
    { seat: 0, role: "washerwoman",
      info: [{ night: 1, text: "B 또는 C가 사서",
               data: { type: "washerwoman", targets: [1, 2], shownRole: "librarian" } }] },
    // …전 좌석
  ],
  events: [                   // 시간축 이벤트
    { day: 1, type: "execution", seat: 3 },
    { night: 2, type: "death", seat: 4 },
  ],
  questions: [                // 단계형 서브 질문
    { id: "demon", text: "데몬은 누구인가?", answerSeats: [5] },
    { id: "drunk", text: "술꾼은 누구인가?", answerSeats: [2] },
  ],
  hints: ["…", "…"],          // 최대 2개
  walkthrough: ["① …", "② …"], // 단계별 해설
  solution: { 0: "washerwoman", 1: "empath", /* seat → 실제 역할 */ },
})
```

- `text`는 사람이 읽는 서술, `data`는 솔버 입력. 둘 다 퍼즐 작성자가 유지한다(이중 기입이지만 렌더링 자유도를 위해 허용).
- `solution`은 정답 그리모어. 솔버 테스트가 "탐색 결과 유일해 == solution"을 검증한다.

### 3.2 역할 사전 (`src/data/roles.ts`)

```ts
export const ROLES = {
  imp: { en: "Imp", ko: "임프", team: "demon", edition: "tb" },
  scarletwoman: { en: "Scarlet Woman", ko: "탕녀", team: "minion", edition: "tb" },
  // …
} satisfies Record<RoleId, RoleMeta>
```

- UI 표기는 항상 `ko(en)` 형식.
- 표기는 공식 번역에 고정한다. 바꿔야 하면 이 파일을 직접 커밋한다 (§5).

### 3.3 풀이 기록 (localStorage)

```
clocktower-puzzles:progress = {
  [puzzleId]: { solved: boolean, firstTry: boolean }
}
```

## 4. 솔버 설계

목적: **퍼즐이 유일해임을 전수 탐색으로 증명**하는 개발용 도구. UI에 노출하지 않는다. 장기적으로 텔러 앱의 룰 엔진 기반.

### 4.1 모델

- **World** = 좌석 → 실제 역할 배정 + 부가 상태(술꾼이 착각 중인 역할, 임프의 밤 선택, 독살자 대상 등 필요한 만큼의 비결정 변수).
- 탐색: 역할 배정 후보를 생성(팀 구성 규칙 — 인원수별 마을 사람/외부인/하수인/데몬 수, 남작 수정치 반영)하고, 각 World에 대해 **제약 평가**:
  - 참인 주장(선한 생존 정직 역할)의 정보는 게임 룰상 실제로 발생 가능해야 한다.
  - 술꾼·독살 상태의 정보는 임의 값 허용(텔러 재량), 악역 주장은 임의 거짓 허용.
  - 이벤트 시퀀스(처형·사망)가 룰과 모순되지 않아야 한다 (예: 임프 킬, 탕녀 승계).
- 결과: 정합한 World 집합. **크기 1**이어야 검증 통과. (서브 질문 정답도 그 World에서 도출되는지 확인.)

### 4.2 역할 로직 구조

- 역할 1개 = 파일 1개, `checkInfo(world, claim, gameLog): boolean` 형태의 제약 함수 등록.
- 지원 역할 목록은 REQUIREMENTS §2.4. 새 역할 추가 = 파일 추가 + 테스트 추가.
- 정보 교란 계층: 술 취함(drunk) / 중독(poisoned) / 은둔자·스파이 오등록(misregistration)을 공통 유틸로 처리.

### 4.3 성능 전제

- 인원수 ≤ 10, 등장 역할 풀을 퍼즐마다 명시(스크립트 전체가 아니라 "이 퍼즐에 나올 수 있는 역할" 목록)하여 탐색 공간을 통제한다.
- 전수 탐색으로 충분한 규모를 유지한다. 퍼즐이 커져서 느려지면 그때 가지치기 도입.

## 5. 역할명 변경 (런타임 편집 없음)

역할명은 공식 한국어 번역을 그대로 따르므로 런타임에 바꿀 이유가 없다. 바꿀 일이
생기면 `src/data/roles.ts`를 직접 고쳐 커밋한다 (푸시 = 자동 재배포).

- **서버에 인증도 비밀 값도 두지 않는다.** 앱은 환경변수를 하나도 요구하지 않는다.
- 과거에는 `/admin` 페이지가 `GITHUB_TOKEN`으로 이 파일을 커밋했으나 2026-08-27 제거했다
  (공식 표기 고정 원칙과 모순 + repo 쓰기 토큰을 서버에 둘 이유가 사라짐). 함께 사라진 것:
  `/admin`, `/api/admin/roles`, `src/lib/rate-limit.ts`, `ADMIN_PASSWORD`,
  `GITHUB_TOKEN`, `GITHUB_REPO`. **Vercel 환경변수에서도 지울 것.**
- 사용자 피드백은 앱 밖(외부 채널)에서 받는다. 앱은 읽기 전용을 유지한다.

## 6. 테스트·품질 게이트

- `tests/puzzles.test.ts`: 모든 퍼즐에 대해 (1) 스키마 유효, (2) 솔버 유일해, (3) solution·questions 정답 일치. **이 테스트가 깨지면 머지/배포 금지.**
- `tests/solver/*`: 역할 로직 단위 테스트 (참/거짓 정보 케이스).
- CI는 초기에 생략(개인 프로젝트) — `npm test`를 푸시 전 수동 실행. 필요해지면 GitHub Actions 추가.

## 7. 배포

- GitHub private repo `LeeSongHeon-LSH/clocktower-puzzles` → Vercel 연동(사용자가 1회 클릭).
- `main` push = 프로덕션 배포.
- **전 페이지가 정적이다.** 서버 라우트도 API도 없다 — 순수 정적 배포로 CDN에서 전부 서빙된다.
- 부하 특성: 100 동시 연결 기준 홈 4,500 req/s, 퍼즐 3,450 req/s (에러 0, p99 ≤ 53ms).
  전 페이지가 정적이라 실서비스에서는 Vercel 엣지 캐시가 대부분 처리한다.

## 8. 규칙 문서와 출처 대조

`/rules`는 규칙 허브다. 서술은 직접 쓰되 **모든 문장에 공식 원문 근거를 붙여** 독자가 정합성을 확인할 수 있게 한다.

```
/rules                      허브 — 취함·중독 + 역할 목록(팀별)
/rules/drunk-and-poison     취함·중독 해설 + 알마낙 원문 각주
/rules/role/[id]            역할별 문서 (공식 능력 문구 + 해설 + 출처 2종)
```

```
src/data/rules.ts                  취함·중독 서술 (직접 작성) — 출처 키를 참조
src/data/role-notes.ts             역할별 해설 (직접 작성)
src/data/rule-sources.generated.ts 알마낙 원문 인용 + 판본 (자동 생성)
src/data/role-rules.generated.ts   공식 한국어 능력 문구 + 판본 (자동 생성)
scripts/fetch-rule-sources.ts      두 공식 소스에서 대조·생성
```

공식 소스는 두 곳이다.

1. **공식 알마낙 위키** `wiki.bloodontheclocktower.com` — `api.php`로 wikitext를 받아,
   스크립트에 등록된 **앵커 문구**가 원문에 존재하는지 확인하고 그 문장을 인용문으로 추출한다.
   **앵커가 사라지면 실패한다** — 공식 문구가 개정됐다는 신호이므로 한국어 서술도 다시 검토해야 한다.
2. **공식 한국어 번역** `ThePandemoniumInstitute/botc-translations`의 `game/ko.json` —
   역할별 능력 문구를 받고, `roles.ts`의 한국어 표기가 공식과 일치하는지 대조한다.
   불일치는 **경고**로만 알린다 — 공식 번역 개정 중일 수 있어 최종 판단은 사람이 한다.

- `npm run rules:sync` — 대조 후 생성 파일 갱신. `npm run rules:check` — 대조만(파일 미변경).
- 역할명·에디션명은 공식 번역을 그대로 따른다 (REQUIREMENTS §3). 현재 예외 없음.
- 인용은 규칙 대조 목적의 인용이며 저작권은 The Pandemonium Institute에 있다.
  공식 아트/아이콘은 여전히 사용하지 않는다(불변 규칙).
- `tests/rules.test.ts`, `tests/role-rules.test.ts`가 네트워크 없이 출처 누락·고아 출처·
  표기 일치·형식을 검사한다.
