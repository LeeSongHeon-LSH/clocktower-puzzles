// 역할 한국어 표기 편집 API.
// POST: ADMIN_PASSWORD 검증 후 GitHub Contents API로 src/data/roles.ts를 커밋한다.
// 커밋되면 Vercel이 자동 재배포하여 약 1분 내 반영된다.

import { createHash, timingSafeEqual } from "node:crypto";
import { ROLES } from "@/data/roles";
import { checkRateLimit, recordFailure } from "@/lib/rate-limit";
import { ROLE_IDS, type RoleId } from "@/lib/solver/types";

const ROLES_PATH = "src/data/roles.ts";

function passwordOk(given: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof given !== "string") return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET() {
  // 현재 배포본의 사전 (커밋 직후에는 재배포 전까지 이전 값이 보인다)
  return Response.json({ roles: ROLES });
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "관리자 기능이 설정되지 않았습니다 (ADMIN_PASSWORD 없음)." }, { status: 503 });
  }
  // Vercel이 신뢰할 수 있는 클라이언트 IP를 x-forwarded-for 맨 앞에 넣어준다.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(ip);
  if (limit.blocked) {
    return Response.json(
      { error: `시도가 너무 많습니다. ${Math.ceil(limit.retryAfterSec / 60)}분 후 다시 시도하세요.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: { password?: unknown; changes?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  if (!passwordOk(body.password)) {
    recordFailure(ip);
    return Response.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // 예: "LeeSongHeon-LSH/clocktower-puzzles"
  if (!token || !repo) {
    return Response.json({ error: "GitHub 연동이 설정되지 않았습니다 (GITHUB_TOKEN/GITHUB_REPO 없음)." }, { status: 503 });
  }

  // 변경 검증: 알려진 역할 id + 안전한 문자열만
  const changes: [RoleId, string][] = [];
  if (typeof body.changes !== "object" || body.changes === null) {
    return Response.json({ error: "changes가 없습니다." }, { status: 400 });
  }
  for (const [id, ko] of Object.entries(body.changes)) {
    if (!(ROLE_IDS as readonly string[]).includes(id)) {
      return Response.json({ error: `알 수 없는 역할: ${id}` }, { status: 400 });
    }
    if (typeof ko !== "string" || ko.length === 0 || ko.length > 30 || /["\\\n\r]/.test(ko)) {
      return Response.json({ error: `잘못된 표기: ${id}` }, { status: 400 });
    }
    if (ko !== ROLES[id as RoleId].ko) changes.push([id as RoleId, ko]);
  }
  if (changes.length === 0) {
    return Response.json({ error: "바뀐 내용이 없습니다." }, { status: 400 });
  }

  const gh = (path: string, init?: RequestInit) =>
    fetch(`https://api.github.com/repos/${repo}/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...init?.headers,
      },
    });

  // 1) 현재 파일 내용 + sha 조회
  const getRes = await gh(`contents/${ROLES_PATH}`);
  if (!getRes.ok) {
    return Response.json({ error: `GitHub 조회 실패 (${getRes.status})` }, { status: 502 });
  }
  const file = (await getRes.json()) as { sha: string; content: string };
  let source = Buffer.from(file.content, "base64").toString("utf8");

  // 2) ko 값 치환 (역할별 한 줄 패턴)
  for (const [id, ko] of changes) {
    const re = new RegExp(`(\\b${id}:\\s*\\{[^}]*?ko: ")[^"]*(")`);
    if (!re.test(source)) {
      return Response.json({ error: `roles.ts에서 ${id} 항목을 찾지 못했습니다.` }, { status: 500 });
    }
    source = source.replace(re, `$1${ko}$2`);
  }

  // 3) 커밋
  const summary = changes.map(([id, ko]) => `${id}→${ko}`).join(", ");
  const putRes = await gh(`contents/${ROLES_PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `chore(admin): 역할 표기 수정 (${summary})`,
      content: Buffer.from(source, "utf8").toString("base64"),
      sha: file.sha,
    }),
  });
  if (!putRes.ok) {
    return Response.json({ error: `GitHub 커밋 실패 (${putRes.status})` }, { status: 502 });
  }

  return Response.json({
    ok: true,
    changed: changes.length,
    message: "커밋 완료 — 재배포 후 약 1분 내에 반영됩니다.",
  });
}
