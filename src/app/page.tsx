import { PUZZLES } from "@/data/puzzles";
import { HomeClient, type PuzzleSummary } from "@/components/HomeClient";

export default function Home() {
  const summaries: PuzzleSummary[] = PUZZLES.map((p) => ({
    id: p.id,
    title: p.title,
    edition: p.edition,
    difficulty: p.difficulty,
    playerCount: p.playerCount,
    nights: p.nights,
  }));

  return (
    <div className="space-y-8">
      <section className="space-y-3 pt-4">
        <h1 className="font-display text-3xl font-bold leading-snug">
          마을에 악마가 숨어 있다.
          <br />
          <span className="text-blood">주장</span>과{" "}
          <span className="text-brass">기록</span>만으로 찾아내라.
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-faded">
          Blood on the Clocktower 상황 추리 퍼즐. 모든 플레이어의 공개 주장과
          밤의 사망 기록이 주어진다 — 그중 누군가는 거짓말을 하고 있다. 모든
          퍼즐은 논리만으로 답이 하나로 확정되도록 기계 검증되었다.
        </p>
      </section>
      <HomeClient puzzles={summaries} />
    </div>
  );
}
