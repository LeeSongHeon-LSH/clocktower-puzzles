import type { NextConfig } from "next";

// 보안 헤더 — 방어 심화(defense-in-depth) 목적.
// 이 앱은 서버 라우트·쿠키·세션·외부 요청이 없는 완전 정적 사이트이고 React가
// 기본적으로 출력을 이스케이프하므로, 현재 알려진 취약점을 막는 게 아니라
// 향후 실수의 피해를 줄이는 안전망이다.
//
// CSP 주의: 정적 배포는 요청마다 nonce를 생성할 수 없어, Next가 삽입하는 인라인
// 부트스트랩 스크립트를 위해 script-src에 'unsafe-inline'이 불가피하다. React 인라인
// style 속성 때문에 style-src에도 'unsafe-inline'이 필요하다.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
