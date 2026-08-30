"use client";

// 배경음악 토글.
//
// 자동재생도, 이전 상태 복원도 하지 않는다. 새로 들어오거나 새로고침하면 항상 꺼진 채로
// 시작하고, 들을 사람만 버튼을 누른다. 이유는 두 가지다.
//
//   1) 브라우저는 사용자 제스처 없는 소리 재생을 막는다. 켜짐 상태를 기억해 두고 복원을
//      시도해 봐야 거부당하는 쪽이 흔해서, 버튼 표시와 실제 소리가 어긋나는 경우만 는다.
//   2) preload="none"과 짝을 이루면 음원 파일은 버튼을 누른 사람에게만 내려간다.
//      Vercel 무료 한도(전송량·CDN 요청)를 실제 청취자에게만 쓰게 된다.
//
// ⚠ 반드시 루트 레이아웃(app/layout.tsx)이 직접 렌더링해야 한다. 페이지나 하위 레이아웃
// 안에 두면 라우트를 옮길 때마다 언마운트되어 소리가 끊긴다. 루트 레이아웃은 소프트
// 내비게이션에서 유지되므로, 이 자리에 있을 때만 페이지를 옮겨도 음악이 이어진다.

import { useRef, useState } from "react";

// public/audio/ 에 넣는다. CSP에 media-src가 없어 default-src 'self'로 폴백되므로
// 반드시 같은 출처여야 한다 — 외부 CDN에서 끌어오면 조용히 차단된다.
//
// ⚠ 음원을 다른 버전으로 갈아끼울 땐 파일 이름도 함께 바꿀 것(dolce-follia-2.mp3 등).
// next.config.ts가 /audio/* 를 immutable로 영구 캐시하므로, 같은 이름 위에 덮어쓰면
// 기존 방문자에게는 옛 음원이 1년간 남는다.
const SRC = "/audio/dolce-follia.mp3";

export function BgmToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    // 재생이 거부되면(음원 없음·디코딩 실패) 버튼이 켜졌다고 거짓말하지 않게 되돌린다.
    audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="none" />
      <button
        type="button"
        aria-pressed={playing}
        onClick={toggle}
        className={`transition-colors hover:text-parchment ${playing ? "text-brass" : ""}`}
      >
        ♪ {playing ? "음악 끄기" : "음악 켜기"}
      </button>
    </>
  );
}
