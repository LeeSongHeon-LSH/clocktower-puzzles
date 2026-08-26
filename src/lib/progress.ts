// localStorage 진행도. 서버 저장 없음 — 브라우저별 로컬 기록.

export type PuzzleStatus = "unsolved" | "solved" | "gaveup";

export interface PuzzleProgress {
  status: PuzzleStatus;
  hintsUsed: number;
  attempts: number;
}

export type ProgressMap = Record<string, PuzzleProgress>;

const KEY = "clocktower-puzzles-progress-v1";

export function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(puzzleId: string, progress: PuzzleProgress): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadProgress();
    all[puzzleId] = progress;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // 사생활 모드 등에서 저장 실패는 무시 — 배지만 안 남을 뿐이다.
  }
}
