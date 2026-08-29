import type { Metadata } from "next";
import Link from "next/link";
import { PuzzleCreator } from "@/components/PuzzleCreator";

export const metadata: Metadata = {
  title: "문제 업로드",
  description: "직접 만든 시계탑 추리 문제를 브라우저에서 검증하고 링크로 공유하세요.",
};

export default function CreatePage() {
  return (
    <article className="space-y-6">
      <header className="space-y-3 pt-4">
        <h1 className="font-display text-3xl font-bold">문제 업로드</h1>
        <p className="max-w-prose text-sm leading-relaxed text-faded">
          만든 문제는 <strong className="text-parchment">브라우저에서 바로 검증</strong>됩니다. 답이 하나로
          좁혀지면 공유 링크가 나옵니다. 서버에 저장되는 것은 아무것도 없고, 문제 전체가 링크 안에
          들어갑니다. 링크 공유는 사적인 것이라 이 사이트 목록에 수록되는 것과는 별개입니다.{" "}
          <Link href="/guide" className="text-brass underline underline-offset-2 hover:text-parchment">
            처음이라면 업로드 가이드
          </Link>
          를 먼저 보세요.
        </p>
      </header>
      <PuzzleCreator />
    </article>
  );
}
