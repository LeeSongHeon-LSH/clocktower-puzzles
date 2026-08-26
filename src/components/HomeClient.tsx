"use client";

// 홈 퍼즐 목록: 난이도 필터 + localStorage 해결 배지

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Difficulty, PuzzleEdition } from "@/lib/puzzles/schema";
import { EDITION_LABELS } from "@/data/roles";
import { loadProgress, type ProgressMap } from "@/lib/progress";

export interface PuzzleSummary {
  id: string;
  title: string;
  edition: PuzzleEdition;
  difficulty: Difficulty;
  playerCount: number;
  nights: number;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움",
};

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard"];

export function HomeClient({ puzzles }: { puzzles: PuzzleSummary[] }) {
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const shown = puzzles.filter((p) => filter === "all" || p.difficulty === filter);

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
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
