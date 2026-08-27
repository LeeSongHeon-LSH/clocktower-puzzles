// 보안 헤더가 조용히 사라지는 것을 막는 회귀 테스트.
//
// next.config.ts의 headers()는 Next가 응답을 서빙할 때만 적용된다.
// `output: "export"`로 바꾸면 경고 없이 무력화되므로 여기서 감시한다.
// (네트워크 없이 설정만 검사한다 — 실제 전달 여부는 배포 후 확인.)

import { describe, expect, it } from "vitest";
import nextConfig, { securityHeaders } from "../next.config";

/** 빠지면 안 되는 헤더와, 그 값에 반드시 들어가야 하는 조각. */
const REQUIRED: Record<string, string[]> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self'",
  ],
  "Strict-Transport-Security": ["max-age="],
  "X-Content-Type-Options": ["nosniff"],
  "X-Frame-Options": ["DENY"],
  "Referrer-Policy": [],
  "Permissions-Policy": ["camera=()", "microphone=()", "geolocation=()"],
};

describe("보안 헤더", () => {
  it("정적 내보내기(output: export)로 바뀌지 않았다 — 바뀌면 헤더가 무력화된다", () => {
    expect(
      nextConfig.output,
      "output: 'export'는 next.config.ts의 headers()를 무력화한다. " +
        "호스팅 쪽으로 헤더를 옮긴 뒤 이 테스트를 갱신할 것.",
    ).not.toBe("export");
  });

  it("headers()가 정의돼 있고 모든 경로에 적용된다", async () => {
    expect(typeof nextConfig.headers).toBe("function");
    const rules = await nextConfig.headers!();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.source === "/:path*")).toBe(true);
  });

  it("필수 헤더가 모두 있고 핵심 지시어가 빠지지 않았다", async () => {
    const rules = await nextConfig.headers!();
    const applied = new Map(rules.flatMap((r) => r.headers).map((h) => [h.key, h.value]));

    for (const [key, fragments] of Object.entries(REQUIRED)) {
      const value = applied.get(key);
      expect(value, `${key} 헤더가 없습니다`).toBeDefined();
      for (const fragment of fragments) {
        expect(value, `${key}에 "${fragment}"가 빠졌습니다`).toContain(fragment);
      }
    }
  });

  it("CSP가 외부 출처로의 통신·삽입을 막는다", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy")!.value;
    // 와일드카드 출처를 허용하면 방어가 무의미해진다
    expect(csp).not.toMatch(/(?:default|script|connect|frame)-src[^;]*\*/);
    expect(csp).not.toContain("unsafe-eval");
  });
});
