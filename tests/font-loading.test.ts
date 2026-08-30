// 한글 폰트 preload가 조용히 되돌아오는 것을 막는 회귀 테스트.
//
// 한글 웹폰트는 유니코드 구간별로 쪼개져 나오고, next/font의 기본값(preload: true)은
// 그 조각 전부에 <link rel="preload">를 건다 — 실측 97개·1.5MB가 페이지를 열 때마다
// 무조건 내려온다. Vercel은 정적 파일 요청도 CDN 요청으로 세므로(Hobby 월 100만)
// 이게 되돌아가면 요청 예산이 7배로 빨리 소진된다. 화면은 멀쩡해 보이므로 눈으로는
// 절대 못 잡는다. (빌드 산출물 대신 설정을 검사한다 — 실제 태그 수는 배포 후 확인.)

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const LAYOUT = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

/** 조각이 많이 나오는 한글 폰트 — next/font/google 호출 이름 */
const KOREAN_FONTS = ["Gowun_Batang", "Noto_Sans_KR"];

describe("폰트 로딩", () => {
  it.each(KOREAN_FONTS)("%s는 preload 하지 않는다", (font) => {
    const call = LAYOUT.match(new RegExp(`${font}\\(\\{([^}]*)\\}\\)`));
    expect(call, `${font}( … ) 호출을 layout.tsx에서 찾지 못했다`).not.toBeNull();
    expect(
      call![1],
      `${font}에 preload: false가 없다. 한글 폰트를 preload 하면 조각 전부(실측 97개·1.5MB)를 ` +
        "매 방문마다 내려받아 Vercel 무료 한도의 CDN 요청 예산을 빠르게 태운다.",
    ).toContain("preload: false");
  });

  it("한글 폰트가 늘면 이 테스트도 함께 갱신해야 한다", () => {
    const used = [...LAYOUT.matchAll(/import \{([^}]*)\} from "next\/font\/google"/g)]
      .flatMap((m) => m[1].split(",").map((s) => s.trim()))
      .filter(Boolean);
    // 라틴 전용 폰트(Geist 계열)는 조각이 적어 preload 해도 무해하다 — 목록 밖이어도 된다.
    expect(used).toEqual(expect.arrayContaining(KOREAN_FONTS));
  });
});
