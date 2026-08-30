import type { Metadata } from "next";
import { Geist, Geist_Mono, Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import { BgmToggle } from "@/components/BgmToggle";
import "./globals.css";

// 한글 폰트는 preload 하지 않는다.
//
// 한글 웹폰트는 유니코드 구간별로 잘게 쪼개져 나온다. `preload: true`(기본값)면 Next가
// **모든 조각에 <link rel="preload">를 건다** — 실측 97개, 1.5MB가 페이지를 열 때마다
// 그 페이지에 그 글자가 쓰이는지와 무관하게 내려온다. Vercel은 정적 파일 요청도 전부
// CDN 요청으로 세므로(무료 한도 월 100만) 방문 1회가 110요청이 되고, 그중 88%가 폰트다.
//
// 끄면 브라우저가 @font-face의 unicode-range를 보고 실제로 필요한 조각만 받는다.
// 실측: 방문 1회 109자산 → 15자산. 대가는 첫 그리기에서 잠깐 대체 글꼴이 보일 수 있다는 것.
// tests/font-loading.test.ts가 이 설정이 조용히 되돌아가는 것을 감시한다.
const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-gowun-batang",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  preload: false,
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
              <Link href="/create" className="hover:text-parchment">
                업로드
              </Link>
              <Link href="/rules" className="hover:text-parchment">
                규칙
              </Link>
              <Link href="/about" className="hover:text-parchment">
                소개
              </Link>
              {/* 루트 레이아웃에 두어야 페이지를 옮겨도 재생이 끊기지 않는다 — BgmToggle.tsx 참고. */}
              <BgmToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-panel-edge py-6 text-center text-xs text-faded">
          <p>
            비공식 팬 프로젝트입니다. Blood on the Clocktower는 The Pandemonium
            Institute의 상표이며, 이 사이트는 공식과 무관합니다.
          </p>
          {/* Suno 무료 티어는 출력물 사용 조건으로 귀속 표기를 요구한다. 음악은 루트
              레이아웃에서 재생되므로 크레딧도 전 페이지에 함께 있어야 한다. 지우지 말 것. */}
          <p className="mt-1">
            배경음악 &lt;Dolce Follia&gt;는{" "}
            <a
              href="https://suno.com"
              className="underline underline-offset-2 hover:text-parchment"
              target="_blank"
              rel="noopener noreferrer"
            >
              Suno
            </a>
            로 만든 AI 생성 음원입니다.
          </p>
        </footer>
      </body>
    </html>
  );
}
