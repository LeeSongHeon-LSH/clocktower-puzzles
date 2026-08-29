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
import { analyze } from "@/lib/solver/solve";

/**
 * 링크에 실린 문제의 상태. **링크에 플래그를 싣지 않는다** — 여는 쪽이 문제 내용에서
 * 다시 판정하므로 만든 사람이 "검증됨"으로 위조할 수 없다.
 */
type Status =
  | { kind: "unique" }
  /** 솔버가 능력을 모르는 역할이 있어 전수 탐색을 하지 않았다 (해가 0개인 것과 다르다) */
  | { kind: "unverified" }
  | { kind: "multiple"; worlds: number }
  | { kind: "none" }
  | { kind: "malformed"; message: string };

type State =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "ready"; puzzle: Puzzle; status: Status };

/**
 * 사설 문제마다 고유한 진행도 키를 만든다.
 * 전부 같은 id를 쓰면 한 문제를 풀었을 때 다른 사설 문제도 풀린 것으로 처리되어
 * 해설이 미리 열린다(= 스포일러). 링크 내용에서 결정적으로 유도한다.
 */
function puzzleIdFor(fragment: string): string {
  let hash = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < fragment.length; i++) {
    hash ^= fragment.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `shared-${(hash >>> 0).toString(36)}`;
}

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
        const puzzle = toPuzzle(shared, puzzleIdFor(fragment));
        // 링크에 담긴 문제가 정말 유일해인지 여기서도 확인한다 (실측 15ms 미만).
        // 구조 검사는 언제나 돌고, 전수 탐색은 검증이 성립할 때만 돈다.
        let status: Status;
        try {
          const { unmodeled, worlds } = analyze(puzzle);
          status =
            unmodeled.length > 0
              ? { kind: "unverified" }
              : worlds.length === 1
                ? { kind: "unique" }
                : worlds.length === 0
                  ? { kind: "none" }
                  : { kind: "multiple", worlds: worlds.length };
        } catch (e) {
          status = { kind: "malformed", message: e instanceof Error ? e.message : "문제 형식이 잘못됐습니다." };
        }
        if (!cancelled) setState({ kind: "ready", puzzle, status });
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
          문제 업로드로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mt-4 space-y-2 rounded-lg border border-team-outsider/50 bg-panel p-4">
        <p className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-team-outsider/20 px-2.5 py-0.5 text-xs font-bold text-team-outsider">
            사설 문제
          </span>
          {state.puzzle.author && (
            <span className="text-xs text-faded">만든 사람: {state.puzzle.author}</span>
          )}
        </p>
        <p className="max-w-prose text-xs leading-relaxed text-faded">
          이 사이트에 수록된 문제가 아니라, <strong className="text-parchment">이용자가 직접 만들어
          링크로 공유한 문제</strong>입니다. 서버에 저장되지 않으며 내용은 만든 사람의 책임입니다.
        </p>
        {state.status.kind === "unique" && (
          <p className="text-xs text-brass">✓ 답이 하나뿐임을 이 브라우저에서 확인했습니다.</p>
        )}
        {state.status.kind === "multiple" && (
          <p className="text-xs text-blood">
            ⚠ 이 문제는 답이 {state.status.worlds}개입니다 — 논리만으로는 하나로 좁혀지지 않습니다.
          </p>
        )}
        {state.status.kind === "none" && (
          <p className="text-xs text-blood">⚠ 이 문제는 답이 없습니다 — 주장과 기록이 서로 모순됩니다.</p>
        )}
        {state.status.kind === "malformed" && (
          <p className="text-xs text-blood">⚠ 문제를 검사할 수 없습니다: {state.status.message}</p>
        )}
      </div>
      {/*
        key가 없으면 같은 탭에서 다른 링크로 이동할 때(프래그먼트만 바뀜)
        PuzzleClient가 재마운트되지 않아 앞 문제의 "포기함" 상태가 남고,
        새 문제의 해설이 미리 열린다(= 스포일러).
      */}
      <PuzzleClient
        key={state.puzzle.id}
        puzzle={state.puzzle}
        verified={state.status.kind !== "unverified"}
      />
    </div>
  );
}
