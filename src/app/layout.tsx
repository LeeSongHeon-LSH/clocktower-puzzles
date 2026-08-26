import type { Metadata } from "next";
import { Geist, Geist_Mono, Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun-batang",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "시계탑 퍼즐", template: "%s — 시계탑 퍼즐" },
  description:
    "Blood on the Clocktower 상황 추리 퍼즐 — 공개 주장과 밤의 기록으로 악마를 찾아라.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${gowunBatang.variable} ${notoSansKr.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-panel-edge">
          <nav className="mx-auto flex w-full max-w-3xl items-baseline justify-between px-4 py-4">
            <Link href="/" className="font-display text-xl font-bold tracking-wide">
              시계탑 <span className="text-blood">퍼즐</span>
            </Link>
            <div className="flex gap-5 text-sm text-faded">
              <Link href="/" className="hover:text-parchment">
                퍼즐
              </Link>
              <Link href="/about" className="hover:text-parchment">
                소개
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-panel-edge py-6 text-center text-xs text-faded">
          <p>
            비공식 팬 프로젝트입니다. Blood on the Clocktower는 The Pandemonium
            Institute의 상표이며, 이 사이트는 공식과 무관합니다.
          </p>
        </footer>
      </body>
    </html>
  );
}
