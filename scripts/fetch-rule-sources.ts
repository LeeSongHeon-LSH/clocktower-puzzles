// 규칙 페이지 출처 동기화 도구. 공식 소스 두 곳을 대조한다.
//
// 1) 공식 알마낙 위키(wiki.bloodontheclocktower.com, MediaWiki API)
//    → 규칙 서술의 근거 원문. 앵커 문구가 여전히 존재하는지 확인하고 문장을 인용문으로 추출해
//      src/data/rule-sources.generated.ts 를 쓴다.
//    → 앵커가 사라졌다면 = 공식 규칙 문구가 개정됐다는 뜻이므로 실패로 끝낸다.
//
// 2) 공식 한국어 번역(github.com/ThePandemoniumInstitute/botc-translations, game/ko.json)
//    → 역할별 공식 능력 문구를 받아 src/data/role-rules.generated.ts 를 쓰고,
//      src/data/roles.ts의 한국어 표기가 공식과 일치하는지 대조한다(불일치는 경고).
//
//   npm run rules:sync         대조 + 생성 파일 갱신
//   npm run rules:check        대조만 (파일 미변경, 배포 전 점검용)

import { writeFileSync } from "node:fs";
import { ROLES } from "../src/data/roles";
import { ROLE_IDS, type RoleId } from "../src/lib/solver/types";

const API = "https://wiki.bloodontheclocktower.com/api.php";
const WIKI = "https://wiki.bloodontheclocktower.com";
const OUT = new URL("../src/data/rule-sources.generated.ts", import.meta.url);

const TRANSLATIONS_REPO = "ThePandemoniumInstitute/botc-translations";
const KO_PATH = "game/ko.json";
const KO_URL = `https://raw.githubusercontent.com/${TRANSLATIONS_REPO}/main/${KO_PATH}`;
const ROLE_OUT = new URL("../src/data/role-rules.generated.ts", import.meta.url);

/** 인용하려는 공식 문장. anchor는 그 문장을 특정하는 고유 부분 문자열. */
interface Anchor {
  key: string;
  page: string;
  /** 위키 페이지 내 섹션 앵커 (URL의 #뒤). 없으면 페이지 최상단. */
  section?: string;
  anchor: string;
  /** anchor가 걸린 문장부터 몇 문장을 인용할지 (기본 1). 맥락이 필요할 때 늘린다. */
  sentences?: number;
}

const ANCHORS: Anchor[] = [
  {
    key: "same-thing",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "Being drunk and being poisoned do the same thing",
  },
  {
    key: "no-ability",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "A drunk or poisoned player has no ability",
  },
  {
    key: "alive-or-dead",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "Alive and dead players alike can be drunk or poisoned",
  },
  {
    key: "once-per-game",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "once per game” ability while drunk or poisoned",
  },
  {
    key: "regain",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "they regain their ability",
  },
  {
    key: "dont-tell",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "Do not tell them they are drunk or poisoned",
  },
  {
    key: "false-info",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "you can give them incorrect information",
  },
  {
    key: "wasted",
    page: "States",
    section: "Drunkenness_and_Poisoning",
    anchor: "the ability is wasted",
  },
  {
    key: "drunk-setup",
    page: "Drunk",
    anchor: "the Drunk's token does not go in the bag",
  },
  {
    key: "drunk-outsider",
    page: "Drunk",
    anchor: "They are now an Outsider",
  },
  {
    key: "poison-duration",
    page: "Poisoner",
    anchor: "poison for that night and the entire next day",
  },
  {
    key: "poison-dusk",
    page: "Poisoner",
    anchor: "Each dusk, the poisoned player becomes healthy",
  },
  {
    key: "poison-source-gone",
    page: "Poisoner",
    anchor: "poisons the Mayor, then becomes the",
    sentences: 2,
  },
];

interface Revision {
  wikitext: string;
  revid: number;
  timestamp: string;
}

async function fetchPages(titles: string[]): Promise<Map<string, Revision>> {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "revisions");
  url.searchParams.set("rvprop", "ids|timestamp|content");
  url.searchParams.set("rvslots", "main");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await fetch(url, {
    // HTTP 헤더는 ASCII만 허용되므로 영문으로 둔다.
    headers: { "User-Agent": "clocktower-puzzles/rule-sync (unofficial fan project; citation check)" },
  });
  if (!res.ok) throw new Error(`위키 API 응답 ${res.status}`);
  const json = (await res.json()) as {
    query: {
      pages: {
        title: string;
        missing?: boolean;
        revisions?: { revid: number; timestamp: string; slots: { main: { content: string } } }[];
      }[];
    };
  };

  const out = new Map<string, Revision>();
  for (const page of json.query.pages) {
    const rev = page.revisions?.[0];
    if (page.missing || !rev) throw new Error(`위키 페이지를 찾을 수 없음: ${page.title}`);
    out.set(page.title, {
      wikitext: rev.slots.main.content,
      revid: rev.revid,
      timestamp: rev.timestamp,
    });
  }
  return out;
}

/** 위키 마크업을 인용에 쓸 평문으로 정리한다. */
function toPlainText(wikitext: string): string {
  return wikitext
    .replace(/<[^>]+>/g, " ") // html 태그
    .replace(/\{\{\s*(?:Good|Evil)\s*\|\s*([^}]*)\}\}/g, "$1") // {{Good|Empath}} → Empath
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1") // [[A|B]] → B
    .replace(/'''?/g, "") // 굵게/기울임
    .replace(/^[*#:;]+\s*/gm, "") // 목록 기호
    .replace(/[ \t]+/g, " ");
}

/** anchor를 포함하는 문장부터 sentences개 문장을 뽑는다. */
function extractSentence(plain: string, anchor: string, sentences = 1): string | null {
  const at = plain.indexOf(anchor);
  if (at === -1) return null;

  // 앞쪽: 직전 문장 끝(마침표+공백) 또는 줄바꿈까지
  let start = 0;
  for (const m of plain.slice(0, at).matchAll(/(?:[.!?]\s+|\n)/g)) {
    start = m.index + m[0].length;
  }
  // 뒤쪽: 문장 끝(또는 줄바꿈)을 sentences번 지날 때까지
  let stop = plain.length;
  let cursor = at;
  for (let i = 0; i < sentences; i++) {
    const end = plain.slice(cursor).search(/(?:[.!?](?=\s|$)|\n)/);
    if (end === -1) {
      stop = plain.length;
      break;
    }
    cursor += end + 1;
    stop = cursor;
  }

  return plain.slice(start, stop).replace(/\s+/g, " ").trim();
}

// ── 공식 한국어 번역 (botc-translations) ────────────────────────────

interface KoRole {
  name: string;
  ability: string;
}

interface KoTranslation {
  roles: Record<string, KoRole | undefined>;
}

/** ko.json을 마지막으로 바꾼 커밋 — 인용 판본으로 표기한다. */
async function fetchKoCommit(): Promise<{ sha: string; date: string }> {
  const url = `https://api.github.com/repos/${TRANSLATIONS_REPO}/commits?path=${encodeURIComponent(KO_PATH)}&per_page=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "clocktower-puzzles/rule-sync (unofficial fan project; citation check)",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub API 응답 ${res.status}`);
  const [commit] = (await res.json()) as { sha: string; commit: { committer: { date: string } } }[];
  if (!commit) throw new Error(`${KO_PATH}의 커밋 이력을 찾을 수 없음`);
  return { sha: commit.sha.slice(0, 7), date: commit.commit.committer.date.slice(0, 10) };
}

async function fetchKoRoles(): Promise<KoTranslation> {
  const res = await fetch(KO_URL, {
    headers: { "User-Agent": "clocktower-puzzles/rule-sync (unofficial fan project; citation check)" },
  });
  if (!res.ok) throw new Error(`공식 번역 응답 ${res.status}`);
  return (await res.json()) as KoTranslation;
}

/** 역할 문서용 생성 파일 본문 + roles.ts 표기 대조 결과. */
function buildRoleRules(
  ko: KoTranslation,
  commit: { sha: string; date: string },
): { body: string; mismatches: string[] } {
  const mismatches: string[] = [];
  const entries: string[] = [];

  for (const id of ROLE_IDS as readonly RoleId[]) {
    const official = ko.roles[id];
    if (!official) throw new Error(`공식 번역에 없는 역할 id: ${id}`);

    const ours = ROLES[id].ko;
    if (ours !== official.name) {
      mismatches.push(`  ${id}: 우리 "${ours}" ↔ 공식 "${official.name}"`);
    }

    entries.push(
      [
        `  ${id}: {`,
        `    officialName: ${JSON.stringify(official.name)},`,
        `    ability: ${JSON.stringify(official.ability)},`,
        `    almanacUrl: ${JSON.stringify(`${WIKI}/${ROLES[id].en.replace(/ /g, "_")}`)},`,
        `  },`,
      ].join("\n"),
    );
  }

  const body = `// 자동 생성 파일 — 직접 편집하지 말 것.
// 생성: npm run rules:sync  (scripts/fetch-rule-sources.ts)
//
// 출처: Pandemonium Institute 공식 한국어 번역
// https://github.com/${TRANSLATIONS_REPO}/blob/main/${KO_PATH}
// 판본: ${commit.sha} (${commit.date})
//
// 역할 능력 문구는 공식 번역을 그대로 인용한다. 저작권은 The Pandemonium Institute에
// 있으며, 이 프로젝트는 공식과 무관한 비공식 팬 프로젝트다.

export interface RoleRule {
  /** 공식 한국어 역할명 */
  officialName: string;
  /** 공식 한국어 능력 문구 */
  ability: string;
  /** 영문 알마낙(상세 규칙·예시) 링크 */
  almanacUrl: string;
}

export const ROLE_TRANSLATION_SOURCE = {
  repo: ${JSON.stringify(TRANSLATIONS_REPO)},
  path: ${JSON.stringify(KO_PATH)},
  url: ${JSON.stringify(`https://github.com/${TRANSLATIONS_REPO}/blob/main/${KO_PATH}`)},
  commit: ${JSON.stringify(commit.sha)},
  committed: ${JSON.stringify(commit.date)},
} as const;

export const ROLE_RULES = {
${entries.join("\n")}
} as const satisfies Record<string, RoleRule>;
`;

  return { body, mismatches };
}

function header(): string {
  return `// 자동 생성 파일 — 직접 편집하지 말 것.
// 생성: npm run rules:sync  (scripts/fetch-rule-sources.ts)
//
// 출처: Blood on the Clocktower 공식 알마낙 위키 (${WIKI}).
// 규칙 서술의 정합성을 독자가 직접 확인할 수 있도록 원문 문장을 짧게 인용하고
// 해당 문서·판본으로 연결한다. 저작권은 The Pandemonium Institute에 있으며,
// 이 프로젝트는 공식과 무관한 비공식 팬 프로젝트다.
`;
}

async function main() {
  const check = process.argv.includes("--check");
  const titles = [...new Set(ANCHORS.map((a) => a.page))];
  const pages = await fetchPages(titles);

  const entries: string[] = [];
  const missing: string[] = [];

  for (const a of ANCHORS) {
    const rev = pages.get(a.page)!;
    const quote = extractSentence(toPlainText(rev.wikitext), a.anchor, a.sentences);
    if (!quote) {
      missing.push(`  ${a.key} (${a.page}): "${a.anchor}"`);
      continue;
    }
    const url = `${WIKI}/${a.page.replace(/ /g, "_")}${a.section ? `#${a.section}` : ""}`;
    entries.push(
      [
        `  "${a.key}": {`,
        `    page: ${JSON.stringify(a.page)},`,
        `    quote: ${JSON.stringify(quote)},`,
        `    url: ${JSON.stringify(url)},`,
        `    revid: ${rev.revid},`,
        `    revised: ${JSON.stringify(rev.timestamp.slice(0, 10))},`,
        `  },`,
      ].join("\n"),
    );
  }

  if (missing.length > 0) {
    console.error("✗ 공식 원문에서 다음 인용을 찾지 못했습니다 (규칙 문구가 바뀌었을 수 있음):");
    console.error(missing.join("\n"));
    console.error("\n앵커를 현재 원문에 맞게 갱신하고, 규칙 서술도 함께 검토하세요.");
    process.exit(1);
  }

  const body = `${header()}
export interface RuleSource {
  /** 공식 위키 문서 제목 */
  page: string;
  /** 대조용 원문 인용 (영문) */
  quote: string;
  /** 해당 문서(및 섹션) 링크 */
  url: string;
  /** 대조한 판본 번호 */
  revid: number;
  /** 그 판본의 최종 수정일 (YYYY-MM-DD) */
  revised: string;
}

export const RULE_SOURCES = {
${entries.join("\n")}
} as const satisfies Record<string, RuleSource>;

export type RuleSourceKey = keyof typeof RULE_SOURCES;
`;

  // ── 공식 한국어 번역 대조 ──
  const [ko, koCommit] = await Promise.all([fetchKoRoles(), fetchKoCommit()]);
  const roles = buildRoleRules(ko, koCommit);

  if (check) {
    console.log(`✓ 알마낙 인용 ${ANCHORS.length}건 모두 공식 원문과 일치합니다.`);
    for (const t of titles) {
      const r = pages.get(t)!;
      console.log(`  ${t} — 판본 ${r.revid} (${r.timestamp.slice(0, 10)})`);
    }
    console.log(`✓ 공식 번역 대조 — ${KO_PATH} @ ${koCommit.sha} (${koCommit.date})`);
  } else {
    writeFileSync(OUT, body, "utf8");
    writeFileSync(ROLE_OUT, roles.body, "utf8");
    console.log(`✓ 알마낙 인용 ${ANCHORS.length}건 → src/data/rule-sources.generated.ts 갱신`);
    console.log(
      `✓ 역할 ${ROLE_IDS.length}종 공식 능력 문구 → src/data/role-rules.generated.ts 갱신` +
        ` (${KO_PATH} @ ${koCommit.sha})`,
    );
  }

  // 표기 불일치는 경고로만 알린다 — 공식 번역이 개정되는 중일 수도 있으므로 판단은 사람이 한다.
  if (roles.mismatches.length > 0) {
    console.warn(
      `\n⚠ roles.ts의 한국어 표기 ${roles.mismatches.length}건이 공식 번역과 다릅니다:`,
    );
    console.warn(roles.mismatches.join("\n"));
    console.warn("의도한 차이가 아니라면 roles.ts를 공식 표기에 맞추세요.");
  } else {
    console.log("✓ roles.ts의 한국어 표기가 전부 공식 번역과 일치합니다.");
  }
}

main().catch((err) => {
  console.error("✗ 출처 동기화 실패:", err instanceof Error ? err.message : err);
  process.exit(1);
});
