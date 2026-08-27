// 좌석 메모. 풀이자가 타운스퀘어 좌석에 직접 붙이는 표시와 짧은 글.
//
// 계정도 사용자 식별자도 없다 — 메모는 그 브라우저의 localStorage에만 있고
// 서버로 나가지 않는다. 저장 실패(사생활 모드 등)는 무시하고 세션 안에서만 산다.
// 저장 구조와 훅 형태는 progress.ts와 같다 (useSyncExternalStore).

import { useSyncExternalStore } from "react";

/** 좌석에 찍는 표시. 자유 메모보다 빠르게 누르는 용도. */
export type SeatMark = "trust" | "doubt" | "lie" | "evil";

export interface SeatNote {
  mark?: SeatMark;
  memo?: string;
}

/** 퍼즐 id → 좌석 번호 → 메모 */
export type NotesMap = Record<string, Record<number, SeatNote>>;

/**
 * 토큰 안에 그대로 들어가는 길이. 지름 54px 원 안에서 읽을 수 있는 크기로 넣을 수
 * 있는 한계가 4자다 — 잘라 보여주지 않고 입력에서 막는다.
 */
export const MAX_MEMO = 4;

const KEY = "clocktower-puzzles-notes-v1";

/** 서버 렌더와 "메모 없음"이 공유하는 고정 참조. */
const EMPTY: NotesMap = {};
const EMPTY_SEATS: Record<number, SeatNote> = {};

let cache: NotesMap | null = null;
const listeners = new Set<() => void>();

function read(): NotesMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NotesMap) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function write(next: NotesMap): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패는 무시 — 이번 세션에만 남는다.
  }
  cache = next;
  emit();
}

export function loadNotes(): NotesMap {
  if (typeof window === "undefined") return EMPTY;
  cache ??= read();
  return cache;
}

/** 좌석 하나의 메모를 갱신한다. 빈 메모는 항목째 지운다. */
export function saveNote(puzzleId: string, seat: number, note: SeatNote): void {
  if (typeof window === "undefined") return;
  const all = loadNotes();
  const seats = { ...(all[puzzleId] ?? {}) };
  const memo = note.memo?.trim();
  if (note.mark === undefined && !memo) delete seats[seat];
  else seats[seat] = { ...(note.mark ? { mark: note.mark } : {}), ...(memo ? { memo } : {}) };

  const next = { ...all };
  if (Object.keys(seats).length === 0) delete next[puzzleId];
  else next[puzzleId] = seats;
  write(next);
}

/** 이 퍼즐의 메모를 전부 지운다. */
export function clearNotes(puzzleId: string): void {
  if (typeof window === "undefined") return;
  const next = { ...loadNotes() };
  delete next[puzzleId];
  write(next);
}

/** 다른 탭에서 메모가 바뀌면 이 탭도 따라간다. */
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
 * 한 퍼즐의 좌석 메모를 읽는다. 서버 렌더·하이드레이션 시점에는 비어 있고,
 * 하이드레이션 직후 React가 실제 값으로 맞춰준다.
 */
export function useSeatNotes(puzzleId: string): Record<number, SeatNote> {
  const all = useSyncExternalStore(subscribe, loadNotes, () => EMPTY);
  return all[puzzleId] ?? EMPTY_SEATS;
}
