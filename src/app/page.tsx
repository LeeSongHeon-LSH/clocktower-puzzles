import Link from "next/link";
import { PUZZLES } from "@/data/puzzles";
import { HomeClient, type PuzzleSummary } from "@/components/HomeClient";
import { unmodeledRoles } from "@/lib/solver/solve";

export default function Home() {
  const summaries: PuzzleSummary[] = PUZZLES.map((p) => ({
    id: p.id,
    title: p.title,
    edition: p.edition,
    difficulty: p.difficulty,
    playerCount: p.playerCount,
    nights: p.nights,
    source: p.source ?? "official",
    author: p.author,
    // 검증 여부는 선언이 아니라 퍼즐 내용에서 나온다 — 저자가 켜고 끌 수 없다
    verified: unmodeledRoles(p).length === 0,
    realGame: p.realGame,
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
          밤의 사망 기록이 주어진다 — 그중 누군가는 거짓말을 하고 있다. 퍼즐은
          논리만으로 답이 하나로 확정되도록 기계 검증된다. 검증기가 아직 능력을 모르는
          역할이 든 문제만 예외이고, 그런 문제에는 「솔버 미검증」 표시가 붙는다.
        </p>
      </section>
      <HomeClient puzzles={summaries} />

      <section className="rounded-lg border border-panel-edge bg-panel p-4">
        <p className="font-display text-lg font-bold">직접 만들어 볼 수도 있다</p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-faded">
          브라우저가 그 자리에서 답이 하나뿐인지 검증해 주고 공유 링크를 만들어 줍니다.
          가입도 저장도 없습니다.
        </p>
        <p className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link
            href="/create"
            className="rounded-md bg-blood px-4 py-2 font-bold text-parchment transition-colors hover:bg-blood-deep"
          >
            문제 업로드
          </Link>
          <Link
            href="/guide"
            className="rounded-md border border-panel-edge px-4 py-2 text-faded transition-colors hover:text-parchment"
          >
            업로드 가이드
          </Link>
        </p>
      </section>
    </div>
  );
}
