import type { Metadata } from "next";
import Link from "next/link";
import { PuzzleCreator } from "@/components/PuzzleCreator";
import { PUZZLES } from "@/data/puzzles";

export const metadata: Metadata = {
  title: "문제 업로드",
  description: "직접 만든 시계탑 추리 문제를 브라우저에서 검증하고, 링크로 공유하거나 사이트 수록을 신청하세요.",
};

export default function CreatePage() {
  // 서버에서 id만 뽑아 넘긴다 — 퍼즐 전체를 클라이언트로 보내면 정답까지 딸려 간다.
  const existingIds = PUZZLES.map((p) => p.id);

  return (
    <article className="space-y-6">
      <header className="space-y-3 pt-4">
        <h1 className="font-display text-3xl font-bold">문제 업로드</h1>
        <p className="max-w-prose text-sm leading-relaxed text-faded">
          만든 문제는 <strong className="text-parchment">브라우저에서 바로 검증</strong>됩니다. 답이 하나로
          좁혀지면 공유 링크가 나옵니다. 서버에 저장되는 것은 아무것도 없고, 문제 전체가 링크 안에
          들어갑니다. 링크 공유는 사적인 것이라 이 사이트 목록에 수록되는 것과는 별개입니다 —{" "}
          <strong className="text-parchment">수록 신청 방법은 검증을 통과하면 이 화면 맨 아래에</strong>{" "}
          문제 파일과 함께 그대로 나옵니다.{" "}
          <Link href="/guide" className="text-brass underline underline-offset-2 hover:text-parchment">
            처음이라면 업로드 가이드
          </Link>
          를 먼저 보세요.
        </p>
      </header>

      <div className="max-w-prose rounded-lg border border-panel-edge bg-panel p-4 text-sm leading-relaxed">
        <p className="font-display font-bold text-brass">문제는 하나만 묻습니다 — 악마는 누구인가.</p>
        <p className="mt-1 text-faded">
          질문은 따로 쓰지 않습니다. 지금까지 있었던 일을 전부 기록해 마지막 순간까지 펼쳐 보이고,
          푸는 사람은 <strong className="text-parchment">지금 이 순간의 악마가 누구인지</strong> 하나만
          답합니다. 정답은 5번의 그리모어에서 자동으로 나오므로 답을 따로 적을 일도 없습니다.
        </p>
      </div>

      <PuzzleCreator existingIds={existingIds} />
    </article>
  );
}
