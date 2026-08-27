import { describe, expect, it } from "vitest";
import { checkRateLimit, recordFailure } from "@/lib/rate-limit";

// 모듈 상태(Map)가 테스트 간 공유되므로 테스트마다 다른 키를 쓴다.

describe("rate-limit", () => {
  it("실패 4회까지는 차단하지 않는다", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 4; i++) recordFailure("ip-a", t0 + i);
    expect(checkRateLimit("ip-a", t0 + 10).blocked).toBe(false);
  });

  it("15분 내 실패 5회면 차단한다", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) recordFailure("ip-b", t0 + i);
    const result = checkRateLimit("ip-b", t0 + 10);
    expect(result.blocked).toBe(true);
    expect(result.retryAfterSec).toBeGreaterThan(0);
    expect(result.retryAfterSec).toBeLessThanOrEqual(15 * 60);
  });

  it("윈도(15분)가 지나면 차단이 풀린다", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) recordFailure("ip-c", t0 + i);
    expect(checkRateLimit("ip-c", t0 + 15 * 60 * 1000 + 100).blocked).toBe(false);
  });

  it("키가 다르면 서로 영향을 주지 않는다", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) recordFailure("ip-d", t0 + i);
    expect(checkRateLimit("ip-e", t0 + 10).blocked).toBe(false);
  });
});
