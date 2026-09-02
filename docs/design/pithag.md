# 마귀할멈(Pit-Hag) 솔버 모델링 — 설계 및 구현 지시서 (24차)

작성: 2026-09-02. 이 문서는 **설계 결정이 끝난 상태**로, 구현자(사람 또는 다른 모델)가 그대로
따라 코드를 쓰기 위한 것이다. 결정을 바꾸고 싶으면 코드를 고치지 말고 §9의 "멈춰야 할 때"에 따라
질문한다. 코드 작업 전에 `CLAUDE.md`, `docs/REQUIREMENTS.md` §2.4·§2.5, `docs/ARCHITECTURE.md` §4를 읽는다.

## ⚠ 작업 절차 (위험 방지 — 반드시 지킬 것)

1. **브랜치에서만 구현한다.** `main`에서 `git switch -c feat/solver-pithag`을 만들고 거기서 작업한다.
   `main`에 직접 커밋하지 않는다. 푸시는 사용자가 지시할 때만 한다.
2. **구현자는 이 문서의 결정을 바꾸지 않는다.** 결정이 틀렸다고 생각되면 §9에 따라 멈추고 보고한다.
3. **검토는 Fable이 한다.** 구현이 끝나면 diff 검토와 테스트 결과 판정은 Claude Fable 세션에서
   진행한다 (`git diff main...feat/solver-pithag` + `npm test` 전체). 구현자 스스로 "완료"를 선언하지
   않는다 — 테스트가 통과했다는 사실만 보고한다.
4. 기준선(2026-09-02): `npm test` = 34 파일 307건 통과. 구현 뒤에도 전부 통과해야 한다.
   기존 테스트 단언을 고쳐서 통과시키는 것은 금지 — 깨지면 §9-3.

---

## 0. 한 문단 요약

마귀할멈은 매밤(밤2부터) 한 명을 골라 **판에 없는** 캐릭터로 바꾼다. 진영은 바뀌지 않는다.
이 솔버에서는 **정직한 선인의 최종 주장이 변신 이력을 드러낸다**는 자기 배제 원리(이발사 20차 선례)를
그대로 쓴다: 주장에 `roleChange`(변신 밤 + 이전 역할)가 있는 선한 좌석만 변신했고, 없는 좌석은
변신하지 않았다. 변신은 배정마다 **결정적**이라(분기 없음) solve 레벨에서 셋업 배정을 만들고,
timeline이 그 밤에 마귀할멈이 살아 있고 멀쩡했는지, 새 역할이 그때 판에 없었는지만 검사한다.
악역(마귀할멈 자신)의 숨은 변신은 등록 ∃(첩자 선례)로 흡수한다. 데몬·하수인 생성과 데몬 변신은
**대본 제약**(하수인은 마귀할멈뿐, 데몬 1종)으로 아예 일어날 수 없게 만든다.

---

## 1. 공식 규칙 (위키 https://wiki.bloodontheclocktower.com/Pit-Hag 에서 2026-09-02 확인)

- 능력: "매일 밤*, 플레이어 1명과 캐릭터 하나를 선택하고, (그 캐릭터가 게임에 참여하지 않았을 경우)
  그를 선택한 캐릭터로 바꿉니다: 이 능력으로 악마를 만든다면, 오늘 밤 예측불허의 죽음이 찾아옵니다."
- 첫날 밤은 깨어나지 않는다 (`*`).
- 고른 캐릭터가 이미 판에 있으면 **아무 일도 없다**.
- **진영은 바뀌지 않는다.** (선한 플레이어가 하수인 캐릭터가 돼도 선하다.)
- 마귀할멈은 **자기 자신**도 바꿀 수 있다 (그러면 변신 능력은 끝난다).
- 데몬을 만들면 그 밤의 죽음은 텔러 재량이다 (보통 옛 데몬을 죽인다; 선한 데몬은 공존 가능).
- 변신한 플레이어는 깨어나 새 캐릭터를 통보받는다 → 정직한 선인은 다음 날 즉시 밝힌다.
- 취하거나 중독된 마귀할멈의 선택은 무효다 (일반 규칙).
- 죽은 마귀할멈은 능력이 없다 (비고르모르티스에게 죽었으면 유지 — 기존 `vigorKept` 규약).

---

## 2. 모델링 결정 (각 항목에 건전성 근거)

"건전성"의 기준은 이 프로젝트 규약과 같다: **실제로 가능한 세계를 빠뜨리면 안 된다**(빠뜨리면
유일해를 거짓으로 증명할 수 있다). 불가능한 세계를 더 세는 것(관대한 근사)은 허용된다.

### D1. 대본(풀) 제약 — 데몬·하수인 생성을 원천 봉쇄한다

`validatePuzzle`이 풀에 `pithag`가 있을 때 다음을 **거부**한다:

| 조건 | 이유 |
|---|---|
| 풀의 하수인이 `pithag` 하나가 아니다 | 다른 하수인 캐릭터가 판에 없으면 마귀할멈이 그것을 만들 수 있다(자기 자신 포함 — 숨은 능력 획득). 독살범을 만든 세계 등은 열거 없이는 건전하지 않다. |
| 풀의 데몬이 정확히 1종이 아니다 | 데몬이 2종이면 판에 없는 데몬을 만들 수 있다 (두 데몬 공존·"예측불허의 죽음"은 단일 데몬 모델 밖). |
| `playerCount >= 10` | 하수인 슬롯이 2개인데 하수인 캐릭터가 하나뿐이라 세계가 0개가 된다 — 명시적으로 거부. |
| 풀에 `drunk`·`mutant`·`lunatic` | 마귀할멈이 이들로 바꾸면 변신자가 자기 정체를 모르거나 감춰 **이력을 주장하지 못한다** → 숨은 변신이 생겨 자기 배제가 깨진다. |
| 풀에 `goon` | 지금 악한 건달은 주장을 날조한다(25차 D7) → 숨은 변신 은닉 가능. 건달이 먼저 편입돼 있지 않아도 이 거부는 넣는다. |
| 풀에 `fanggu`·`barber`·`snakecharmer`·`philosopher` | 팡 구 점프·이발사/조련사의 `roleSwap`·철학자의 "토큰은 철학자인데 능력은 다른 역할"이 변신 타임라인·"판에 있음" 판정과 얽힌다. 조합 미지원(기존 선례대로 거부). |

하수인이 마귀할멈뿐이므로 **모든 세계에서 마귀할멈이 배정된다** (`assignment.indexOf("pithag") >= 0`).
세레노부스·탕녀는 하수인이라 첫 조건으로 자동 배제된다.

### D2. 데몬 좌석 변신은 열거하지 않는다 (가정 — §9에서 확인 요청)

풀의 데몬이 1종이라 "데몬 → 다른 데몬"은 불가능하다. "데몬 → 마을 사람" 변신은 살아 있는 데몬이
없어지므로 **게임이 즉시 끝난다고 가정**한다 (선의 승리). 게임이 현재까지 이어졌으므로 그런 변신은
없었다 → 열거하지 않아도 건전하다. 이 가정은 REQUIREMENTS "솔버 모델 경계"에 적는다.

### D3. 선한 좌석의 변신은 **주장이 드러낼 때만** 존재한다 (자기 배제)

- 새 스키마 `Claim.roleChange?: { night: number; from: RoleId }` — "밤 `night`에 `from`에서 현재
  `role`로 바뀌었다". 좌석당 최대 1회 (두 번 바뀐 선인의 이력은 스키마로 표현 불가 → 그런 세계는
  이 스키마에 입력될 수 없어 빼도 건전하다 — 이발사 SWAPPABLE 논리와 같다).
- `from ∈ SWAPPABLE_ROLES`, `role(현재) ∈ PHILOSOPHER_GAINABLE`, `from !== role`, `2 <= night <= nights`.
  (점쟁이·저글러로의 변신은 붉은 청어·밤2 고정 규칙이 변신 시점과 어긋나 제외 — 철학자 22차와
  같은 이유. 외부인·능력 역할은 이발사 20차와 같은 이유로 제외: 그런 변신의 이력은 표현 불가라
  빼도 건전하다.)
- `roleChange`가 있는 주장의 `info`: `night < roleChange.night`인 항목은 반드시 `asRole === from`,
  `night >= roleChange.night`인 항목은 `asRole` 없음. 기존 검사 `info.data.type === (info.asRole ?? c.role)`는
  그대로 작동한다.
- `asRole`은 현재 "이발사가 풀에 있을 때만" 허용된다 — **마귀할멈 퍼즐에서는 `roleChange`가 있는
  주장 안에서만** 허용하도록 조건을 넓힌다.
- 악역 좌석의 `roleChange`는 허세이므로 무시된다 (tryWorld는 goodSeats만 본다 — 기존과 같다).
- `roleChange`가 없는 선한 좌석은 변신하지 않았다 (정직한 선인이라면 밝혔을 것이다 → 자기 배제).

### D4. 열거는 solve 레벨에서 **결정적**으로

배정(`assignment` = 최종 그리모어)마다 `changes = goodSeats.filter(s => claimBySeat[s].roleChange)`.
분기가 아니다 — 그 좌석이 선하다면 변신은 반드시 일어났다. 
- `setup = [...assignment]; for (c of changes) setup[c.seat] = c.from;`
- **실물 토큰 중복·마을 사람 수 검사는 `setup`으로** 한다 (변신은 다중집합을 바꾼다: 셋업의
  초공감자가 장의사가 됐는데 다른 선인이 초공감자를 주장하면 셋업에 초공감자가 둘 → 그 배정은
  불가). SWAPPABLE·GAINABLE이 전부 마을 사람이라 팀 수는 변하지 않는다.
- 이발사 선례와 같이 `tryWorld(..., setup, sc, ..., finalAssignment = assignment)` — `World.assignment`는
  최종 그리모어다.
- `demonScenarios(pz, sched, setup, sweet, swap, snakeNight, roleChanges)`로 넘긴다.

### D5. timeline 검사 — 변신 밤 `n`마다 (밤 순서상 마귀할멈은 이른 편이라 `doNight` 진입부, 뱀 조련사 블록 뒤·`drunkSourceBranches` 앞)

`since === night`인 변신 각각에 대해, 하나라도 어기면 그 세계는 모순(`return`):
1. 마귀할멈 좌석이 `st.became`에 없다 (스타 패스로 임프가 됐으면 능력 없음).
2. 마귀할멈이 밤 시작에 생존 **또는** `vigorKeeps(st, pithagSeat)`.
3. `forbid_(st, night, pithagSeat)` — 멀쩡했어야 변신이 일어난다.
4. 새 역할(= 그 좌석의 최종 주장 역할)이 **그 시점에 판에 없다**: 모든 좌석 `x !== seat`에 대해
   `tokenAt(st.became, x, night - 0.5) !== newRole`. (`night - 0.5` = 이 밤의 변신을 적용하기 전.
   주정뱅이는 풀에서 거부했으므로 "믿는 역할" 문제 없음.)
5. 같은 밤에 변신이 둘이면 모순 (밤당 1명).
변신 대상이 죽어 있어도 허용한다 (위키: "어느 플레이어든"). 변신 밤 자체의 정보는 **새 역할로서**
받는다 (`since = night`, 이발사의 밤 사망 규약과 같다 — 마귀할멈이 정보 역할보다 먼저 행동한다).

변신이 없는 밤·변신하지 않은 세계에는 **아무 제약도 없다** (마귀할멈이 판에 있는 캐릭터를
골랐거나 악역을 바꿨을 수 있다 — 관대한 방향).

### D6. 토큰 타임라인 — `roleChanges`

`DemonScenario.roleChanges?: { seat: Seat; since: number; role: RoleId }[]`. `tokenRoleAt`(timeline 끝)과
`demonScenarios` 안의 `tokenAt`에서 **`roleSwap` 검사 바로 뒤, `becameDemonAt` 검사 앞**에 적용:
`time >= since`이면 `role`. `roleSwap`은 건드리지 않는다 (이발사·조련사는 D1에서 조합 거부라 충돌 없음).

### D7. 기상 — 변신 좌석의 즉시형 정보

`believedRole`이 `tokenRoleAt`을 쓰므로 변신 뒤 기상은 자동으로 새 역할 규칙을 따른다. 단
`wakesAs`의 즉시형 역할(`washerwoman/librarian/investigator/chef/clockmaker`)은 `night === 1`만 깨어나
변신으로 얻은 즉시형 정보(변신 밤 1회 — 철학자 22차 규약)가 구조 검증에서 죽는다. 고친다:
`return night === 1 || changedAt(ctx, seat) === night` — `changedAt`은 `sc.roleChanges`에서 그 좌석의
`since`, 그리고 **`sc.roleSwap`의 `since`**(이발사 교환으로 얻은 즉시형 정보 — 같은 간극)를 본다.
이발사 테스트가 그대로 통과해야 한다 (더 관대해지는 방향이라 기존 유일해가 깨지지 않아야 정상).

### D8. 마귀할멈의 **숨은 자기 변신** — 등록 ∃ (관대)

마귀할멈이 자기를 판에 없는 마을 사람으로 바꾸면 주장으로 드러나지 않는다 (악역은 거짓말한다).
관측 영향은 "그 좌석의 토큰이 밤 n(≥2)부터 어떤 마을 사람 역할로 보일 수 있다"뿐이다 →
첩자의 오등록과 같은 ∃로 처리한다:
- `TokenView`에 `pithagSelfOptions?: RoleId[]`를 더한다: 밤 `night >= 2`일 때, `pool ∩ PHILOSOPHER_GAINABLE`
  중 그 시점 어느 좌석의 토큰도 아닌 역할들. `view(ctx, night)`(ctx.ts), `dayView`(props.ts),
  timeline의 도박사용 `tokenView` 세 곳에서 채운다 (공용 헬퍼 하나를 registration.ts나 ctx.ts에 둔다).
- `canShowAsRole`: `actual === "pithag" && view.pithagSelfOptions?.includes(shown)`이면 true.
- `canShowAsOtherThan`: `actual === "pithag"`이면 options에 `pithagSelfOptions`를 더한다.
- 진영 판정(`canRegisterEvil`·`mustRegisterEvil`·`canRegisterDemon`)은 **바꾸지 않는다** — 진영은 안 변한다.
- 음유시인 트리거(`timeline.ts` `minstrelMode`): 처형 토큰이 `pithag`면 `"must"` 대신 `"may"` (자기
  변신했다면 하수인 처형이 아니다). 음유시인은 BMR이라 같은 풀에 드물지만 규약상 넣는다.
- 객실 청소부(`chambermaid.ts`): 대상 토큰이 `pithag`이고 `night >= 2`면 기상 여부가 ∃(마귀할멈으로
  깨었거나, 변신한 역할의 규칙) → 그 대상은 "0 또는 1"로 세어 `count ∈ [확정, 확정+불확정]`.
- 교수·대부·비고르모르티스·수학자는 손대지 않는다 (토큰이 하수인이라 강제가 걸리지 않거나 무관 —
  전부 관대한 방향임을 확인했다).
- 자기 변신 후 능력이 끝나는 것, 그 역할이 "판에 있게" 되는 것은 무시한다 (더 많은 세계를 허용 → 관대).

### D9. 마귀할멈 자신의 기상

`wakesAs`에 `case "pithag": return night >= 2 && (aliveStart[seat] || vigorKept(ctx, seat, night))`.
(`became`는 `believedRole`이 데몬 토큰으로 바꿔 주므로 별도 처리 불요 — 독살범과 같은 줄에 두면 된다.)

### D10. 변신하지 않는 세계와 유일해 키

`worldKey` = 최종 배정 + 데몬 좌석. 변신 좌석이 선한 세계(최종 = 새 역할)와 그 좌석이 악역인 세계는
키가 다르다. 셋업만 다른 세계는 없다(변신이 결정적). 추가 조치 불요.

---

## 3. 변경 파일과 지시 (이 순서로)

1. `src/lib/solver/types.ts`
   - `SOLVER_ROLES`에 `"pithag", // 밤마다 1명을 판에 없는 캐릭터로 — 선인의 변신은 주장의 roleChange가 드러낼 때만 (결정적 타임라인), 자기 변신은 등록 ∃` 추가 (SV 구역, cerenovus 옆).
   - `Claim`에 `roleChange?: { night: number; from: RoleId }` + 주석(D3).
   - `ClaimInfo.asRole` 주석에 "또는 roleChange가 있는 주장 안에서" 추가.
2. `src/lib/solver/timeline.ts`
   - `DemonScenario.roleChanges?` (D6). `demonScenarios`에 7번째 매개변수 `roleChanges?: {...}[] | null`.
   - `tokenAt`·`tokenRoleAt`에 적용 (D6). `finish`에서 `roleChanges: roleChanges ?? undefined` 방출.
   - `doNight` 진입부에 D5 검사. `pithagSeat = assignment.indexOf("pithag")`.
   - `minstrelMode` D8. 도박사 `tokenView`에 `pithagSelfOptions`.
3. `src/lib/solver/registration.ts` — D8 (`TokenView.pithagSelfOptions`, 두 함수 수정, 헬퍼).
4. `src/lib/solver/ctx.ts` — `view()`에 옵션 채우기, `wakesAs` D7·D9.
5. `src/lib/solver/roles/props.ts` `dayView`, `roles/chambermaid.ts` — D8.
6. `src/lib/solver/solve.ts`
   - `validatePuzzle`: D1 거부 목록, D3 스키마 검사 (`asRole` 허용 조건 확장 포함).
   - `enumerate`: D4 (`changes` 계산 → `setup` → 토큰 중복·tf 수는 setup 기준 → swapBranches 루프 안에서
     `setup`이 이발사 교환과 겹치지 않도록: 이발사와 조합 거부라 `changes`가 있으면 `swapBranches`는 `[{kind:"none"}]`뿐이다).
   - `demonScenarios` 호출에 `roleChanges` 전달, `tryWorld`에 `setup`/`assignment(final)` 전달.
7. `src/lib/puzzles/codec.ts` `validateClaim`: `roleChange` 파싱 (`night` 정수 2..nights, `from` roleId). 없으면 undefined.
8. `src/lib/render.ts` / `src/components/PuzzleClient.tsx`: 주장 머리(역할명 옆)에 변신 이력 문구
   `밤 n부터 — 그전엔 X` 를 작은 글씨로. 역할 표기는 `roleLabel` (한국어(영어) 규약).
9. `src/components/PuzzleCreator.tsx`: 풀에 `pithag`가 있을 때 주장 편집기에 "변신 이력" 컨트롤
   (밤 select 2..nights, 이전 역할 select = `SWAPPABLE_ROLES ∩ pool`, 해제 옵션). 기존 `asRole` select의
   표시 조건을 `pool.includes("barber") || claim.roleChange !== undefined`로 넓히고, `roleChange`가 있을 때
   옵션은 `from` 하나만. (자동 동기화까지는 하지 않는다 — 검증이 잡는다.)
10. `src/data/role-notes.ts`: `pithag` 항목 (`whatItMeans`/`whenBroken`/`watchOut` — 형식은 `snakecharmer` 항목 참조).
    `tests/role-rules.test.ts`가 SOLVER_ROLES 전원의 해설을 요구한다.
11. `docs/REQUIREMENTS.md` §2.4: "24차 (2026-09-02): **Pit-Hag**" 항목(D1~D8 요약 6~10줄), "미룬 역할" 목록에서
    Pit-Hag 제거(Goon만 남김), "솔버 모델 경계"에 D2 가정 추가. `docs/ARCHITECTURE.md`는 손대지 않는다.
12. `tests/solver/pithag.test.ts` — §4.

`src/lib/solver/roles/index.ts`·`false-info.ts`는 **바꾸지 않는다** (마귀할멈은 정보도 행동 기록도 내지 않는다).

---

## 4. 테스트 (`tests/solver/pithag.test.ts`, vitest, `solve` 사용 — 형식은 `barber.test.ts`)

공통 픽스처 (8인, 3밤): 풀 `["imp","pithag","chef","empath","undertaker","librarian","soldier","mayor","washerwoman","courtier"]`,
사건 `[{death, night 2, seat 7}, {execution, day 2, seat 6}]` (밤2 사망은 임프 킬로 설명된다; 장의사 정보는 밤3에 좌석 6의 토큰을 본다),
좌석 1 주장: `role: "undertaker", roleChange: { night: 2, from: "empath" }, info: [{night 1, asRole "empath", empath count 0}, {night 3, undertaker shownRole …}]`.
나머지 좌석은 각자 역할 주장(정보 없음). **각 테스트는 유일해가 아니어도 된다** — 세계 집합의 존재/부재를 단언한다.

| # | 이름 | 단언 |
|---|---|---|
| 1 | 변신 이력 세계 성립 | `worlds.some(w => w.assignment[1] === "undertaker")` (최종 그리모어가 주장대로) |
| 2 | 새 역할이 판에 있으면 불가 | 좌석 3이 `undertaker`를 주장(정직 가능) → 좌석 1·3이 **둘 다 선한** 세계 없음 (`!(w.assignment[1]==="undertaker" && w.assignment[3]==="undertaker")` — 셋업 중복으로도 걸린다; 보다 정확히는 좌석 3을 `chef`로 두고 밤2에 다른 정직 선인이 장의사 토큰을 들고 있는 구성을 만들어 D5-4를 직접 때린다) |
| 3 | 죽은 마귀할멈은 변신 못 한다 | 변신 밤을 3으로 옮긴다(밤1·2 정보는 asRole empath). 좌석 6이 낮 2에 처형됐으므로 → `worlds.every(w => !(w.assignment[6]==="pithag" && w.assignment[1]==="undertaker"))` |
| 4 | 취한 마귀할멈은 변신 못 한다 | 대신(courtier) 좌석이 밤 2에 `courtier {role:"pithag"}` 기록, 변신 밤 3 → 대신 정직 ∧ 좌석 1 정직 세계 없음 (독살범이 없어 대신 무효 분기가 없다) |
| 5 | 밤당 1명 | 좌석 1·2가 같은 밤 변신 주장 → 둘 다 선한 세계 없음; 다른 밤이면 존재 |
| 6 | 즉시형 정보 | 밤 2에 `chef`로 변신 + 밤 2 chef 정보 → 세계 존재; 같은 정보를 밤 3에 두면 없음 (D7) |
| 7 | 자기 변신 ∃ | 장의사가 처형된 좌석을 `chef`로 봤다(chef를 아무도 주장 안 함) → 그 좌석이 `pithag`인 세계 존재; `chef`를 정직 가능 선인이 들고 있으면(밤2 시점 판에 있음) 그런 세계 없음 |
| 8 | 거부 목록 | 독살범 추가 / 데몬 2종 / 10인 / drunk / barber / 변신 밤 1 / `from`이 soldier / `asRole` 불일치 → 각각 `toThrow` |
| 9 | 회귀 | `npm test` 전체 통과, 특히 `barber.test.ts`·`philosopher.test.ts`·`role-rules.test.ts` |

테스트 8의 오류 메시지는 기존 형식을 따른다: `마귀할멈 퍼즐은 …` / `좌석 N: …`.

---

## 5. 문서 문구 초안 (role-notes)

- whatItMeans: "첫날 밤 이후 매일 밤, 한 명을 골라 대본에 있지만 판에 없는 캐릭터로 바꾼다. 진영은 그대로다. 바뀐 사람은 그 밤 새 역할을 통보받으므로, 정직한 선인이라면 다음 날 '나는 원래 X였는데 밤 n부터 Y가 됐다'고 밝힌다 — 그 이력 주장이 진짜인지가 퍼즐이 된다."
- whenBroken: "취하거나 중독된 밤의 선택은 무효다. 이력 주장이 참이려면 그 밤 마귀할멈이 살아 있고 멀쩡했어야 하며, 새 역할이 그때 판에 없었어야 한다."
- watchOut: "마귀할멈은 자기 자신도 바꿀 수 있다 — 처형된 마귀할멈의 시신이 장의사에게 마을 사람으로 보일 수 있다. 이 퍼즐 대본에서 하수인은 마귀할멈뿐이고 데몬은 한 종류라, 새 데몬이나 하수인이 생기는 일은 없다."

---

## 6. 완료 기준

- [ ] `npm test` 전부 통과 (기존 307건 + 새 테스트).
- [ ] `npm run typecheck` 오류 없음, `npm run lint` 통과.
- [ ] 편집기에서 마귀할멈 퍼즐을 만들어 변신 이력을 넣고 저장·재로드해도 `roleChange`가 보존된다 (codec 왕복).
- [ ] REQUIREMENTS §2.4 24차 항목·미룬 목록·모델 경계 갱신.
- [ ] 브랜치 `feat/solver-pithag`에 커밋: `feat(solver): 마귀할멈 모델링 — 70 → 71종` (본문에 D1·D2·D8 요약).

---

## 7. 하지 말 것

- `roleSwap`을 `roleChanges`로 통합하지 않는다 (이발사·조련사 코드 무변경).
- `registration.ts`의 진영 함수 3종을 손대지 않는다.
- 데몬 생성·데몬 변신·하수인 변신을 "일단" 구현하지 않는다 — D1·D2가 그것을 불가능하게 만든 이유가 문서화되어 있다.
- 주변 코드 정리·리팩터·주석 수정 금지 (CLAUDE.md §3).
- `next dev`가 CLAUDE.md 상단에 다시 쓰는 블록은 커밋에 포함하지 않는다.

---

## 8. 검증 명령

```
npm test
npm run typecheck
npm run lint
npx vitest run tests/solver/pithag.test.ts tests/solver/barber.test.ts tests/solver/philosopher.test.ts
```

---

## 9. 멈추고 물어야 할 때

1. D2의 가정("데몬을 마을 사람으로 바꾸면 게임이 끝난다")이 사용자 룰링과 다르다고 들으면 —
   대안은 "데몬 좌석도 밤 n부터 등록 ∃ + 그 뒤 킬 부재 공짜"인데 퍼즐 유일해가 크게 약해지므로 결정이 필요하다.
2. `tokenAt(…, night - 0.5)`가 기존 코드의 시각 규약(밤 n = n, 낮 d = d + 0.5)과 충돌하는 곳을 발견하면.
3. 이발사 테스트가 D7 수정으로 깨지면 — 고치지 말고 어떤 단언이 왜 깨졌는지 보고한다.
4. 편집기(PuzzleCreator)의 기존 `asRole` 흐름을 바꾸지 않고는 `roleChange` UI를 넣을 수 없다고 판단되면.
