// 수록 신청용 퍼즐 파일 생성기.
//
// 에디터에서 검증을 통과한 문제를 src/data/puzzles/에 그대로 넣을 수 있는 TypeScript
// 소스로 옮긴다. 손으로 옮겨 적는 단계를 없애는 것이 목적이다 — 거기가 GitHub을 모르는
// 사람에게 가장 높은 문턱이고, 좌석 번호 오타 하나가 CI 실패로 되돌아온다.

import { ROLES } from "@/data/roles";
import type { RoleId } from "@/lib/solver/types";
import type { SharedPuzzle } from "./codec";
import type { PuzzleEdition } from "./schema";

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
/** 한 줄에 담을지 펼칠지 가르는 폭 */
const WIDTH = 108;

/**
 * 대본이 한 판본으로만 이뤄졌으면 그 판본, 아니면 mixed.
 * puzzles.test.ts의 에디션 검사와 같은 규칙이라, 이대로 내면 그 검사를 통과한다.
 */
export function deriveEdition(rolePool: readonly RoleId[]): PuzzleEdition {
  const editions = [...new Set(rolePool.map((r) => ROLES[r].edition))];
  const only = editions[0];
  return editions.length === 1 && only !== "exp" ? only : "mixed";
}

/** 아직 쓰이지 않은 사설 문제 id (cm-01, cm-02, …) */
export function nextCommunityId(existingIds: readonly string[]): string {
  for (let n = 1; n <= 99; n++) {
    const id = `cm-${String(n).padStart(2, "0")}`;
    if (!existingIds.includes(id)) return id;
  }
  return "cm-99";
}

/** id → index.ts에서 쓸 변수명 (cm-01 → cm01) */
export function importName(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, "");
}

/** 짧은 값들을 폭에 맞게 채워 접는다 (각 줄이 쉼표까지 갖춘 채로 나온다) */
function fill(parts: string[], indent: string): string[] {
  const rows: string[] = [];
  let line = "";
  for (const part of parts) {
    const piece = `${part},`;
    if (line === "") line = indent + piece;
    else if (line.length + 1 + piece.length <= WIDTH) line += ` ${piece}`;
    else {
      rows.push(line);
      line = indent + piece;
    }
  }
  if (line !== "") rows.push(line);
  return rows;
}

/** 값 하나를 TypeScript 리터럴로. 짧으면 한 줄, 길면 펼친다 — 저장소의 기존 퍼즐 파일과 같은 모양. */
function lit(v: unknown, indent: string): string {
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const inner = `${indent}  `;
    const parts = v.map((x) => lit(x, inner));
    const oneLine = `[${parts.join(", ")}]`;
    if (!oneLine.includes("\n") && indent.length + oneLine.length <= WIDTH) return oneLine;
    // 역할 목록처럼 짧은 값이 늘어선 배열은 한 줄에 하나씩 두면 20줄이 된다 — 채워서 접는다.
    const rows = parts.every((p) => !p.includes("\n"))
      ? fill(parts, inner)
      : parts.map((p) => `${inner}${p},`);
    return `[\n${rows.join("\n")}\n${indent}]`;
  }
  if (v !== null && typeof v === "object") {
    const entries = Object.entries(v).filter(([, val]) => val !== undefined);
    if (entries.length === 0) return "{}";
    const inner = `${indent}  `;
    const parts = entries.map(([k, val]) => `${IDENT.test(k) ? k : JSON.stringify(k)}: ${lit(val, inner)}`);
    const oneLine = `{ ${parts.join(", ")} }`;
    if (!oneLine.includes("\n") && indent.length + oneLine.length <= WIDTH) return oneLine;
    return `{\n${parts.map((p) => inner + p).join(",\n")},\n${indent}}`;
  }
  return JSON.stringify(v);
}

/**
 * 수록 신청에 그대로 쓰는 퍼즐 파일 한 장.
 *
 * 힌트는 에디터에 입력란이 없어 빈 배열로 나간다 — 스키마상 선택이라 이대로도 통과하고,
 * 넣고 싶으면 PR에서 직접 채우면 된다.
 */
export function puzzleFileSource(p: SharedPuzzle, id: string): string {
  const fields: [string, unknown][] = [
    ["id", id],
    ["title", p.title],
    ["author", p.author],
    ["source", "community"],
    ["edition", deriveEdition(p.rolePool)],
    ["difficulty", p.difficulty],
    ["playerCount", p.playerCount],
    ["nights", p.nights],
    ["rolePool", p.rolePool],
    ["intro", p.intro],
    ["claims", p.claims],
    ["events", p.events],
    ["questions", p.questions],
    ["hints", p.hints ?? []],
    ["walkthrough", p.walkthrough ?? []],
    ["solution", p.solution],
    ["currentDemonSeat", p.currentDemonSeat],
  ];
  const body = fields
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}: ${lit(v, "  ")},`)
    .join("\n");

  const by = p.author ? `${p.author} 제작. ` : "";
  return [
    'import { definePuzzle } from "@/lib/puzzles/schema";',
    "",
    `// ${by}업로드 에디터에서 검증을 거쳐 나온 사설 문제.`,
    "export default definePuzzle({",
    body,
    "});",
    "",
  ].join("\n");
}

/** index.ts에 더해야 하는 두 줄 — 등록하지 않으면 파일만 있고 목록에는 안 뜬다. */
export function indexSnippet(id: string): { importLine: string; arrayItem: string } {
  const name = importName(id);
  return { importLine: `import ${name} from "./${id}";`, arrayItem: name };
}
