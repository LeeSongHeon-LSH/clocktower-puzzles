import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PUZZLES, getPuzzle } from "@/data/puzzles";
import { PuzzleClient } from "@/components/PuzzleClient";
import { unmodeledRoles } from "@/lib/solver/solve";

export function generateStaticParams() {
  return PUZZLES.map((p) => ({ id: p.id }));
}

export async function generateMetadata(
  props: PageProps<"/puzzle/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const puzzle = getPuzzle(id);
  return { title: puzzle?.title ?? "퍼즐" };
}

export default async function PuzzlePage(props: PageProps<"/puzzle/[id]">) {
  const { id } = await props.params;
  const puzzle = getPuzzle(id);
  if (!puzzle) notFound();
  // 검증 여부는 퍼즐 내용에서 파생된다. 판정은 서버에서 끝내고 결과만 내려보낸다 —
  // 솔버를 클라이언트로 보내지 않고(스포일러), 어떤 역할이 걸렸는지도 알리지 않는다
  // (solution에만 있고 주장에는 없는 역할이 이름으로 새어 나간다).
  return <PuzzleClient puzzle={puzzle} verified={unmodeledRoles(puzzle).length === 0} />;
}
