# 아키텍처 — 시계탑 퍼즐

> 요구사항은 [REQUIREMENTS.md](./REQUIREMENTS.md), 같은 내용을 그림으로 본 것은
> [STACK.md](./STACK.md) 참조. 제3자 콘텐츠 취급은 저장소 루트의
> [NOTICE](../NOTICE), 코드 라이선스는 [LICENSE](../LICENSE).

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
    create/page.tsx       # 사설 문제 에디터 (브라우저 유일해 검증, §9)
    play/page.tsx         # 공유 링크로 받은 사설 문제 풀이 (§9)
    guide/page.tsx        # 문제 업로드 가이드 (경로 A/B 안내)
  components/             # TownSquare, PuzzleCreator, PuzzleSubmit, SharedPuzzleLoader …
  lib/
    solver/               # 룰 엔진 (퍼즐 검증용, UI 비노출)
      types.ts            # World(그리모어 배정), 등록 시스템
      roles/              # 역할별 제약 로직 (1역할 1파일)
      solve.ts            # 전수 탐색 + 제약 평가
    progress.ts           # localStorage 풀이 기록
    notes.ts              # localStorage 좌석 메모 (표시 + 역할 추측)
  data/
    roles.ts              # 역할 사전: id → { en, ko, team, edition } (공식 번역 고정)
    rules.ts              # 취함·중독 한국어 서술 (직접 작성, 출처 키 참조)
    role-notes.ts         # 역할별 한국어 해설 (직접 작성)
    rule-sources.generated.ts  # 알마낙 원문 인용 (자동 생성 — 직접 편집 금지)
    role-rules.generated.ts    # 공식 한국어 능력 문구 (자동 생성 — 직접 편집 금지)
    puzzles/
      index.ts            # 퍼즐 레지스트리
      tb-01.ts …          # 문제당 1파일
  lib/puzzles/
    schema.ts             # Puzzle 타입 (difficulty ⟂ source 두 축)
    codec.ts              # 사설 문제 ↔ 공유 링크 + 신뢰불가 입력 검증 (§9)
    source.ts             # 수록 신청용 퍼즐 파일 생성 (§9 경로 B)
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

### 3.3 풀이 기록 · 좌석 메모 (localStorage)

```
clocktower-puzzles-progress-v1 = {
  [puzzleId]: { status, hintsUsed, attempts }
}
clocktower-puzzles-notes-v1 = {
  [puzzleId]: { [seat]: { mark?: "trust"|"doubt"|"lie"|"evil", guess?: RoleId } }
}
```

키를 나눈 이유: 메모는 풀이 기록과 수명이 다르다 (문제별로 지울 수 있어야 한다).
서버도 계정도 없으므로 둘 다 그 브라우저 밖으로 나가지 않는다.

## 4. 솔버 설계

목적: **퍼즐이 유일해임을 전수 탐색으로 증명**하는 개발용 도구. UI에 노출하지 않는다.

### 4.1 모델

- **World** = 좌석 → 실제 역할 배정 + 부가 상태(술꾼이 착각 중인 역할, 임프의 밤 선택, 독살자 대상 등 필요한 만큼의 비결정 변수).
- 탐색: 역할 배정 후보를 생성(팀 구성 규칙 — 인원수별 마을 사람/외부인/하수인/데몬 수, 남작 수정치 반영)하고, 각 World에 대해 **제약 평가**:
  - 참인 주장(선한 생존 정직 역할)의 정보는 게임 룰상 실제로 발생 가능해야 한다.
  - 술꾼·독살 상태의 정보는 임의 값 허용(텔러 재량), 악역 주장은 임의 거짓 허용.
  - 이벤트 시퀀스(처형·사망)가 룰과 모순되지 않아야 한다 (예: 임프 킬, 탕녀 승계).
- 결과: 정합한 World 집합. **크기 1**이어야 검증 통과. (서브 질문 정답도 그 World에서 도출되는지 확인.)
- 입구는 `analyze()`다: 구조 검사(`validatePuzzle` + `Schedule` 생성자)를 **언제나** 돌리고,
  전수 탐색은 검증이 성립할 때만 돌린다. `solve()`는 유일해가 필요한 경로용 얇은 껍데기로,
  검증이 성립하지 않으면 던진다 (REQUIREMENTS §2.5.1).

### 4.2 역할 로직 구조

- 역할 1개 = 파일 1개, `checkInfo(world, claim, gameLog): boolean` 형태의 제약 함수 등록.
- 지원 역할 목록은 REQUIREMENTS §2.4. 새 역할 추가 = 파일 추가 + 테스트 추가.
- 정보 교란 계층: 술 취함(drunk) / 중독(poisoned) / 은둔자·스파이 오등록(misregistration)을 공통 유틸로 처리.
- **사전 ≠ 커버리지.** 역할 사전(`ROLE_IDS`)은 3개 판본 72종 + 실험적 역할 66종 = 138종
  전부지만, 능력이 구현된 역할은 `SOLVER_ROLES`뿐이다. 에디터에서는 138종 전부를 풀·정답
  배치·거짓 정보 토큰으로 쓸 수 있다 (실험적 역할은 기본 접힘 — "실험적 역할 보기" 토글).
- **모르는 역할은 세지 않는다.** `solve.ts`의 `unmodeledRoles()`가 *배정될 수 있는* 역할 —
  풀 안의 하수인·데몬, 주장 역할, 주정뱅이 — 에 `solution`을 더해 `SOLVER_ROLES`에 없는 것을
  모은다. 비어 있지 않으면 전수 탐색을 하지 않는다. 모르는 능력을 없는 셈 치고 세면
  "유일해"가 거짓이 되기 때문이다. 단지 풀에 들어 있을 뿐 배정되지 않는 역할(은둔자·첩자의
  오등록 대상)은 통과시킨다 — 보여줄 토큰의 이름일 뿐이라 능력 모델링이 필요 없다.
- **이 판정은 파생값이지 플래그가 아니다.** 퍼즐 내용에서 계산되므로 저자가 끌 수 없고,
  공유 링크에도 실리지 않는다 (여는 쪽이 다시 계산한다). 미검증 퍼즐의 처리는 §2.5.1.
- 새 역할을 지원하려면: `roles/`에 체커 추가 → `SOLVER_ROLES`에 등록 → `role-notes.ts`에 해설
  (테스트가 `SOLVER_ROLES` 전원의 해설을 요구한다).

### 4.3 성능 전제

- 인원수 ≤ 10, 등장 역할 풀을 퍼즐마다 명시하여 탐색 공간을 통제한다. 이 풀은 **퍼즐의 대본이며 풀이 화면에 공개된다**
  (실제 게임에서도 대본은 공개 정보다) — 그래서 좌석 수보다 넉넉히 잡아야 답이 새지 않는다.
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

- `tests/puzzles.test.ts`: 모든 퍼즐에 대해 (1) 스키마 유효, (2) 구조 검사 통과, (3) questions
  정답이 solution에서 도출, (4) 솔버 유일해 + solution 일치. **이 테스트가 깨지면 머지/배포 금지.**
  (4)만 미검증 퍼즐에서 해설 필수 검사로 대체된다 (REQUIREMENTS §2.5.1).
- `tests/solver/*`: 역할 로직 단위 테스트 (참/거짓 정보 케이스).
- `tests/codec.test.ts`, `tests/community-puzzle.test.ts`: 공유 링크 왕복·신뢰불가 입력 방어,
  그리고 에디터의 약속 두 개 (§9) — "검증이 성립하는 문제의 링크는 유일해일 때만 나온다",
  "미검증 판정은 링크로 왕복해도 되살아난다".
- **CI: `.github/workflows/ci.yml`** — push·PR마다 test → typecheck → lint → build.
  외부 기여(경로 B)의 관문이며, 유일해 검증에 실패하면 병합되지 않는다.

## 7. 배포

- GitHub private repo `LeeSongHeon-LSH/clocktower-puzzles` → Vercel 연동(사용자가 1회 클릭).
- `main` push = 프로덕션 배포.
- **전 페이지가 정적이다.** 서버 라우트도 API도 없다 — 순수 정적 배포로 CDN에서 전부 서빙된다.
- 보안 헤더는 `next.config.ts`의 `headers()`가 CDN 엣지에서 붙인다 (CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy). 방어 심화 목적 — 서버·쿠키·외부
  요청이 없고 React가 출력을 이스케이프하므로 현재 막고 있는 취약점이 있어서가 아니라,
  향후 실수의 피해를 줄이는 안전망이다.
  - CSP는 정적 배포라 요청별 nonce를 만들 수 없어 `script-src`에 `'unsafe-inline'`이 불가피하다
    (Next 인라인 부트스트랩). 대신 `connect-src 'self'`로 유출 경로를, `object-src 'none'`·
    `base-uri 'self'`·`frame-ancestors 'none'`으로 삽입·피벗 경로를 막는다.
  - **`output: "export"`로 바꾸면 이 헤더가 경고 없이 사라진다.** 호스팅을 옮긴다면 헤더도
    호스팅 쪽으로 옮겨야 한다. `tests/security-headers.test.ts`가 이 조건과 핵심 지시어 누락을
    감시한다.
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

## 9. 사설 문제 (사용자 제작)

난이도와 **직교하는 축**으로 `source: "official" | "community"`를 둔다. 사설 문제도
쉬움·보통·어려움을 그대로 가지므로 난이도 값에 "사설"을 섞지 않는다.

경로는 둘이고, 관문은 **유일해 증명 하나로 같다**.

### 경로 A — 링크 공유 (저장소 없음)

```
/create  에디터 → 브라우저에서 analyze() 실행 → 유일해거나 미검증일 때 링크 발급
         → 퍼즐 전체를 deflate-raw + base64url로 압축해 URL 프래그먼트에 담음
/play#…  프래그먼트 해독 → 재검증 → PuzzleClient로 풀이
```

- **서버 부하가 구조적으로 0이다.** 업로드 엔드포인트가 없고 저장도 하지 않는다.
  프래그먼트(`#`)는 서버로 전송되지 않아 정적 배포·CDN 캐싱이 그대로 유지된다.
  따라서 동시 제작자가 아무리 많아도 서버가 하는 일은 정적 페이지 서빙뿐이다.
- 비용은 각 사용자의 CPU로 분산된다. 실측: 기존 퍼즐 0.4~6ms, 최악(10인·역할풀 18)도 14ms.
  솔버가 자체적으로 10인을 상한으로 두어 탐색 공간이 유계다 (`composition.ts`).
- 스팸·모더레이션·삭제 요청 문제가 애초에 생기지 않는다 — 남는 데이터가 없다.
- 대가: **목록·검색이 없다.** 링크를 잃으면 문제도 사라진다. 보존하려면 경로 B.
- 링크가 나오는 조건은 두 가지다. **배정되는 역할이 전부 `SOLVER_ROLES`에 있으면** 그 배치가
  유일해일 때만 나온다. **구현되지 않은 역할이 섞이면** 유일해 탐색을 건너뛰고, 해설을 적은
  경우에 한해 「미검증」 표시와 함께 나온다 (REQUIREMENTS §2.5.1). 어느 쪽이든 구조 검사는
  통과해야 한다.
- **링크 공유는 수록이 아니다.** 서버에 남는 것이 없는 사적인 링크이고, 사이트 목록(경로 B)과는
  무관하다. 에디터는 수록을 약속하지 않는다.
- `codec.ts`의 `validateShared()`는 **링크를 신뢰하지 않는다.** 좌석 범위·역할 id·
  길이 상한·구조를 전부 검사하고 사람이 읽을 수 있는 오류를 던진다.

### 경로 B — 정식 수록 (GitHub PR)

```
퍼즐 파일 PR → .github/workflows/ci.yml (npm test = 전 퍼즐 유일해 검증) → 병합 → 자동 배포
```

- 검증이 성립하는 문제는 **CI가 관문이다.** 유일해가 아니면 병합되지 않는다 — 사람 눈
  검수를 대체한다.
- 미검증 문제(실제로 진행된 판 기록 등)는 CI가 유일해를 보증하지 못하므로 **사람 판단이
  관문이다.** 실제 그 판을 진행한 텔러·참여자를 아는 사람이 넣는다는 것이 신뢰의 근거이고,
  절차가 아니다. CI는 구조 검사와 해설 존재만 강제한다.
- 정식 수록 문제에는 해설(walkthrough)이 필요하다. 사설 링크 문제는 검증이 성립하면 없어도
  되고, 미검증이면 필수다. 그래서 에디터의 수록 신청 안내는 **해설이 있어야 열린다** —
  없는 채로 보내면 `definePuzzle`에서 막히고 헛걸음이 된다.
- PR은 GitHub이 처리하므로 이쪽도 우리 서버 부하가 없다.

**접수는 두 갈래다** (`components/PuzzleSubmit.tsx`). GitHub이 유일한 접수함인데 —
서버가 없으니 다른 데 둘 수가 없다 — 그 사실이 비전공자에게는 그냥 벽이라서, 저장소를
건드리지 않는 길을 먼저 둔다.

| | 방법 1 — 신청서 | 방법 2 — 직접 PR |
|---|---|---|
| 필요한 것 | GitHub 계정 | GitHub 계정 |
| 보내는 것 | 공유 링크 한 줄 (문제 전체가 그 안에 있다) | 퍼즐 파일 + `index.ts` 등록 두 줄 |
| 여는 화면 | 제목·본문이 채워진 이슈 작성 화면 | fork → 웹 편집기 |
| 파일로 옮기는 사람 | 받는 쪽 | 신청자 |

- 방법 1이 성립하는 이유는 **공유 링크가 곧 문제 전체**이기 때문이다 (경로 A). 링크만
  받으면 `puzzleFileSource()`로 파일을 복원할 수 있으므로 신청자가 코드를 만질 이유가 없다.
- 방법 2의 파일도 사람이 옮겨 적지 않는다. `source.ts`가 `definePuzzle` 인자 그대로를
  찍어 낸다 — 좌석 번호 오타 하나가 CI 실패로 돌아오는 것이 이 경로의 실제 문턱이었다.
  `tests/puzzle-source.test.ts`는 생성된 소스를 실제로 평가해 `definePuzzle`과 솔버를
  통과하는지 본다 (문자열이 그럴듯한지가 아니라).
- 문제 id(`cm-01`, `cm-02` …)는 이미 수록된 id 목록에서 비어 있는 번호를 고른다. 목록은
  서버 컴포넌트가 **id만** 뽑아 넘긴다 — 퍼즐 전체를 클라이언트로 보내면 정답이 딸려 간다.

### 스포일러에 대해

공유 링크에는 정답이 들어 있다. 이는 공식 퍼즐도 마찬가지다 —
프리렌더 HTML에 `solution`·`walkthrough`가 이미 포함된다. 즉 솔버를 클라이언트로
내려도 스포일러 측면에서 새로 잃는 것은 없다. 가이드 페이지에 이 점을 명시한다.
