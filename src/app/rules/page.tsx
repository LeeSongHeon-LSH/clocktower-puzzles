import type { Metadata } from "next";
import Link from "next/link";
import { ROLES, TEAM_LABELS, roleLabel } from "@/data/roles";
import { ROLE_TRANSLATION_SOURCE } from "@/data/role-rules.generated";
import { ROLE_IDS, type RoleId, type Team } from "@/lib/solver/types";

export const metadata: Metadata = {
  title: "규칙",
  description:
    "Blood on the Clocktower 규칙 문서 — 취함·중독과 역할별 능력을 공식 원문과 대조해 정리했다.",
};

const TEAM_ORDER: Team[] = ["townsfolk", "outsider", "minion", "demon"];

const TEAM_COLOR: Record<Team, string> = {
  townsfolk: "text-team-townsfolk",
  outsider: "text-team-outsider",
  minion: "text-team-minion",
  demon: "text-team-demon",
};

export default function RulesIndexPage() {
  const byTeam = TEAM_ORDER.map((team) => ({
    team,
    roles: (ROLE_IDS as readonly RoleId[]).filter((id) => ROLES[id].team === team),
  }));

  return (
    <article className="space-y-10 text-sm leading-relaxed">
      <header className="space-y-3 pt-4">
        <h1 className="font-display text-3xl font-bold">규칙</h1>
        <p className="max-w-prose text-faded">
          퍼즐을 푸는 데 필요한 규칙만 모았습니다. 모든 서술은{" "}
          <strong className="text-parchment">공식 알마낙·공식 한국어 번역과 대조</strong>했고,
          각 문서 하단에서 근거 원문과 출처 링크를 확인할 수 있습니다.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">먼저 읽을 것</h2>
        <Link
          href="/rules/drunk-and-poison"
          className="block rounded-lg border border-brass/50 bg-panel p-4 transition-colors hover:border-brass"
        >
          <p className="font-display text-lg font-bold">취함과 중독</p>
          <p className="mt-1 max-w-prose text-faded">
            선한 플레이어가 틀린 말을 하는 유일한 이유입니다. 이걸 모르면 어떤 퍼즐도
            논리적으로 닫히지 않습니다.
          </p>
        </Link>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">역할</h2>
          <p className="max-w-prose text-faded">
            이 사이트의 퍼즐에 등장하는 {ROLE_IDS.length}종입니다. 각 문서에는 공식 능력
            문구와, 그 능력이 추리에서 실제로 무엇을 확정해 주는지를 함께 적었습니다.
          </p>
        </div>

        {byTeam.map(({ team, roles }) => (
          <div key={team} className="space-y-2">
            <h3 className={`font-display text-base font-bold ${TEAM_COLOR[team]}`}>
              {TEAM_LABELS[team].ko}
              <span className="ml-2 text-xs font-normal text-faded">
                {TEAM_LABELS[team].en}
              </span>
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {roles.map((id) => (
                <li key={id}>
                  <Link
                    href={`/rules/role/${id}`}
                    className="block rounded border border-panel-edge bg-panel px-3 py-2 transition-colors hover:border-brass/60"
                  >
                    {roleLabel(id)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="space-y-2 border-t border-panel-edge pt-8 text-xs text-faded">
        <h2 className="font-display text-base font-bold text-parchment">표기 기준</h2>
        <p className="max-w-prose">
          역할명과 능력 문구는 Pandemonium Institute의{" "}
          <a
            href={ROLE_TRANSLATION_SOURCE.url}
            className="text-brass underline underline-offset-2 hover:text-parchment"
            target="_blank"
            rel="noopener noreferrer"
          >
            공식 한국어 번역
          </a>
          을 그대로 따릅니다 (판본 {ROLE_TRANSLATION_SOURCE.commit},{" "}
          {ROLE_TRANSLATION_SOURCE.committed}). 임의 의역을 두지 않으며, 동기화
          스크립트가 표기가 어긋나면 알려 줍니다.
        </p>
        <p className="max-w-prose">
          비공식 팬 프로젝트입니다. 인용문의 저작권은 The Pandemonium Institute에 있습니다.
        </p>
      </section>
    </article>
  );
}
