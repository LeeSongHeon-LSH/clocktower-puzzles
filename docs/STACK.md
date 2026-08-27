# 기술 스택과 구조

> 글로 된 설계는 [ARCHITECTURE.md](./ARCHITECTURE.md), 요구사항은 [REQUIREMENTS.md](./REQUIREMENTS.md).
> 이 문서는 같은 내용을 **그림으로** 본다. (GitHub이 Mermaid를 바로 렌더링한다.)

## 1. 한눈에 — 전부 정적이다

서버 라우트도, API도, 데이터베이스도, 환경변수도 없다.
빌드가 끝나면 남는 것은 정적 파일뿐이고, 실행 중인 서버 코드는 존재하지 않는다.

```mermaid
graph LR
  subgraph build["빌드 타임 (개발자 기계 / CI)"]
    P["퍼즐 TS 파일<br/>src/data/puzzles/"]
    S["솔버<br/>전수 탐색"]
    R["규칙 문서 데이터"]
    P --> S
    S -->|"유일해 증명 통과"| N["next build"]
    R --> N
  end

  N --> H["정적 HTML/JS<br/>39개 라우트"]

  subgraph runtime["런타임"]
    H --> CDN["Vercel 엣지 CDN"]
    CDN --> B["사용자 브라우저"]
  end

  B -.->|"localStorage"| LS["진행도<br/>(기기 안에만)"]

  style S fill:#8e2a24,color:#fff
  style CDN fill:#cfa96a,color:#000
  style LS fill:#211a2d,color:#ece1cb
```

**서버가 하는 일은 정적 파일 전송뿐이다.** 100 동시 연결 부하 테스트에서 홈 4,500 req/s,
퍼즐 페이지 3,450 req/s, 에러 0건이었다 (p99 ≤ 53ms).

## 2. 기술 선택

```mermaid
mindmap
  root(("시계탑 퍼즐"))
    프레임워크
      Next.js 16
        App Router
        전 페이지 SSG
      React 19
    언어
      TypeScript strict
        도메인 타입이 곧 명세
    스타일
      Tailwind CSS v4
        CSS 변수 팔레트
      SVG 직접 구현
        외부 차트 라이브러리 없음
    검증
      Vitest
        유일해 증명 105건
      GitHub Actions
        PR 관문
    배포
      Vercel
        main push = 배포
        엣지 CDN
```

런타임 의존성은 `next`, `react`, `react-dom` **셋뿐이다.**

## 3. 디렉터리 구조

```mermaid
graph TD
  root["clocktower-puzzles/"]

  root --> app["src/app/ — 라우트"]
  root --> comp["src/components/ — UI"]
  root --> lib["src/lib/ — 로직"]
  root --> data["src/data/ — 데이터"]
  root --> tests["tests/ — 검증"]

  app --> a1["/ 홈 · /puzzle/[id]"]
  app --> a2["/rules · /rules/role/[id]"]
  app --> a3["/create · /play · /guide"]

  lib --> l1["solver/ — 룰 엔진<br/>(UI 비노출)"]
  lib --> l2["puzzles/codec.ts<br/>링크 인코딩 + 입력 검증"]
  lib --> l3["progress.ts<br/>외부 스토어"]

  data --> d1["puzzles/ — 문제 1개 = 파일 1개"]
  data --> d2["roles.ts — 공식 번역 고정"]
  data --> d3["*.generated.ts — 공식 원문<br/>(직접 편집 금지)"]

  style l1 fill:#8e2a24,color:#fff
  style d3 fill:#211a2d,color:#ece1cb
```

## 4. 솔버 — 이 프로젝트의 심장

목적은 하나다. **답이 정확히 하나임을 증명하는 것.**

```mermaid
flowchart TD
  A["퍼즐 입력<br/>인원수 · 역할 풀 · 주장 · 사건"] --> B["팀 구성 규칙으로<br/>가능한 배치 생성"]
  B --> C{"각 배치마다<br/>제약 평가"}

  C --> D["선하고 멀쩡한 사람의 주장은<br/>규칙상 실제로 발생 가능해야 함"]
  C --> E["취함·중독 상태의 정보는<br/>임의 값 허용"]
  C --> F["악역의 주장은<br/>임의 거짓 허용"]
  C --> G["사건 시퀀스가<br/>규칙과 모순되지 않아야 함"]

  D & E & F & G --> H{"살아남은<br/>배치 수"}
  H -->|"0개"| X["해가 없음<br/>= 모순된 문제"]
  H -->|"2개 이상"| Y["단서 부족<br/>= 아직 문제가 아님"]
  H -->|"정확히 1개"| Z["통과 ✓"]

  style Z fill:#cfa96a,color:#000
  style X fill:#8e2a24,color:#fff
  style Y fill:#8e2a24,color:#fff
```

> **중요한 미묘함:** 취하거나 중독된 사람의 정보는 "거짓"이 아니라 **"임의"** 로 다뤄야 한다.
> 공식 규칙상 텔러는 아무 정보나 줄 수 있고, 우연히 참일 수도 있다. 이를 "거짓"으로
> 모델링하면 실제로는 답이 여럿인 문제를 유일해로 잘못 통과시킨다.

**성능 (실측):** 기존 퍼즐 0.4\~6ms. 최악의 경우(10인·역할풀 18종) 14ms.
밤 수를 12로 늘려도 13ms — 솔버가 10인을 상한으로 두어 탐색 공간이 유계이기 때문이다.
그래서 **브라우저에서 그대로 돌릴 수 있다.**

## 5. 두 종류의 퍼즐, 같은 관문

난이도(쉬움·보통·어려움)와 출처(수록·사설)는 **직교하는 축**이다.
사설 문제도 어려울 수 있으므로 난이도 값에 "사설"을 섞지 않는다.

```mermaid
flowchart LR
  subgraph A["경로 A — 사설 (저장소 없음)"]
    direction TB
    A1["/create 에디터"] --> A2["브라우저에서<br/>solve() 실행"]
    A2 -->|"유일해 아님"| A3["링크 발급 거부<br/>+ 이유 설명"]
    A2 -->|"유일해 ✓"| A4["퍼즐 전체를 압축해<br/>URL 프래그먼트에"]
    A4 --> A5["/play#… 로 공유"]
  end

  subgraph B["경로 B — 정식 수록"]
    direction TB
    B1["퍼즐 TS 파일 PR"] --> B2["GitHub Actions<br/>npm test"]
    B2 -->|"유일해 아님"| B3["병합 거부"]
    B2 -->|"유일해 ✓"| B4["병합 → 자동 배포"]
    B4 --> B5["/puzzle/[id] 에 수록"]
  end

  style A2 fill:#8e2a24,color:#fff
  style B2 fill:#8e2a24,color:#fff
  style A5 fill:#cfa96a,color:#000
  style B5 fill:#cfa96a,color:#000
```

## 6. 사설 문제는 왜 서버에 부하를 주지 않는가

**업로드라는 행위 자체가 없다.** 문제는 링크 그 자체다.

```mermaid
sequenceDiagram
  autonumber
  participant M as 만든 사람
  participant BM as 만든 사람 브라우저
  participant CDN as Vercel CDN
  participant BP as 푸는 사람 브라우저
  participant P as 푸는 사람

  M->>BM: 문제 입력
  BM->>BM: solve() — 유일해 검증 (~14ms)
  Note over BM: 서버 요청 없음
  BM->>BM: 압축 + base64url → 링크 (~600~800자)
  BM-->>M: 링크
  M-->>P: 카톡·디스코드로 링크 전달

  P->>CDN: GET /play (정적 페이지)
  Note right of CDN: 프래그먼트(#)는<br/>서버로 전송되지 않음
  CDN-->>BP: 정적 HTML/JS (캐시 적중)
  BP->>BP: 프래그먼트 해독 + 검증 + 재확인
  BP-->>P: 문제 표시
```

그래서 **동시에 몇 명이 문제를 만들든 서버가 하는 일은 정적 페이지 서빙뿐이다.**
업로드 엔드포인트가 없으니 스팸·모더레이션·삭제 요청 문제도 애초에 생기지 않는다.
대가는 목록·검색이 없다는 것 — 링크를 잃으면 문제도 사라진다.

**신뢰 경계:** 링크는 외부 입력이므로 신뢰하지 않는다. `codec.ts`의 `validateShared()`가
좌석 범위·역할 id·길이 상한·구조를 전수 검사하고, 통과한 뒤에도 브라우저가 유일해를
다시 확인해 사용자에게 알린다.

## 7. 규칙 문서 — 공식 원문과 자동 대조

해설은 직접 쓰되, **모든 서술에 공식 원문 근거를 붙여** 독자가 정합성을 확인할 수 있게 한다.

```mermaid
flowchart LR
  W["공식 알마낙 위키<br/>MediaWiki API"] -->|"앵커 문구 존재 확인<br/>+ 문장 추출"| G1["rule-sources<br/>.generated.ts"]
  T["공식 한국어 번역<br/>botc-translations"] -->|"능력 문구 + 표기 대조"| G2["role-rules<br/>.generated.ts"]

  G1 --> PG["/rules 문서"]
  G2 --> PG
  H1["직접 쓴 해설<br/>rules.ts · role-notes.ts"] --> PG

  PG --> U["각주 → 하단 출처<br/>(원문 인용 + 판본 + 링크)"]

  W -.->|"문구 개정 시<br/>앵커 소실"| F["rules:check 실패<br/>= 개정 감지"]

  style F fill:#8e2a24,color:#fff
  style U fill:#cfa96a,color:#000
```

`npm run rules:check` 가 인용이 지금도 원문 그대로인지 대조한다.
공식 문구가 바뀌어 앵커가 사라지면 **실패로 끝나** 규칙 개정을 놓치지 않는다.

## 8. 품질 게이트

```mermaid
flowchart LR
  C["코드 변경"] --> T1["npm test<br/>105건"]
  T1 --> T2["typecheck<br/>tsc --noEmit"]
  T2 --> T3["lint<br/>eslint"]
  T3 --> T4["build<br/>next build"]
  T4 --> D["main 병합 → Vercel 배포"]

  T1 -.- N1["전 퍼즐 유일해 증명<br/>역할 로직 단위 테스트<br/>링크 코덱 왕복·입력 방어<br/>규칙 출처 정합성"]

  style T1 fill:#8e2a24,color:#fff
  style D fill:#cfa96a,color:#000
```

네 단계 모두 `.github/workflows/ci.yml` 에서 push·PR마다 자동 실행된다.
**퍼즐 유일해 검증이 깨지면 병합되지 않는다** — 외부 기여(경로 B)의 관문이다.
