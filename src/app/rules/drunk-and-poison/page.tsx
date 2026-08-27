import type { Metadata } from "next";
import Link from "next/link";
import { BUDGET_NOTE, RULE_SECTIONS } from "@/data/rules";
import { RULE_SOURCES, type RuleSourceKey } from "@/data/rule-sources.generated";

export const metadata: Metadata = {
  title: "취함과 중독",
  description:
    "Blood on the Clocktower의 취함·중독 규칙 해설 — 모든 서술을 공식 알마낙 원문과 대조해 출처를 붙였다.",
};

/** 본문 등장 순서대로 각주 번호를 매긴다. */
function buildCitationOrder(): RuleSourceKey[] {
  const seen: RuleSourceKey[] = [];
  for (const section of RULE_SECTIONS) {
    for (const statement of section.statements) {
      for (const key of statement.sources) {
        if (!seen.includes(key)) seen.push(key);
      }
    }
  }
  return seen;
}

export default function RulesPage() {
  const order = buildCitationOrder();
  const numberOf = (key: RuleSourceKey) => order.indexOf(key) + 1;

  // 인용한 문서를 판본 정보와 함께 모은다 (하단 검증 표용)
  const pages = [...new Set(order.map((k) => RULE_SOURCES[k].page))].map((page) => {
    const one = order.map((k) => RULE_SOURCES[k]).find((s) => s.page === page)!;
    return { page, url: one.url.split("#")[0], revid: one.revid, revised: one.revised };
  });

  return (
    <article className="space-y-10 text-sm leading-relaxed">
      <nav className="pt-4 text-xs text-faded">
        <Link href="/rules" className="hover:text-parchment">
          규칙
        </Link>
        <span className="mx-2">/</span>
        <span>상태</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">취함과 중독</h1>
        <p className="max-w-prose text-faded">
          퍼즐에서 선한 플레이어가 틀린 말을 하는 유일한 이유입니다. 이 규칙을 정확히
          알아야 추리가 성립하므로, 아래 서술은 모두{" "}
          <strong className="text-parchment">공식 알마낙 원문과 대조</strong>해 각주를
          달았습니다. 각 번호를 누르면 근거 원문과 출처 링크로 이동합니다.
        </p>
      </header>

      {RULE_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold">{section.title}</h2>
            <p className="max-w-prose text-faded">{section.lede}</p>
          </div>

          <dl className="space-y-4">
            {section.statements.map((statement) => (
              <div
                key={statement.headline}
                className="rounded border border-panel-edge bg-panel px-4 py-3"
              >
                <dt className="font-bold">
                  {statement.headline}
                  {statement.sources.map((key) => (
                    <a
                      key={key}
                      href={`#src-${key}`}
                      className="ml-1 align-super text-xs font-normal text-brass hover:underline"
                      aria-label={`근거 원문 ${numberOf(key)}번`}
                    >
                      [{numberOf(key)}]
                    </a>
                  ))}
                </dt>
                <dd className="mt-1 max-w-prose text-faded">{statement.body}</dd>
              </div>
            ))}
          </dl>

          {section.puzzleNote && (
            <p className="max-w-prose border-l-2 border-brass/60 pl-3 text-faded">
              <span className="font-bold text-brass">퍼즐에서는 </span>
              {section.puzzleNote}
            </p>
          )}
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">답이 하나뿐인 이유</h2>
        <p className="max-w-prose text-faded">{BUDGET_NOTE}</p>
      </section>

      <section id="sources" className="space-y-4 border-t border-panel-edge pt-8">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">출처 · 정합성 검증</h2>
          <p className="max-w-prose text-faded">
            위 서술은 우리가 직접 쓴 해설이지 공식 문장의 번역이 아닙니다. 그래서 각
            서술이 실제 규칙과 어긋나지 않는지 독자가 직접 확인할 수 있도록, 근거가 된
            공식 원문을 그대로 인용하고 해당 문서로 연결했습니다.{" "}
            <strong className="text-parchment">
              링크를 눌러 원문과 대조하면 서술의 정합성을 확인할 수 있습니다.
            </strong>
          </p>
        </div>

        <ol className="space-y-3">
          {order.map((key) => {
            const source = RULE_SOURCES[key];
            return (
              <li
                key={key}
                id={`src-${key}`}
                className="scroll-mt-20 rounded border border-panel-edge bg-panel px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-faded">
                  <span className="font-bold text-brass">[{numberOf(key)}]</span>
                  <a
                    href={source.url}
                    className="text-brass underline underline-offset-2 hover:text-parchment"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    공식 알마낙 · {source.page}
                  </a>
                  <span>
                    판본 {source.revid} ({source.revised} 수정)
                  </span>
                </div>
                <blockquote className="mt-2 max-w-prose border-l-2 border-panel-edge pl-3 font-mono text-xs leading-relaxed text-parchment/90">
                  {source.quote}
                </blockquote>
              </li>
            );
          })}
        </ol>

        <div className="space-y-2 rounded border border-panel-edge px-4 py-3 text-xs text-faded">
          <p className="font-bold text-parchment">인용은 자동으로 대조됩니다</p>
          <p className="max-w-prose">
            위 인용문은 공식 위키의 MediaWiki API에서 직접 받아온 것입니다.{" "}
            <code className="font-mono text-brass">npm run rules:check</code>를 돌리면 각
            문장이 지금도 원문에 그대로 있는지 확인하고, 공식 문구가 바뀌어 인용이
            어긋나면 실패합니다. 아래는 이 페이지가 대조한 문서와 판본입니다.
          </p>
          <ul className="space-y-1 pt-1">
            {pages.map((p) => (
              <li key={p.page}>
                <a
                  href={p.url}
                  className="text-brass underline underline-offset-2 hover:text-parchment"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.url.replace("https://", "")}
                </a>{" "}
                — 판본 {p.revid} ({p.revised})
              </li>
            ))}
          </ul>
          <p className="max-w-prose pt-1">
            인용문의 저작권은 The Pandemonium Institute에 있으며, 규칙 대조 목적으로 짧게
            인용했습니다. 이 사이트는 공식과 무관한 비공식 팬 프로젝트입니다.
          </p>
        </div>
      </section>
    </article>
  );
}
