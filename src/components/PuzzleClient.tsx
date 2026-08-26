"use client";

// 퍼즐 플레이 화면: 타운스퀘어 + 주장 열람 + 밤의 기록 + 단계형 질문 + 힌트/해설

import { useEffect, useMemo, useState } from "react";
import type { Puzzle } from "@/lib/puzzles/schema";
import { seatName } from "@/lib/puzzles/schema";
import { EDITION_LABELS, ROLES, roleLabel } from "@/data/roles";
import { renderInfo } from "@/lib/render";
import { loadProgress, saveProgress } from "@/lib/progress";
import { TownSquare, type TownSquareReveal } from "@/components/TownSquare";

const DIFFICULTY_LABELS = { easy: "쉬움", normal: "보통", hard: "어려움" } as const;

type Done = null | "solved" | "gaveup";

export function PuzzleClient({ puzzle }: { puzzle: Puzzle }) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [stage, setStage] = useState(0); // 처음 등장하는 미해결 질문 인덱스
  const [picks, setPicks] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(0);
  const [done, setDone] = useState<Done>(null);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);

  // 이미 푼 퍼즐은 재방문 시 해설이 바로 열린다
  useEffect(() => {
    const prev = loadProgress()[puzzle.id];
    if (prev?.status === "solved") setDone("solved");
    else if (prev?.status === "gaveup") setDone("gaveup");
  }, [puzzle.id]);

  const deadSeats = useMemo(
    () => new Set(puzzle.events.map((e) => e.seat)),
    [puzzle.events],
  );

  const claimBySeat = useMemo(() => {
    const m = new Map<number, Puzzle["claims"][number]>();
    for (const c of puzzle.claims) m.set(c.seat, c);
    return m;
  }, [puzzle.claims]);

  const demonSeat =
    puzzle.currentDemonSeat ?? puzzle.solution.findIndex((r) => r === "imp");

  const reveal: TownSquareReveal | null = done
    ? { teams: puzzle.solution.map((r) => ROLES[r].team), demonSeat }
    : null;

  const finish = (status: "solved" | "gaveup", finalAttempts: number) => {
    setDone(status);
    const prev = loadProgress()[puzzle.id];
    if (prev?.status === "solved") return; // 해결 기록은 격하하지 않는다
    saveProgress(puzzle.id, { status, hintsUsed: hintsOpen, attempts: finalAttempts });
  };

  const checkAnswer = () => {
    const q = puzzle.questions[stage];
    const a = [...picks].sort((x, y) => x - y).join(",");
    const b = [...q.answerSeats].sort((x, y) => x - y).join(",");
    const n = attempts + 1;
    setAttempts(n);
    if (a === b) {
      setWrong(false);
      setPicks([]);
      if (stage + 1 >= puzzle.questions.length) finish("solved", n);
      else setStage(stage + 1);
    } else {
      setWrong(true);
    }
  };

  const togglePick = (seat: number) => {
    setWrong(false);
    const max = puzzle.questions[stage].answerSeats.length;
    setPicks((prev) => {
      if (prev.includes(seat)) return prev.filter((s) => s !== seat);
      if (max === 1) return [seat];
      return prev.length < max ? [...prev, seat] : prev;
    });
  };

  // ── 타임라인: 밤1 → 낮1 → 밤2 → … → 현재 ───────────────────
  const timeline = useMemo(() => {
    const items: { label: string; text: string; kind: "night" | "day" | "now" }[] = [
      { label: "밤 1", text: "마을이 잠들고, 정보 역할들이 깨어났다.", kind: "night" },
    ];
    for (let d = 1; d < puzzle.nights; d++) {
      const exec = puzzle.events.find((e) => e.type === "execution" && e.day === d);
      items.push({
        label: `낮 ${d}`,
        text: exec ? `마을은 ${seatName(exec.seat)}를 처형했다.` : "처형이 없었다.",
        kind: "day",
      });
      const death = puzzle.events.find((e) => e.type === "death" && e.night === d + 1);
      items.push({
        label: `밤 ${d + 1}`,
        text: death ? `${seatName(death.seat)}가 죽은 채 발견됐다.` : "아무도 죽지 않았다.",
        kind: "night",
      });
    }
    items.push({
      label: `낮 ${puzzle.nights}`,
      text: "지금 — 당신의 추리 차례다.",
      kind: "now",
    });
    return items;
  }, [puzzle]);

  const selectedClaim = selectedSeat != null ? claimBySeat.get(selectedSeat) : undefined;

  return (
    <article className="space-y-8">
      {/* ── 머리말 ── */}
      <header className="space-y-3">
        <p className="flex flex-wrap gap-x-3 text-xs text-faded">
          <span
            className={
              puzzle.difficulty === "hard"
                ? "text-blood"
                : puzzle.difficulty === "normal"
                  ? "text-brass"
                  : "text-team-outsider"
            }
          >
            {DIFFICULTY_LABELS[puzzle.difficulty]}
          </span>
          <span>{EDITION_LABELS[puzzle.edition].ko}</span>
          <span>
            {puzzle.playerCount}인 · {puzzle.nights}일차
          </span>
        </p>
        <h1 className="font-display text-3xl font-bold">{puzzle.title}</h1>
        {puzzle.intro && (
          <p className="max-w-prose text-sm leading-relaxed text-faded">{puzzle.intro}</p>
        )}
      </header>

      {/* ── 타운스퀘어 ── */}
      <section className="space-y-3">
        <TownSquare
          playerCount={puzzle.playerCount}
          deadSeats={deadSeats}
          selected={selectedSeat}
          onSelect={(s) => setSelectedSeat((prev) => (prev === s ? null : s))}
          reveal={reveal}
          centerLabel={`${puzzle.nights}일차 낮`}
        />
        <div className="rounded-lg border border-panel-edge bg-panel p-4 text-sm">
          {selectedClaim ? (
            <div className="space-y-2">
              <p>
                <span className="font-display text-base font-bold">
                  {seatName(selectedClaim.seat)}
                </span>
                {deadSeats.has(selectedClaim.seat) && (
                  <span className="ml-2 text-xs text-faded">사망</span>
                )}
                <span className="ml-3 text-faded">주장:</span>{" "}
                <span className="text-brass">{roleLabel(selectedClaim.role)}</span>
              </p>
              {selectedClaim.info.length > 0 ? (
                <ul className="space-y-1 border-l border-panel-edge pl-3">
                  {selectedClaim.info.map((inf, i) => (
                    <li key={i}>
                      <span className="mr-2 text-xs text-faded">밤 {inf.night}</span>
                      {inf.text ?? (inf.data ? renderInfo(inf.data) : "")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-faded">받은 정보 주장이 없다.</p>
              )}
            </div>
          ) : (
            <p className="text-center text-faded">좌석을 눌러 그 사람의 주장을 확인하라.</p>
          )}
        </div>
        <details className="rounded-lg border border-panel-edge bg-panel">
          <summary className="cursor-pointer px-4 py-3 text-sm text-faded hover:text-parchment">
            모든 주장 한눈에 보기
          </summary>
          <ul className="space-y-3 px-4 pb-4 text-sm">
            {puzzle.claims.map((c) => (
              <li key={c.seat} className="border-l border-panel-edge pl-3">
                <p>
                  <span className="font-display font-bold">{seatName(c.seat)}</span>
                  <span className="ml-2 text-brass">{roleLabel(c.role)}</span>
                  {deadSeats.has(c.seat) && (
                    <span className="ml-2 text-xs text-faded">사망</span>
                  )}
                </p>
                <ul className="mt-1 space-y-0.5 text-parchment/90">
                  {c.info.map((inf, i) => (
                    <li key={i}>
                      <span className="mr-2 text-xs text-faded">밤 {inf.night}</span>
                      {inf.text ?? (inf.data ? renderInfo(inf.data) : "")}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* ── 밤의 기록 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">밤의 기록</h2>
        <ol className="space-y-1.5 text-sm">
          {timeline.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={`w-12 shrink-0 font-mono text-xs leading-5 ${
                  t.kind === "night"
                    ? "text-team-townsfolk"
                    : t.kind === "now"
                      ? "text-blood"
                      : "text-brass"
                }`}
              >
                {t.label}
              </span>
              <span className={t.kind === "now" ? "text-parchment" : "text-faded"}>
                {t.text}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 질문 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">질문</h2>
        {puzzle.questions.map((q, qi) => {
          const answered = done != null || qi < stage;
          const active = done == null && qi === stage;
          if (!answered && !active) {
            return (
              <div
                key={q.id}
                className="rounded-lg border border-panel-edge/60 p-4 text-sm text-faded"
              >
                {qi + 1}. 앞의 질문을 먼저 풀어라.
              </div>
            );
          }
          return (
            <div
              key={q.id}
              className={`rounded-lg border p-4 ${
                active ? "border-brass/60 bg-panel" : "border-panel-edge bg-panel/50"
              }`}
            >
              <p className="text-sm">
                <span className="mr-2 text-faded">{qi + 1}.</span>
                {q.text}
              </p>
              {answered ? (
                <p className="mt-2 text-sm text-brass">
                  {done === "gaveup" && qi >= stage ? "정답: " : "✓ "}
                  {q.answerSeats.map(seatName).join(", ")}
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: puzzle.playerCount }, (_, s) => (
                      <button
                        key={s}
                        onClick={() => togglePick(s)}
                        className={`h-10 w-10 rounded-full border font-display text-base font-bold transition-colors ${
                          picks.includes(s)
                            ? "border-blood bg-blood/20 text-parchment"
                            : "border-panel-edge text-faded hover:border-parchment/50 hover:text-parchment"
                        }`}
                        aria-pressed={picks.includes(s)}
                      >
                        {seatName(s)}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={checkAnswer}
                      disabled={picks.length !== q.answerSeats.length}
                      className="rounded-md bg-blood px-4 py-2 text-sm font-bold text-parchment transition-colors hover:bg-blood-deep disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      확인
                    </button>
                    {q.answerSeats.length > 1 && (
                      <span className="text-xs text-faded">{q.answerSeats.length}명을 골라라</span>
                    )}
                    {wrong && (
                      <span className="text-sm text-blood">
                        아니다 — 다시 생각해보라. (시도 {attempts}회)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── 힌트 / 포기 ── */}
      {done == null && (
        <section className="space-y-3">
          {puzzle.hints.slice(0, hintsOpen).map((h, i) => (
            <div
              key={i}
              className="rounded-lg border border-brass/40 bg-panel p-4 text-sm leading-relaxed"
            >
              <span className="mr-2 text-xs text-brass">힌트 {i + 1}</span>
              {h}
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            {hintsOpen < puzzle.hints.length && (
              <button
                onClick={() => setHintsOpen(hintsOpen + 1)}
                className="rounded-md border border-brass/60 px-4 py-2 text-sm text-brass transition-colors hover:bg-brass/10"
              >
                힌트 {hintsOpen + 1} 보기 ({puzzle.hints.length - hintsOpen}개 남음)
              </button>
            )}
            {confirmGiveUp ? (
              <span className="flex items-center gap-2 text-sm">
                <span className="text-faded">해설을 열면 되돌릴 수 없다.</span>
                <button
                  onClick={() => finish("gaveup", attempts)}
                  className="rounded-md bg-blood px-3 py-2 font-bold text-parchment hover:bg-blood-deep"
                >
                  포기하고 해설 보기
                </button>
                <button
                  onClick={() => setConfirmGiveUp(false)}
                  className="rounded-md border border-panel-edge px-3 py-2 text-faded hover:text-parchment"
                >
                  계속 풀기
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmGiveUp(true)}
                className="rounded-md border border-panel-edge px-4 py-2 text-sm text-faded transition-colors hover:text-parchment"
              >
                포기하기
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── 해설 ── */}
      {done != null && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold">
            {done === "solved" ? "해결 — 그리모어 공개" : "그리모어 공개"}
          </h2>
          <ul className="space-y-1.5 rounded-lg border border-panel-edge bg-panel p-4 text-sm">
            {puzzle.solution.map((r, s) => {
              const claim = claimBySeat.get(s);
              return (
                <li key={s} className="flex items-baseline gap-3">
                  <span className="font-display w-5 font-bold">{seatName(s)}</span>
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 self-center rounded-full"
                    style={{ background: `var(--team-${ROLES[r].team})` }}
                    aria-hidden
                  />
                  <span>
                    {roleLabel(r)}
                    {r === "drunk" && claim && (
                      <span className="text-faded"> — 스스로는 {roleLabel(claim.role)}라 믿었다</span>
                    )}
                    {s === demonSeat && (
                      <span className="ml-2 text-xs text-blood">현재 악마</span>
                    )}
                    {deadSeats.has(s) && <span className="ml-2 text-xs text-faded">사망</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          <h3 className="font-display text-lg font-bold">추리의 길</h3>
          <ol className="space-y-3 text-sm leading-relaxed">
            {puzzle.walkthrough.map((w, i) => (
              <li key={i} className="rounded-lg border border-panel-edge bg-panel/50 p-4">
                {w}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
