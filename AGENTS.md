<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 시계탑 퍼즐 프로젝트 가이드

Blood on the Clocktower 상황 추리 퍼즐 웹앱. 설계 합의 내용은 `docs/REQUIREMENTS.md`, 구조는 `docs/ARCHITECTURE.md`가 진실 원본이다 — 코드 작업 전에 두 문서를 읽을 것.

핵심 불변 규칙:
- 모든 퍼즐은 `npm test`(솔버 전수 탐색)로 유일해가 증명되어야 배포 가능.
- 역할명 UI 표기는 항상 `한국어(영어)` 형식, 사전은 `src/data/roles.ts` 한 곳에서만.
- 솔버(`src/lib/solver/`)는 UI에 노출 금지 (스포일러).
- 공식 BotC 아트/아이콘 사용 금지 (비공식 팬 프로젝트).
