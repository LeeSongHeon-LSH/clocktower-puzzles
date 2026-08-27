// 진행도 외부 스토어 (useSyncExternalStore가 읽는 쪽) 단위 테스트.
//
// 특히 "값이 안 바뀌면 같은 참조" 규칙이 중요하다 — 여기가 깨지면
// useSyncExternalStore가 무한 렌더에 빠진다.

import { afterEach, describe, expect, it, vi } from "vitest";
import type { PuzzleProgress } from "@/lib/progress";

const KEY = "clocktower-puzzles-progress-v1";

const SOLVED: PuzzleProgress = { status: "solved", hintsUsed: 0, attempts: 1 };

interface FakeWindow {
  store: Map<string, string>;
  fireStorage: (key: string | null) => void;
  failWrites: () => void;
}

/** localStorage와 storage 이벤트를 흉내내는 최소 window를 심는다. */
function installWindow(initial?: string): FakeWindow {
  const store = new Map<string, string>();
  if (initial !== undefined) store.set(KEY, initial);
  const handlers = new Set<(e: { key: string | null }) => void>();
  let writable = true;

  const win = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (!writable) throw new Error("QuotaExceededError");
        store.set(k, v);
      },
    },
    addEventListener: (type: string, fn: (e: { key: string | null }) => void) => {
      if (type === "storage") handlers.add(fn);
    },
    removeEventListener: (type: string, fn: (e: { key: string | null }) => void) => {
      if (type === "storage") handlers.delete(fn);
    },
  };
  Object.assign(globalThis, { window: win });

  return {
    store,
    fireStorage: (key) => handlers.forEach((fn) => fn({ key })),
    failWrites: () => {
      writable = false;
    },
  };
}

/** 모듈 수준 캐시가 테스트마다 섞이지 않도록 새로 가져온다. */
async function freshModule() {
  vi.resetModules();
  return import("@/lib/progress");
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("진행도 스토어", () => {
  it("서버(window 없음)에서는 빈 기록이다", async () => {
    const { loadProgress } = await freshModule();
    expect(loadProgress()).toEqual({});
  });

  it("저장된 기록이 없으면 빈 기록이다", async () => {
    installWindow();
    const { loadProgress } = await freshModule();
    expect(loadProgress()).toEqual({});
  });

  it("저장된 기록을 읽어온다", async () => {
    installWindow(JSON.stringify({ "tb-01": SOLVED }));
    const { loadProgress } = await freshModule();
    expect(loadProgress()["tb-01"]).toEqual(SOLVED);
  });

  it("값이 바뀌지 않으면 같은 참조를 돌려준다", async () => {
    installWindow(JSON.stringify({ "tb-01": SOLVED }));
    const { loadProgress } = await freshModule();
    expect(loadProgress()).toBe(loadProgress());
  });

  it("저장하면 값이 반영되고 참조가 바뀐다", async () => {
    installWindow();
    const { loadProgress, saveProgress } = await freshModule();
    const before = loadProgress();
    saveProgress("tb-01", SOLVED);
    const after = loadProgress();
    expect(after).not.toBe(before);
    expect(after["tb-01"]).toEqual(SOLVED);
  });

  it("저장한 내용이 localStorage에 실제로 쓰인다", async () => {
    const fake = installWindow();
    const { saveProgress } = await freshModule();
    saveProgress("tb-01", SOLVED);
    expect(JSON.parse(fake.store.get(KEY)!)).toEqual({ "tb-01": SOLVED });
  });

  it("기존 기록을 덮어쓰지 않고 병합한다", async () => {
    installWindow(JSON.stringify({ "tb-01": SOLVED }));
    const { loadProgress, saveProgress } = await freshModule();
    saveProgress("tb-02", { status: "gaveup", hintsUsed: 2, attempts: 5 });
    expect(Object.keys(loadProgress()).sort()).toEqual(["tb-01", "tb-02"]);
  });

  it("저장된 JSON이 깨져 있어도 던지지 않고 빈 기록으로 본다", async () => {
    installWindow("{ 이건 JSON이 아니다");
    const { loadProgress } = await freshModule();
    expect(loadProgress()).toEqual({});
  });

  it("쓰기가 실패해도(사생활 모드) 예외가 새지 않고 세션 내 값은 유지된다", async () => {
    const fake = installWindow();
    const { loadProgress, saveProgress } = await freshModule();
    fake.failWrites();
    expect(() => saveProgress("tb-01", SOLVED)).not.toThrow();
    expect(loadProgress()["tb-01"]).toEqual(SOLVED);
  });

  it("저장하면 구독자에게 알린다", async () => {
    installWindow();
    const { saveProgress, subscribe } = await freshModule();
    const listener = vi.fn();
    subscribe(listener);
    saveProgress("tb-01", SOLVED);
    expect(listener).toHaveBeenCalled();
  });

  it("다른 탭의 변경(storage 이벤트)이 캐시를 무효화하고 알린다", async () => {
    const fake = installWindow();
    const { loadProgress, subscribe } = await freshModule();
    const listener = vi.fn();
    subscribe(listener);

    expect(loadProgress()).toEqual({});
    fake.store.set(KEY, JSON.stringify({ "tb-03": SOLVED })); // 다른 탭이 씀
    fake.fireStorage(KEY);

    expect(listener).toHaveBeenCalled();
    expect(loadProgress()["tb-03"]).toEqual(SOLVED);
  });

  it("관계없는 키의 storage 이벤트는 무시한다", async () => {
    const fake = installWindow();
    const { subscribe } = await freshModule();
    const listener = vi.fn();
    subscribe(listener);
    fake.fireStorage("다른-앱-키");
    expect(listener).not.toHaveBeenCalled();
  });

  it("구독을 해제하면 더 이상 알리지 않는다", async () => {
    const fake = installWindow();
    const { subscribe } = await freshModule();
    const listener = vi.fn();
    subscribe(listener)();
    fake.fireStorage(KEY);
    expect(listener).not.toHaveBeenCalled();
  });
});
