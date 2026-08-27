<div align="center">

# 🕰️ 시계탑 퍼즐

**Blood on the Clocktower의 한 장면을 순수 논리 퍼즐로 바꾼 비공식 팬 사이트**

주장과 밤의 기록만으로 악마를 찾아라. 모든 문제는 답이 **하나뿐임이 기계로 증명**된 뒤에만 올라온다.

[**▶ 사이트 열기**](https://clocktower-fan-puzzles.vercel.app)

[![CI](https://github.com/LeeSongHeon-LSH/clocktower-puzzles/actions/workflows/ci.yml/badge.svg)](https://github.com/LeeSongHeon-LSH/clocktower-puzzles/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/code-MIT-blue)

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-105_passing-6E9F18?logo=vitest&logoColor=white)
![Static](https://img.shields.io/badge/배포-100%25_정적-brightgreen)

</div>

---

## 이게 뭔가요

소셜 추리 보드게임 *Blood on the Clocktower*는 사람들과 둘러앉아 거짓말을 가려내는 게임입니다.
이 사이트는 그 게임의 **한 순간을 정지 화면으로 떼어내** 혼자 풀 수 있는 논리 퍼즐로 만듭니다.

모든 플레이어의 공개 주장과 밤의 사망 기록이 주어집니다. 그중 누군가는 거짓말을 하고 있고,
누군가는 취하거나 중독돼 자기도 모르게 틀린 정보를 말하고 있습니다. 남은 것은 논리뿐입니다.

## 이 프로젝트의 한 가지 고집

> **찍어서 맞히는 문제는 문제가 아니다.**

모든 퍼즐은 배포 전에 **솔버가 가능한 모든 배치를 전수 탐색해** 답이 정확히 하나임을 증명합니다.
이 검증에 실패하면 어떤 문제도 사이트에 올라가지 못합니다. 사용자가 직접 만든 문제도 예외가 아니며,
그쪽은 **브라우저가 그 자리에서** 같은 검증을 수행합니다.

```
가능한 모든 그리모어 배치 생성
  → 각 배치에서 모든 주장이 규칙상 성립 가능한지 평가
  → 살아남은 배치가 정확히 1개일 때만 통과
```

## 주요 기능

| | |
|---|---|
| 🔍 **검증된 퍼즐 10종** | 쉬움부터 어려움까지, 전부 유일해 증명 완료 |
| 🕯️ **시계 문자판 타운스퀘어** | 좌석을 눌러 주장·정보 확인, 정답 제출 후 그리모어 공개 |
| 📖 **규칙 문서** | 취함·중독과 역할 20종 해설 — **모든 서술에 공식 원문 출처 각주** |
| ✍️ **사설 문제 만들기** | 브라우저가 유일해를 검증하고, 통과하면 공유 링크 발급 |
| 🔗 **저장소 없는 공유** | 문제 전체가 링크 안에 들어감 — 서버에 아무것도 남지 않음 |
| 📈 **진행도 기록** | localStorage에만 저장, 서버 전송 없음 |

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js 16** (App Router) | 전 페이지 정적 생성, Vercel 네이티브 |
| 언어 | **TypeScript** (strict) | 퍼즐·솔버 도메인 타입이 곧 명세 |
| 스타일 | **Tailwind CSS v4** | 밤의 마을 팔레트를 CSS 변수로 |
| 테스트 | **Vitest** | 유일해 검증이 핵심 테스트 |
| 렌더링 | **SVG 직접 구현** | 타운스퀘어에 차트 라이브러리 불필요 |
| 배포 | **Vercel** | `main` push = 자동 배포 |

**런타임 의존성은 `next`, `react`, `react-dom` 셋뿐입니다.** 서버 라우트도, API도, 데이터베이스도,
환경변수도 없습니다 — 100% 정적 사이트입니다.

> 구조도와 데이터 흐름은 **[docs/STACK.md](docs/STACK.md)** 에 그림으로 정리했습니다.

## 시작하기

```bash
npm install
npm run dev          # http://localhost:3000

npm test             # 솔버 단위 테스트 + 전 퍼즐 유일해 검증 (배포 게이트)
npm run typecheck
npm run lint
npm run build

npm run rules:check  # 규칙 문서 인용을 공식 원문과 대조 (네트워크 필요)
npm run rules:sync   # 대조 후 생성 파일 갱신
```

## 문제 기여하기

경로는 둘이고, 통과해야 할 관문은 **유일해 증명 하나로 같습니다.**

**경로 A — 링크로 바로 공유.** 사이트의 [문제 만들기](https://clocktower-fan-puzzles.vercel.app/create)에서
만들면 브라우저가 즉시 검증하고 링크를 줍니다. 가입도 승인도 필요 없습니다.

**경로 B — 사이트에 정식 수록.** `src/data/puzzles/`에 파일을 추가해 PR을 열면 CI가 유일해를
다시 검증합니다. 통과하지 못하면 병합되지 않습니다. 정식 수록 문제에는 힌트(최대 2개)와
단계별 해설이 필요합니다.

자세한 작성법은 사이트의 [업로드 가이드](https://clocktower-fan-puzzles.vercel.app/guide)에 있습니다.

## 문서

| 문서 | 내용 |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | 요구사항 — 무엇을 만들기로 했는가 (진실 원본) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 아키텍처 — 어떻게 만들었는가 (진실 원본) |
| [docs/STACK.md](docs/STACK.md) | 구조도·데이터 흐름 다이어그램 |

---

## ⚖️ 저작권과 팬 콘텐츠 고지

**이 프로젝트는 The Pandemonium Institute와 아무런 관련이 없는 비공식 팬 프로젝트입니다.**
공식이 승인하거나 후원하거나 검수하지 않았습니다.

<table>
<tr><td width="180"><strong>상표</strong></td>
<td><em>Blood on the Clocktower</em>와 관련 명칭·로고는 The Pandemonium Institute의 상표입니다.
이 프로젝트는 게임을 식별하기 위한 목적으로만 명칭을 사용합니다.</td></tr>

<tr><td><strong>아트워크</strong></td>
<td><strong>공식 아트워크·아이콘·토큰 이미지를 일절 사용하지 않습니다.</strong> 이 저장소에는 공식
이미지 자산이 포함돼 있지 않으며, 타운스퀘어를 포함한 모든 그래픽은 직접 구현한 SVG입니다.</td></tr>

<tr><td><strong>규칙 인용</strong></td>
<td>규칙 문서는 <a href="https://wiki.bloodontheclocktower.com">공식 알마낙</a>의 문장을
<strong>대조·검증 목적으로 짧게 인용</strong>하며, 인용마다 출처 문서와 판본을 명시합니다.
해당 문장의 저작권은 The Pandemonium Institute에 있습니다.</td></tr>

<tr><td><strong>역할명 번역</strong></td>
<td>한국어 역할명과 능력 문구는 Pandemonium Institute가 공개한
<a href="https://github.com/ThePandemoniumInstitute/botc-translations">공식 번역</a>을
그대로 따릅니다. 저작권은 The Pandemonium Institute에 있습니다.</td></tr>

<tr><td><strong>게임 구매</strong></td>
<td>이 사이트는 원작 게임을 대체하지 않습니다. 재미있게 푸셨다면
<a href="https://bloodontheclocktower.com">bloodontheclocktower.com</a>에서 원작을 만나 보세요.</td></tr>

<tr><td><strong>사설 문제</strong></td>
<td>이용자가 만들어 링크로 공유한 문제는 이 사이트가 저장하거나 검수하지 않으며,
그 내용은 만든 사람의 책임입니다.</td></tr>
</table>

권리자로부터 문제 제기가 있을 경우 즉시 해당 부분을 수정하거나 내리겠습니다.
[이슈](../../issues)로 알려 주세요.

### 코드 라이선스

이 저장소의 **소스 코드**는 [MIT 라이선스](LICENSE)로 제공됩니다.
단, 위에 명시한 제3자 콘텐츠(공식 규칙 인용문, 공식 한국어 번역, 상표)는 MIT 적용 대상이
**아니며** 각 권리자에게 귀속됩니다. 자세한 내용은 [NOTICE](NOTICE)를 참조하세요.
