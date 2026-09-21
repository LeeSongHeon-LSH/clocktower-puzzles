// 좌석 메모 외부 스토어 — progress.ts의 쌍둥이. 같은 계약("값이 안 바뀌면 같은 참조", 깨진 저장값 방어)을 지킨다.

import { describe, expect, it, vi } from "vitest";

const KEY = "clocktower-puzzles-notes-v1";

function installWindow(initial?: string) {
  const store = new Map<string, string>();
  if (initial !== undefined) store.set(KEY, initial);
  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });
  return store;
}

async function freshModule() {
  vi.resetModules();
  return import("@/lib/notes");
}

describe("좌석 메모 스토어", () => {
  it("저장된 메모가 없으면 비어 있고, 같은 참조를 돌려준다", async () => {
    installWindow();
    const { loadNotes } = await freshModule();
    expect(loadNotes()).toEqual({});
    expect(loadNotes()).toBe(loadNotes());
  });

  it("표시와 추측을 저장하고, 둘 다 지우면 항목째 사라진다", async () => {
    const store = installWindow();
    const { loadNotes, saveNote } = await freshModule();
    saveNote("mx-05", 2, { mark: "doubt", guess: "imp" });
    expect(loadNotes()["mx-05"][2]).toEqual({ mark: "doubt", guess: "imp" });
    expect(JSON.parse(store.get(KEY)!)["mx-05"][2]).toEqual({ mark: "doubt", guess: "imp" });
    saveNote("mx-05", 2, {});
    expect(loadNotes()["mx-05"]).toBeUndefined();
  });

  it("한 문제의 메모만 지운다", async () => {
    installWindow(JSON.stringify({ "mx-05": { 0: { mark: "trust" } }, "tb-05": { 1: { mark: "lie" } } }));
    const { loadNotes, clearNotes } = await freshModule();
    clearNotes("mx-05");
    expect(Object.keys(loadNotes())).toEqual(["tb-05"]);
  });

  it("저장값이 깨졌거나 모양이 다르면 빈 메모로 본다", async () => {
    for (const raw of ["{ 깨진 JSON", "null", "[]", "7"]) {
      installWindow(raw);
      const { loadNotes } = await freshModule();
      expect(loadNotes(), raw).toEqual({});
    }
  });
});
