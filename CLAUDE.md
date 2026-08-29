# CLAUDE.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 시계탑 퍼즐 프로젝트 가이드

Blood on the Clocktower 상황 추리 퍼즐 웹앱. 설계 합의 내용은 `docs/REQUIREMENTS.md`, 구조는 `docs/ARCHITECTURE.md`가 진실 원본이다 — 코드 작업 전에 두 문서를 읽을 것.

핵심 불변 규칙:
- 퍼즐은 `npm test`(솔버 전수 탐색)로 유일해가 증명되어야 배포 가능. 예외는 솔버가 능력을
  모르는 역할이 든 퍼즐 하나뿐이고, 그때도 **건너뛰는 건 유일해 탐색뿐**이다 — 구조 검사와
  해설 필수는 그대로다 (`REQUIREMENTS.md` §2.5.1). 검증 가능 여부는 퍼즐 내용에서 파생되는
  값이지 저자가 적는 필드가 아니다.
- 역할명 UI 표기는 항상 `한국어(영어)` 형식, 사전은 `src/data/roles.ts` 한 곳에서만.
- 솔버(`src/lib/solver/`)는 UI에 노출 금지 (스포일러).
- 공식 BotC 아트/아이콘 사용 금지 (비공식 팬 프로젝트).

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.