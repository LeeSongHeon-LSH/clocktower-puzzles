import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PUZZLES, getPuzzle } from "@/data/puzzles";
import { PuzzleClient } from "@/components/PuzzleClient";

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
  return <PuzzleClient puzzle={puzzle} />;
}
