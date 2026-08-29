"use client";

// 홈 퍼즐 목록: 난이도 필터 + localStorage 해결 배지

import { useState } from "react";
import Link from "next/link";
import type { Difficulty, PuzzleEdition, PuzzleSource } from "@/lib/puzzles/schema";
import { EDITION_LABELS } from "@/data/roles";
import { useProgress } from "@/lib/progress";

export interface PuzzleSummary {
  id: string;
  title: string;
  edition: PuzzleEdition;
  difficulty: Difficulty;
  playerCount: number;
  nights: number;
  /** 난이도와 직교하는 축 — 두 필터가 각각 동작한다 */
  source: PuzzleSource;
  author?: string;
  /** 솔버 전수 탐색으로 유일해가 증명됐는가 (퍼즐 내용에서 파생, 서버에서 계산) */
  verified: boolean;
  /** 실제로 진행된 판을 옮긴 문제인가 */
  realGame?: boolean;
}

const SOURCE_LABELS: Record<PuzzleSource, string> = {
  official: "수록",
  community: "사설",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움",
};

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard"];

export function HomeClient({ puzzles }: { puzzles: PuzzleSummary[] }) {
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const [source, setSource] = useState<PuzzleSource | "all">("all");
  const progress = useProgress();

  const shown = puzzles.filter(
    (p) => (filter === "all" || p.difficulty === filter) && (source === "all" || p.source === source),
  );
  // 사설 문제가 하나도 없으면 출처 필터를 띄우지 않는다
  const hasCommunity = puzzles.some((p) => p.source === "community");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="난이도 필터">
        {(["all", ...DIFFICULTY_ORDER] as const).map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              filter === d
                ? "border-blood bg-blood/15 text-parchment"
                : "border-panel-edge text-faded hover:text-parchment"
            }`}
          >
            {d === "all" ? "전체" : DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      {hasCommunity && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="출처 필터">
          {(["all", "official", "community"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                source === s
                  ? "border-brass bg-brass/15 text-parchment"
                  : "border-panel-edge text-faded hover:text-parchment"
              }`}
            >
              {s === "all" ? "출처 전체" : SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((p) => {
          const status = progress[p.id]?.status;
          return (
            <li key={p.id}>
              <Link
                href={`/puzzle/${p.id}`}
                className="block rounded-lg border border-panel-edge bg-panel p-4 transition-colors hover:border-brass/60"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{p.title}</h2>
                  {status === "solved" && (
                    <span className="shrink-0 rounded-full border border-brass/60 px-2 py-0.5 text-xs text-brass">
                      해결 ✓
                    </span>
                  )}
                  {status === "gaveup" && (
                    <span className="shrink-0 rounded-full border border-panel-edge px-2 py-0.5 text-xs text-faded">
                      해설 열람
                    </span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-faded">
                  <span
                    className={
                      p.difficulty === "hard"
                        ? "text-blood"
                        : p.difficulty === "normal"
                          ? "text-brass"
                          : "text-team-outsider"
                    }
                  >
                    {DIFFICULTY_LABELS[p.difficulty]}
                  </span>
                  <span>{EDITION_LABELS[p.edition].ko}</span>
                  <span>
                    {p.playerCount}인 · {p.nights}일차
                  </span>
                  {p.source === "community" && (
                    <span className="text-team-outsider">
                      사설{p.author ? ` · ${p.author}` : ""}
                    </span>
                  )}
                  {p.realGame && <span className="text-brass">실제 판</span>}
                  {!p.verified && <span className="text-brass">솔버 미검증</span>}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
