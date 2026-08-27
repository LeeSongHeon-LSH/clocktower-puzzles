"use client";

// 공유 링크(/play#...)로 들어온 사설 문제를 열어 준다.
//
// 프래그먼트는 서버로 전송되지 않으므로 이 페이지는 정적으로 배포되고,
// 해독·검증은 전부 브라우저에서 일어난다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { PuzzleClient } from "@/components/PuzzleClient";
import { decodePuzzle, toPuzzle } from "@/lib/puzzles/codec";
import type { Puzzle } from "@/lib/puzzles/schema";
import { solve } from "@/lib/solver/solve";

type State =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "ready"; puzzle: Puzzle; unique: boolean; worlds: number };

export function SharedPuzzleLoader() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const fragment = window.location.hash.replace(/^#/, "");
      if (!fragment) {
        if (!cancelled) setState({ kind: "empty" });
        return;
      }
      try {
        const shared = await decodePuzzle(fragment);
        const puzzle = toPuzzle(shared, "shared");
        // 링크에 담긴 문제가 정말 유일해인지 여기서도 확인한다 (실측 15ms 미만).
        let worlds = 0;
        try {
          worlds = solve(puzzle).length;
        } catch {
          worlds = 0;
        }
        if (!cancelled) setState({ kind: "ready", puzzle, unique: worlds === 1, worlds });
      } catch (e) {
        if (!cancelled) {
          setState({ kind: "error", message: e instanceof Error ? e.message : "링크를 열 수 없습니다." });
        }
      }
    }

    void load();
    window.addEventListener("hashchange", load);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", load);
    };
  }, []);

  if (state.kind === "loading") {
    return <p className="pt-8 text-center text-sm text-faded">문제를 여는 중…</p>;
  }

  if (state.kind === "empty") {
    return (
      <div className="space-y-4 pt-4 text-sm">
        <h1 className="font-display text-3xl font-bold">사설 문제</h1>
        <p className="max-w-prose leading-relaxed text-faded">
          이 페이지는 공유 링크로 받은 사설 문제를 여는 곳입니다. 주소에 문제 데이터가 없습니다 — 받은
          링크를 통째로(끝의 <code className="font-mono text-brass">#</code> 뒤까지) 붙여넣었는지 확인해
          주세요.
        </p>
        <p className="flex flex-wrap gap-3">
          <Link href="/create" className="rounded-md bg-blood px-4 py-2 font-bold text-parchment hover:bg-blood-deep">
            직접 만들어 보기
          </Link>
          <Link href="/guide" className="rounded-md border border-panel-edge px-4 py-2 text-faded hover:text-parchment">
            업로드 가이드
          </Link>
        </p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-4 pt-4 text-sm">
        <h1 className="font-display text-3xl font-bold">링크를 열 수 없습니다</h1>
        <p className="max-w-prose rounded border border-blood/60 bg-panel p-3 text-blood">{state.message}</p>
        <p className="max-w-prose text-faded">
          메신저가 긴 주소를 자르는 경우가 있습니다. 링크 전체가 전달됐는지 확인해 주세요.
        </p>
        <Link href="/create" className="inline-block rounded-md border border-panel-edge px-4 py-2 text-faded hover:text-parchment">
          문제 만들기로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-panel-edge bg-panel px-3 py-2 text-xs">
        <span className="rounded-full border border-team-outsider/60 px-2 py-0.5 text-team-outsider">사설</span>
        {state.puzzle.author && <span className="text-faded">만든 사람: {state.puzzle.author}</span>}
        {state.unique ? (
          <span className="text-brass">✓ 답이 하나뿐임을 이 브라우저에서 확인했습니다</span>
        ) : (
          <span className="text-blood">
            ⚠ 이 문제는 답이 {state.worlds === 0 ? "없습니다" : `${state.worlds}개입니다`} — 풀리지 않을 수 있습니다
          </span>
        )}
      </div>
      <PuzzleClient puzzle={state.puzzle} />
    </div>
  );
}
