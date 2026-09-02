# 건달(Goon) 솔버 모델링 — 설계 및 구현 지시서 (25차)

작성: 2026-09-02. 이 문서는 **설계 결정이 끝난 상태**로, 구현자(사람 또는 다른 모델)가 그대로
따라 코드를 쓰기 위한 것이다. 결정을 바꾸고 싶으면 코드를 고치지 말고 §9의 "멈춰야 할 때"에 따라
질문한다. 코드 작업 전에 `CLAUDE.md`, `docs/REQUIREMENTS.md` §2.4·§2.5, `docs/ARCHITECTURE.md` §4를 읽는다.
마귀할멈(24차, `docs/design/pithag.md`)이 먼저 편입된 상태를 전제한다 — 그 문서의 D1 거부 목록에
`goon`이 들어가 있어야 한다 (§3-6 참조).

## ⚠ 작업 절차 (위험 방지 — 반드시 지킬 것)

1. **브랜치에서만 구현한다.** `main`에서 `git switch -c feat/solver-goon`을 만들고 거기서 작업한다.
   `main`에 직접 커밋하지 않는다. 푸시는 사용자가 지시할 때만 한다.
2. **구현자는 이 문서의 결정을 바꾸지 않는다.** 결정이 틀렸다고 생각되면 §9에 따라 멈추고 보고한다.
3. **검토는 Fable이 한다.** 구현이 끝나면 diff 검토와 테스트 결과 판정은 Claude Fable 세션에서
   진행한다 (`git diff main...feat/solver-goon` + `npm test` 전체). 구현자 스스로 "완료"를 선언하지
   않는다 — 테스트가 통과했다는 사실만 보고한다.
4. 기준선(2026-09-02): `npm test` = 34 파일 307건 통과 (+ 마귀할멈 편입분). 구현 뒤에도 전부 통과해야 한다.
   기존 테스트 단언을 고쳐서 통과시키는 것은 금지 — 깨지면 §9-3.

---

## 0. 한 문단 요약

건달은 매밤 **자기 능력으로 자기를 고른 첫 플레이어**를 황혼까지 취하게 하고, 그 플레이어의
진영이 된다. 이 솔버에서는 (1) 밤마다 "첫 선택자 F"를 **분기**로 열거하고(취함은 16차의 확정
취함 `drunkNights`로, 진영은 새 상태 `goonEvil`로), (2) 좌석의 진영을 묻는 모든 판정을 역할
고정에서 **밤별 진영**으로 넓히며(등록 함수 두 개 + 타임라인의 팀 판정 세 곳), (3) **지금 악한
건달은 주장을 날조할 수 있으므로** 주정뱅이·광인 옆의 숨은 외부인 슬롯으로 열거한다. 데몬이
건달을 고르면 데몬이 취해 킬이 실패한다 — 킬 부재 설명 하나가 늘어난다.

---

## 1. 공식 규칙 (위키 https://wiki.bloodontheclocktower.com/Goon 에서 2026-09-02 확인)

- 능력: "매일 밤, 자기 능력으로 당신을 선택하는 첫 플레이어는 황혼까지 취합니다. 당신은 그 플레이어가 소속한 팀이 됩니다."
- "첫 플레이어" = 그 밤 아직 아무도 건달 때문에 취하지 않았을 때 건달을 고른 사람. 그 밤과 다음 낮 동안 능력이 작동하지 않는다.
- 진영이 다르면 건달의 토큰을 돌리고 새 진영을 통보한다. **아무도 안 고르면 진영은 그대로다.**
- 첫날 밤부터 작동한다 (`*` 없음).
- 이미 취했거나 중독된 플레이어가 골라도 그 플레이어는 취하고 건달의 진영은 바뀐다.
- 데몬이 건달을 고르면 데몬이 취해 **킬이 실패한다** (위키 샤바로스 예시: 둘 다 죽지 않는다).
- 건달이 취하거나 중독됐으면 건달의 능력이 작동하지 않는다 — 선택자는 취하지 않고 진영도 안 바뀐다.
- 죽은 건달은 능력이 없고 진영이 고정된다.

---

## 2. 모델링 결정 (각 항목에 건전성 근거)

"건전성" 기준: **실제로 가능한 세계를 빠뜨리면 안 된다.** 불가능한 세계를 더 세는 것(관대한 근사)은 허용.

### D1. 밤별 첫 선택자 F의 분기 (timeline `St`)

새 상태: `goonEvil: boolean`(초기 false — 건달은 셋업에 선), `goonAlign: Map<night, {before, after}>`(방출용),
`goonFirst: { rank: number } | null`(이 밤의 F — 킬 로직이 소비).
건달이 배정에 있고 **밤 시작에 살아 있을 때만** 분기한다 (죽으면 진영 고정, 분기 없음).
분기 위치: `doNight`에서 뱀 조련사 블록 뒤, `drunkSourceBranches` **앞** (선원·여관주인이 건달을 골랐을 때
그들의 취함이 `forbid_`를 깨야 하므로 먼저 표시돼야 한다).

후보 F와 각 분기의 효과 (모든 분기에서 `markDrunk(st, night, F좌석)` + `goonEvil := F의 진영`; 순위 §2-D2):

| F | 조건 | 추가 효과 |
|---|---|---|
| `none` | §D2의 "기록된 선택자 없음"일 때만 | 없음 (진영 유지) |
| `goonAbnormal` | `require_(st, night, goonSeat)` 성공 | 건달 능력 무효 — 아무도 취하지 않고 진영 유지. 기록된 선택자가 있어도 허용된다 (그들은 골랐지만 아무 일도 없었다). |
| `poisoner` | 독살범 배정·생존(또는 vigorKept)·`!st.required.has(night)` | 독살범 취함 → 그 밤 독살 없음 (§D5). 건달 → 악 |
| `demon` | 데몬 실제 생존(좀부울 가짜 죽음 포함), 봉쇄 밤 아님, 음유시인 밤 아님 | 데몬 취함 → 그 밤 데몬 킬 실패 (§D4). 건달 → 악 |
| `assassin` / `godfather` / `devilsadvocate` / `witch` / `cerenovus` / `pithag` | 그 하수인이 배정·생존(또는 vigorKept)·데몬 승계 안 함. 대부는 트리거 밤만, 암살자는 미사용일 때만 | 취함 (암살자는 **소진 표시 안 함** — 관대). 건달 → 악 |
| `goodRecorded(s)` | 선한 정직 좌석 s의 그 밤 행동·정보 기록이 건달을 대상으로 한다 (§D3 목록) | s 취함 (그 밤 정보 무제약, 보호·지목 실패). 건달 → 선 |
| `goodUnknown` | 그 밤 깨어나 플레이어를 고르는 선한 좌석 중 기록이 없는 좌석이 하나라도 있다 (집사 포함) | 아무도 취함 표시 안 함 (관대 — 기록 없는 밤은 대상 미상). 건달 → 선 |

**완전성이 건전성이다**: 건달을 골랐을 수 있는 모든 플레이어가 후보에 있어야 한다. 루나틱은
능력이 없어 선택자가 아니다 (결정 — §9). 대신·철학자는 캐릭터를 고르므로 선택자가 아니다.
달의 자손 지목은 낮 공개 행동이라 선택자가 아니다.

### D2. 밤 순서 — 순위표와 "첫" 규칙

정확한 밤 순서를 전부 싣지 않고, 필요한 만큼만 순위(rank)로 둔다. 같은 순위끼리는 ∃(어느 쪽이든).

```
0 poisoner          (모든 판본에서 철학자 다음 첫 행동)
1 snakecharmer  2 monk  3 devilsadvocate  4 witch  5 cerenovus  6 pithag
7 sailor  8 innkeeper  9 gambler  10 exorcist
20 demon (임프·Po·샤바로스·좀부울·푸카·팡 구·비고르모르티스·노 다시·보르톡스)
21 assassin  22 godfather
25 ravenkeeper  26 professor
30 fortuneteller  31 dreamer  32 seamstress  33 chambermaid  34 butler
goodUnknown = 0 (∃ — 어느 시점이든 가능)
```

규칙: 기록된 선한 선택자 중 건달을 고른 좌석들의 최소 순위를 `rMin`이라 하면,
- `none`은 그런 좌석이 없을 때만 허용.
- 그 밖의 F는 `rank(F) <= rMin`이어야 한다 (F가 기록된 선택자보다 먼저 행동했어야 첫 선택자다).
- `goodRecorded(s)`는 `rank(s) === rMin`인 좌석만 (동순위 ∃).
근거: 후보를 빠뜨리지 않으면서(순위가 앞선 숨은 선택자 전부 허용) 명백히 불가능한 순서만 자른다.

### D3. "기록된 선택자"의 출처

선한 정직 좌석(주정뱅이·광인·루나틱·광기 좌석·숨은 건달 제외)의 그 밤 `info.data`에서 대상 좌석을 뽑는다:
`monk.target`, `exorcist.target`, `sailor.target`, `innkeeper.targets`, `gambler.target`, `snakecharmer.target`,
`professor.target`, `ravenkeeper.target`, `fortuneteller.targets`, `dreamer.target`, `seamstress.targets`,
`chambermaid.targets`. 이 중 건달 좌석을 포함한 기록이 "건달을 고른 기록"이다.
**주정뱅이 좌석**의 기록(믿는 역할로서 고른 것)은 강제하지 않고 `goodRecorded` 후보로만 허용한다 (∃ —
취한 사람의 선택도 발동한다는 규칙과 "능력이 없는 사람의 선택"의 경계가 불분명하므로 양쪽 허용, 관대).

### D4. 데몬이 F일 때의 킬 로직 (`doNightRest`)

`st.goonFirst`가 데몬이면: `killSets = [[]]`(데몬 킬 없음), 킬 부재 설명은 **공짜** (`() => true` 변형 하나만,
'선택했으나 실패' 계열 변형 없음). 데몬은 이미 `drunkNights`에 있어 `forbid_(demon)`이 실패하고
`require_(demon)`이 성립한다 — 푸카의 "선택 무효"(다음 밤 `require_(pkPrev, demon)`)와 대신/독살 강제가
자동으로 맞는다. Po: 대상을 고른 것이므로 `poChoseNone = false`. 푸카: 그 밤의 실행 단계도 무산이므로
기존 변형 (4)와 같은 누수 표시(`pukkaMark` 생존자 전원, pkPrev·night)를 한다.
**팡 구 점프 변형은 F가 데몬이면 열지 않는다** (취한 팡 구는 점프하지 못한다).

건달이 그 밤 **데몬에게 죽은** 세계(`demonKills`에 건달 포함, 또는 점프 대상이 건달): 데몬이 건달을 골랐는데
데몬이 F가 아니어야 하므로 `st.goonFirst !== null && st.goonFirst.rank < 20`을 요구한다. 암살자·대부 귀속의
대상이 건달이면 각각 `rank < 21`, `rank < 22`. 없으면 그 귀속은 모순.
(건달이 이미 악이어도 데몬은 건달을 죽일 수 있다 — 진영과 무관.)

### D5. 취한 독살범·취한 보르톡스 — 공용 수정 (관대 → 정확, 건전성 유지)

- `require_`: `st.drunkNights.get(night)?.has(seat)` 검사 **다음에** `if (st.drunkNights.get(night)?.has(poisonerSeat)) return false;`
  (취한 독살범의 독은 듣지 않는다 — 스위트하트 줄과 같은 취지). 기존 선원·여관주인·대신이 독살범을
  취하게 한 경우에도 이제 정확해진다 (실제로 불가능한 세계를 덜 센다 → 건전).
- `solve.ts` 빠른 경로 마지막 검사 루프와 열거 경로의 `optionsPerNight`: `isSweetDrunk(ctx, poisonerSeat, night)`
  옆에 `isExtraDrunk(ctx, poisonerSeat, night)` 추가.
- 보르톡스가 F(취함)인 밤: 마을 사람 정보의 거짓 강제가 풀린다 — `solve.ts` 두 경로의
  `required.get(i.night) === vortoxSeat` / `vector[i.night] === vortoxSeat` 옆에 `isExtraDrunk(ctx, vortoxSeat, i.night)` 추가 (무제약, 관대).
- 수학자(`mathematician.ts`): `isExtraDrunk`인 좌석을 확정 비정상(min·max 둘 다)으로 센다 — 취한 선택자는
  "능력이 비정상 동작한 플레이어"다. (기존 이동식 취함에도 같은 규칙이 적용된다 — 정확해지는 방향.)

### D6. 진영 판정 — 밤별 상태로 넓힌다

- `DemonScenario.goonAlign?: ("good" | "evil" | "either")[]` (밤 인덱스; `finish`에서 `goonAlign` Map으로부터:
  `before === after`면 그 값, 다르면 `"either"`). 낮 d는 밤 d의 `after`를 쓴다 (낮 정보 규약: `night n = 낮 n`).
  근거: 밤 n의 정보 역할이 F보다 먼저 행동했는지 나중인지 따지지 않고 양쪽을 허용한다 (관대).
- `TokenView`에 `goonAlign?: "good" | "evil" | "either"` 추가. `view(ctx, night)`·`dayView`(props)·timeline의
  도박사 `tokenView`(그 시점 `st.goonEvil`을 확정값으로) 세 곳에서 채운다.
- `registration.ts`: `canRegisterEvil` — 토큰이 `goon`이면 `goonAlign !== "good"`; `mustRegisterEvil` — 토큰이
  `goon`이면 `goonAlign === "evil"`. `canRegisterDemon`·`isEvilRole`·`canShowAsRole`·`canShowAsOtherThan`은 그대로
  (건달은 역할 오등록이 없고, 은둔자의 "악한 역할" 등록은 역할 기준이다).
- 이 두 함수를 쓰는 체커(초공감자·요리사·재봉사·신탁·명제·거짓 정보)는 자동으로 따라온다. 사서·빨래꾼·
  수사관·꽃파는 소녀·마을 서기·시계공은 역할 팀 기준이라 무변경 (건달은 진영과 무관하게 외부인 토큰).
- timeline의 팀 판정: `tlForced`(찻집 여인 확실 보호 — 이웃이 건달이면 `!st.goonEvil`일 때만 확실),
  `tlCanProtect`(이웃이 건달이면 `!st.goonEvil`이면 가능), 달의 자손 저주 대상이 건달이면 `!st.goonEvil` 요구.
  할머니의 손주 판정은 셋업 진영(선)이라 무변경. 대부 트리거(외부인 처형)·팡 구(외부인)는 역할 기준이라 무변경.

### D7. 지금 악한 건달의 날조 주장 — 숨은 외부인 슬롯

- `assignableRoles`·`hiddenRoles`에 `"goon"` 추가 (풀에 있을 때). 마을 사람을 주장하는 선한 좌석 하나가
  실제로는 건달일 수 있다. 그 좌석의 주장은 전부 날조 → 구조·내용 검증 생략 (광인과 같은 줄).
- **성립 조건**: 마지막 밤 이후 건달이 악해야 한다 — `demonScenarios`에 `goonHidden: boolean`을 넘기고
  `finish`에서 `goonHidden && !st.goonEvil`이면 그 시나리오를 버린다. 선한 건달은 정직하게 `goon`을 주장한다.
  세레노부스 광기 좌석의 실제 역할이 건달인 경우(`madSeat`)는 광기로 날조한 것이므로 이 조건을 걸지 않는다.
- 건달을 **주장**하는 좌석(`role: "goon"`, 정보 없음)은 선·악 어느 진영이든 진실일 수 있다 (악한 건달도
  솔직할 수 있다) — 선한 좌석 배정으로 그대로 취급, 추가 조건 없음.
- `World`에 `goonEvil?: boolean`(건달이 배정에 있을 때 현재 진영)을 싣고 **`worldKey`에 포함**한다 —
  토큰 회전은 그리모어 상태이고 해설이 건달의 진영을 말해야 한다 (§9-1에서 확인 요청).

### D8. 기상

`wakesAs`에 `case "goon": return false` (건달은 깨어나지 않는다 — default와 같지만 명시).

### D9. 조합 거부 (validatePuzzle)

- 이발사 거부 목록(`["drunk","mutant","lunatic","cerenovus","fanggu"]`)에 `"goon"` 추가 — 숨은 악한 건달은
  주장을 날조해 숨은 교환을 은닉할 수 있다.
- 마귀할멈 D1 거부 목록에도 `"goon"` (같은 이유 — `docs/design/pithag.md` D1 표에 한 줄 추가하고 그 코드도 반영).
- 그 밖의 조합(뱀 조련사·스위트하트·팡 구·보르톡스·Po·푸카 등)은 D1·D4가 일반적으로 처리한다 — 거부하지 않는다.

### D10. 성능

분기 수는 밤당 대략 (none/abnormal/poisoner/demon/하수인 1~2/goodRecorded 0~1/goodUnknown) ≈ 5~7, 건달이
배정된 세계에서만 곱해진다. 구현 후 `tests/solver` 전체 시간을 기준선(≈1초)과 비교해 보고한다. 10배를
넘으면 §9-4.

---

## 3. 변경 파일과 지시 (이 순서로)

1. `src/lib/solver/types.ts` — `SOLVER_ROLES`에 `"goon"` (BMR 구역, `lunatic` 옆) + 주석; `World.goonEvil?`;
   `worldKey`에 `|goon:` 접미 (건달이 없으면 생략해 기존 키 불변).
2. `src/lib/solver/timeline.ts` — `St`에 D1 상태 3종, `cloneSt` 갱신; `DemonScenario.goonAlign?`; `demonScenarios`
   매개변수 `goonHidden?: boolean`; `GOON_RANK` 상수표(D2); `goonBranches(st, night)` 함수(D1·D2·D3) — `drunkSourceBranches`
   바로 앞에서 호출해 그 결과 각각에 `drunkSourceBranches`를 적용; `doNightRest` D4; `require_` D5; `tlForced`/`tlCanProtect`/달의 자손 D6;
   도박사 `tokenView` D6; `finish` 방출 + D7 조건. 밤이 끝날 때(`doDay` 호출 직전) `goonAlign.set(night, {before, after})`, `goonFirst = null`.
   `before`는 밤 진입 시 `goonEvil`, `after`는 분기 적용 후 값.
3. `src/lib/solver/registration.ts` — `TokenView.goonAlign?`, D6 두 함수.
4. `src/lib/solver/ctx.ts` — `view()`에 `goonAlign` 채우기(`ctx.sc.goonAlign?.[night]`), `wakesAs` D8.
5. `src/lib/solver/roles/props.ts` `dayView`, `roles/mathematician.ts` D5.
6. `src/lib/solver/solve.ts` — D7(assignable/hidden/검증 생략/goonHidden 전달/World.goonEvil), D5(두 경로), D9.
7. `src/data/role-notes.ts` — `goon` 항목 (§5).
8. `docs/REQUIREMENTS.md` §2.4 — "25차 (2026-09-02): **Goon**" 항목(D1·D2·D5·D7 요약), "미룬 역할" 목록 제거
   (이제 비어 있음 — "3판본 72종 전부 편입" 한 줄로 대체), 모델 경계에 "루나틱은 건달의 선택자가 아니다" 추가.
9. `tests/solver/goon.test.ts` — §4. 기존 `tests/solver/barber.test.ts`의 거부 테스트에 `goon` 케이스 한 줄 추가 가능.

편집기·코덱·렌더는 **무변경** — 건달은 새 정보·행동 기록·이벤트가 없다 (건달 주장 = 역할만).

---

## 4. 테스트 (`tests/solver/goon.test.ts`)

공통 픽스처 (7인, 3밤): 풀 `["imp","poisoner","goon","chef","empath","undertaker","librarian","soldier","washerwoman","mayor"]`
(독살범을 빼는 변형은 `spy`로 바꿔 하수인 수를 유지), 좌석 3이 `goon` 주장, 좌석 2·4가 초공감자/요리사 등 이웃.
각 테스트는 세계 집합의 존재/부재를 단언한다.

| # | 이름 | 단언 |
|---|---|---|
| 1 | 데몬이 건달을 고르면 킬이 실패한다 | 밤2 사망 없음, 킬 부재 설명 수단 없음(군인·수도사 없음, 독살범 → `spy`) → 건달이 정직한 세계 존재하고 그 세계의 `goonEvil === true`. 대조군: 풀에서 `goon`을 빼고 좌석 3을 `mayor`로 → 세계 없음 |
| 2 | 건달의 밤 사망에는 앞선 선택자가 필요하다 | 밤2 좌석 3 사망, 독살범 없음(`spy`), 기록된 선택자 없음 → `assignment[3]==="goon"`인 세계 없음. 독살범이 있으면 존재하고 `goonEvil === true`(독살범이 먼저 골랐다) |
| 3 | 취한 독살범은 독살하지 못한다 | 밤2·밤3 각각 어떤 정보가 반드시 거짓(그 밤 독살 강제) + 밤2·밤3 데몬 킬 있음 + 밤3 초공감자가 건달 이웃을 1로 셈(다른 악 이웃 없음, 기록된 선택자 없음) → 독살범·데몬 모두 F가 될 수 없어 건달이 악이 될 길이 없다 → 세계 없음. 밤3의 독살 강제를 빼면 존재(독살범이 밤3에 건달을 골랐다 — 그 세계의 `poisonTargets[3] === null`) |
| 4 | 기록된 수도사가 첫 선택자다 | 수도사가 밤2에 건달 보호 기록 + 밤2 건달 사망 → 존재(수도사 취함 → 보호 실패, 데몬 킬). 변형: 독살범 → `spy`, 밤2 사망 없음, 밤3 데몬 킬 있음, 초공감자 밤3 건달 이웃 1 → 밤2의 F는 수도사(순위 2)라 데몬(20)은 F가 못 되고 밤3엔 악한 후보가 없어 건달은 선 → 세계 없음 |
| 5 | 건달 중독 시 무효 | 수도사 기록 밤2 건달 보호 + 초공감자 밤3 건달 이웃 1 + 밤2·3 데몬 킬 있음 → 독살범이 밤2에 건달을 중독시켜(수도사 발동 무효) …로는 악이 못 되므로 없음; 이 테스트는 3과 겹치면 생략 가능 |
| 6 | 숨은 건달 | 좌석 5가 `washerwoman` 주장 + 명백히 거짓인 밤1 정보, 풀에 `goon` → 밤2·3 모두 데몬 킬이 있고 독살범 없음이면 `assignment[5]==="goon"` 세계 없음(악이 될 길이 없다); 밤3을 조용한 밤으로 바꾸면 존재 |
| 7 | 유일해 키 | 같은 그리모어에서 건달 진영만 다른 두 세계 → `solve`가 2개를 돌려준다 (문서화된 동작) |
| 8 | 거부 | 이발사 + 건달 → `toThrow(/이발사와/)`; 마귀할멈 + 건달 → `toThrow(/마귀할멈/)` |
| 9 | 회귀 | `npm test` 전체 통과. 특히 `drunk-sources.test.ts`(D5로 정확해진 독살범 취함)·`vortox-mutant.test.ts`·`death-mechanics.test.ts` |

---

## 5. 문서 문구 초안 (role-notes `goon`)

- whatItMeans: "매일 밤, 자기 능력으로 건달을 고른 첫 플레이어가 그 밤과 다음 낮 동안 취하고, 건달은 그 플레이어의 진영이 된다. 악마가 건달을 고르면 악마가 취해 아무도 죽지 않는다 — 조용한 밤의 설명이 하나 늘어난다. 진영이 바뀐 건달은 거짓말을 시작할 수 있다."
- whenBroken: "건달이 취하거나 중독된 밤에는 아무 일도 없다 — 고른 사람은 취하지 않고 진영도 그대로다."
- watchOut: "아무도 안 고른 밤엔 진영이 유지되고, 죽으면 그 진영으로 고정된다. 초공감자·요리사가 세는 '악'에는 지금 악한 건달이 들어간다. 지금 악한 건달은 마을 사람을 사칭할 수 있으므로, 거짓 정보를 낸 자리가 건달일 가능성을 계산에 넣어야 한다."

---

## 6. 완료 기준

- [ ] `npm test` 전부 통과 (기존 단언 수정 없이).
- [ ] `npm run typecheck`·`npm run lint` 통과.
- [ ] `tests/solver` 실행 시간이 기준선의 10배 이내.
- [ ] REQUIREMENTS §2.4 25차 항목, 미룬 목록 정리, 모델 경계 갱신. `docs/design/pithag.md` D1에 `goon` 반영.
- [ ] 브랜치 `feat/solver-goon`에 커밋: `feat(solver): 건달 모델링 — 71 → 72종 (3판본 완성)`.

---

## 7. 하지 말 것

- 밤 순서표를 D2보다 정밀하게 만들지 않는다 (동순위 ∃로 충분하다).
- `isEvilRole`·`canShowAsRole` 등 역할 기반 등록 함수를 진영 기반으로 바꾸지 않는다.
- 루나틱을 선택자로 넣지 않는다.
- 기존 테스트 단언을 고치지 않는다. 깨지면 보고한다.
- 주변 코드 정리·리팩터·주석 수정 금지 (CLAUDE.md §3). `next dev`가 CLAUDE.md에 다시 쓰는 블록은 커밋하지 않는다.

---

## 8. 검증 명령

```
npm test
npm run typecheck
npm run lint
npx vitest run tests/solver/goon.test.ts tests/solver/drunk-sources.test.ts tests/solver/vortox-mutant.test.ts
```

---

## 9. 멈추고 물어야 할 때

1. `worldKey`에 건달 진영을 넣는 결정(D7)이 기존 퍼즐의 유일해를 깨뜨리면 — 어떤 퍼즐인지 보고하고 결정을 기다린다.
2. D5의 "취한 독살범" 정확화로 기존 테스트가 깨지면 — 단언을 고치지 말고 어떤 세계가 사라졌는지 보고한다.
3. 어떤 기존 테스트든 깨지면 — 위와 같다.
4. `tests/solver` 실행 시간이 10배를 넘으면 — 분기 수 통계와 함께 보고한다 (후보: `goodUnknown`과 하수인 후보 병합).
5. 루나틱·주정뱅이의 선택이 건달을 발동시키는지에 대한 룰링을 사용자가 다르게 주면.
