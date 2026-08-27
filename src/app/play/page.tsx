import type { Metadata } from "next";
import { SharedPuzzleLoader } from "@/components/SharedPuzzleLoader";

export const metadata: Metadata = {
  title: "사설 문제",
  description: "공유 링크로 받은 사설 시계탑 추리 문제를 풉니다.",
};

export default function PlaySharedPage() {
  return <SharedPuzzleLoader />;
}
