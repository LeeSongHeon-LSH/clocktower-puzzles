// localStorage 진행도. 서버 저장 없음 — 브라우저별 로컬 기록.
//
// localStorage는 React 바깥의 가변 저장소이므로 useSyncExternalStore로 읽는다.
// (effect에서 setState로 끌어오면 하이드레이션 직후 렌더가 한 번 더 도는
//  cascading render가 되고, react-hooks/set-state-in-effect 위반이다.)

import { useSyncExternalStore } from "react";

export type PuzzleStatus = "unsolved" | "solved" | "gaveup";

export interface PuzzleProgress {
  status: PuzzleStatus;
  hintsUsed: number;
  attempts: number;
}

export type ProgressMap = Record<string, PuzzleProgress>;

const KEY = "clocktower-puzzles-progress-v1";

/** 서버 렌더와 "기록 없음"이 공유하는 고정 참조. */
const EMPTY: ProgressMap = {};

/**
 * getSnapshot은 값이 안 바뀌면 반드시 같은 참조를 돌려줘야 한다
 * (매번 새 객체를 만들면 무한 렌더). 그래서 파싱 결과를 캐시하고
 * 실제 변경 시에만 무효화한다.
 */
let cache: ProgressMap | null = null;
const listeners = new Set<() => void>();

function read(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return EMPTY;
  cache ??= read();
  return cache;
}

export function saveProgress(puzzleId: string, progress: PuzzleProgress): void {
  if (typeof window === "undefined") return;
  const next = { ...loadProgress(), [puzzleId]: progress };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 사생활 모드 등에서 저장 실패는 무시 — 이번 세션에만 남고 새로고침하면 사라진다.
  }
  cache = next;
  emit();
}

/** 다른 탭에서 진행도가 바뀌면 이 탭도 따라간다. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) {
      cache = null;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * 진행도를 읽는다. 서버 렌더와 하이드레이션 시점에는 빈 기록이고,
 * 하이드레이션 직후 React가 실제 값으로 한 번 맞춰준다.
 */
export function useProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, loadProgress, () => EMPTY);
}
