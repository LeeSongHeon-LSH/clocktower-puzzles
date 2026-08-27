// 퍼즐 파일 스키마. 문제 1개 = src/data/puzzles/의 TS 파일 1개.

import { ROLES } from "@/data/roles";
import type { RoleId, Seat, SolverPuzzle } from "@/lib/solver/types";

export type Difficulty = "easy" | "normal" | "hard";
export type PuzzleEdition = "tb" | "bmr" | "sv" | "mixed";

/**
 * 출처. 난이도와는 **직교하는 축**이다 — 사설 문제도 쉬울 수 있고 어려울 수 있으므로
 * 난이도 값에 "사설"을 섞지 않는다.
 *   official  — 이 리포에 수록된 문제 (npm test가 유일해를 증명)
 *   community — 사용자가 만든 문제 (에디터가 브라우저에서 유일해를 검증)
 */
export type PuzzleSource = "official" | "community";

export interface PuzzleQuestion {
  /**
   * 관례: "demon"(현재 데몬 좌석) 또는 역할 id("drunk", "poisoner" 등 — 그 역할의 좌석).
   * 테스트가 이 관례로 정답을 솔버 결과와 자동 교차검증한다.
   */
  id: "demon" | RoleId;
  text: string;
  answerSeats: Seat[];
}

export interface Puzzle extends SolverPuzzle {
  id: string;
  title: string;
  edition: PuzzleEdition;
  difficulty: Difficulty;
  /** 기본 official. 공유 링크로 들어온 사설 문제는 community. */
  source?: PuzzleSource;
  /** 사설 문제 작성자 별명 (선택) */
  author?: string;
  /** 상황 도입 서술 (선택) */
  intro?: string;
  questions: PuzzleQuestion[];
  /** 최대 2개, 클릭해서 여는 단계형 힌트 */
  hints: string[];
  /** 단계별 추론 해설 */
  walkthrough: string[];
  /** 정답 그리모어: 좌석 → 실제 역할 */
  solution: RoleId[];
  /** 데몬 승계(스타 패스 등)가 있었던 퍼즐은 현재 데몬 좌석 명시. 기본: solution의 임프 좌석 */
  currentDemonSeat?: Seat;
}

export function definePuzzle(p: Puzzle): Puzzle {
  if (p.hints.length > 2) throw new Error(`${p.id}: 힌트는 최대 2개`);
  if (p.walkthrough.length === 0) throw new Error(`${p.id}: 해설(walkthrough)이 비어 있음`);
  if (p.questions.length === 0) throw new Error(`${p.id}: 질문이 비어 있음`);
  if (p.solution.length !== p.playerCount) throw new Error(`${p.id}: solution 길이가 인원수와 다름`);
  if (p.solution.filter((r) => ROLES[r].team === "demon").length !== 1) throw new Error(`${p.id}: solution에 악마가 정확히 1명이어야 함`);
  return p;
}

/** 좌석 표기: 0 → A, 1 → B, … */
export function seatName(seat: Seat): string {
  return String.fromCharCode(65 + seat);
}
