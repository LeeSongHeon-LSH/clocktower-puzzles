// 관리자 API 비밀번호 브루트포스 방지용 rate limiter.
// 메모리 기반: Vercel Fluid Compute는 함수 인스턴스를 재사용하므로 실질적으로 유지되지만,
// 인스턴스가 여러 개로 확장되면 한도는 인스턴스별로 적용된다(관리자 API 보호 용도로는 충분).

const WINDOW_MS = 15 * 60 * 1000; // 15분
const MAX_FAILURES = 5; // 윈도 내 허용 실패 횟수
const MAX_TRACKED_KEYS = 1000; // 메모리 상한 (초과 시 오래된 키부터 제거)

const failures = new Map<string, number[]>();

/** 윈도 내 실패가 한도에 달했으면 차단 상태와 남은 차단 시간(초)을 반환. */
export function checkRateLimit(
  key: string,
  now = Date.now(),
): { blocked: boolean; retryAfterSec: number } {
  const recent = prune(key, now);
  if (recent.length < MAX_FAILURES) return { blocked: false, retryAfterSec: 0 };
  const oldest = recent[0];
  return { blocked: true, retryAfterSec: Math.ceil((oldest + WINDOW_MS - now) / 1000) };
}

/** 비밀번호 검증 실패를 기록. */
export function recordFailure(key: string, now = Date.now()): void {
  const recent = prune(key, now);
  recent.push(now);
  failures.delete(key); // 재삽입으로 Map 순서를 최근 사용순으로 유지
  failures.set(key, recent);
  if (failures.size > MAX_TRACKED_KEYS) {
    const oldestKey = failures.keys().next().value;
    if (oldestKey !== undefined) failures.delete(oldestKey);
  }
}

function prune(key: string, now: number): number[] {
  const recent = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length === 0) failures.delete(key);
  return recent;
}
