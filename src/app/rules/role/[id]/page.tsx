import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EDITION_LABELS, ROLES, TEAM_LABELS, roleLabel } from "@/data/roles";
import { ROLE_NOTES } from "@/data/role-notes";
import { ROLE_RULES, ROLE_TRANSLATION_SOURCE } from "@/data/role-rules.generated";
import { ROLE_IDS, type RoleId, type Team } from "@/lib/solver/types";

const TEAM_COLOR: Record<Team, string> = {
  townsfolk: "text-team-townsfolk",
  outsider: "text-team-outsider",
  minion: "text-team-minion",
  demon: "text-team-demon",
};

function isRoleId(id: string): id is RoleId {
  return (ROLE_IDS as readonly string[]).includes(id);
}

export function generateStaticParams() {
  return (ROLE_IDS as readonly RoleId[]).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/rules/role/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isRoleId(id)) return { title: "역할" };
  return {
    title: roleLabel(id),
    description: `${roleLabel(id)}의 능력과 퍼즐에서의 의미 — 공식 규칙 대조.`,
  };
}

export default async function RoleRulePage({ params }: PageProps<"/rules/role/[id]">) {
  const { id } = await params;
  if (!isRoleId(id)) notFound();

  const role = ROLES[id];
  const rule = ROLE_RULES[id];
  const note = ROLE_NOTES[id];

  return (
    <article className="space-y-8 text-sm leading-relaxed">
      <nav className="pt-4 text-xs text-faded">
        <Link href="/rules" className="hover:text-parchment">
          규칙
        </Link>
        <span className="mx-2">/</span>
        <span className={TEAM_COLOR[role.team]}>{TEAM_LABELS[role.team].ko}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">
          {role.ko}
          <span className="ml-2 text-xl font-normal text-faded">({role.en})</span>
        </h1>
        <p className="flex flex-wrap gap-x-3 text-xs text-faded">
          <span className={TEAM_COLOR[role.team]}>{TEAM_LABELS[role.team].ko}</span>
          <span>{EDITION_LABELS[role.edition].ko}</span>
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">능력</h2>
        <blockquote className="max-w-prose rounded-lg border-l-2 border-brass bg-panel px-4 py-3">
          {rule.ability}
        </blockquote>
        <p className="text-xs text-faded">공식 한국어 번역 원문.</p>
      </section>

      {note ? (
        <>
          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold">추리에서 뜻하는 것</h2>
            <p className="max-w-prose">{note.whatItMeans}</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold">취하거나 중독되면</h2>
            <p className="max-w-prose">{note.whenBroken}</p>
            <p className="max-w-prose text-xs text-faded">
              이 상태의 정보는 거짓이 아니라 <em>임의</em>라는 점이 중요합니다 —{" "}
              <Link
                href="/rules/drunk-and-poison"
                className="text-brass underline underline-offset-2 hover:text-parchment"
              >
                취함과 중독
              </Link>
              에서 근거와 함께 설명합니다.
            </p>
          </section>

          {note.watchOut && (
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold">놓치기 쉬운 점</h2>
              <p className="max-w-prose border-l-2 border-blood/60 pl-3">{note.watchOut}</p>
            </section>
          )}
        </>
      ) : (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">해설 준비 중</h2>
          <p className="max-w-prose text-faded">
            이 역할은 사전에는 있지만 아직 해설을 쓰지 않았고, 솔버도 능력을 모델링하지
            않았습니다. 지금은 위 공식 능력 문구와 아래 알마낙 링크를 참고해 주세요.
          </p>
        </section>
      )}

      <section className="space-y-3 border-t border-panel-edge pt-8">
        <h2 className="font-display text-base font-bold">출처 · 정합성 검증</h2>
        <p className="max-w-prose text-xs text-faded">
          능력 문구는 공식 번역을 그대로 옮긴 것이고, 해설이 있다면 그건 직접 쓴 것입니다.
          원문과 대조하려면 아래 링크를 확인하세요.
        </p>
        <ul className="space-y-2 text-xs">
          <li className="rounded border border-panel-edge bg-panel px-3 py-2">
            <a
              href={ROLE_TRANSLATION_SOURCE.url}
              className="text-brass underline underline-offset-2 hover:text-parchment"
              target="_blank"
              rel="noopener noreferrer"
            >
              공식 한국어 번역 · {ROLE_TRANSLATION_SOURCE.path}
            </a>
            <span className="ml-2 text-faded">
              판본 {ROLE_TRANSLATION_SOURCE.commit} ({ROLE_TRANSLATION_SOURCE.committed})
            </span>
            {/* 역할명마다 뒤에 붙는 조사가 달라지므로 이름 뒤에는 조사를 두지 않는다. */}
            <p className="mt-1 text-faded">
              이 문서의 역할명과 능력 문구의 출처입니다. 공식 표기: “{rule.officialName}”
            </p>
          </li>
          <li className="rounded border border-panel-edge bg-panel px-3 py-2">
            <a
              href={rule.almanacUrl}
              className="text-brass underline underline-offset-2 hover:text-parchment"
              target="_blank"
              rel="noopener noreferrer"
            >
              공식 알마낙 · {role.en}
            </a>
            <p className="mt-1 text-faded">
              상세 규칙, 예시, 텔러 지침이 영문으로 정리돼 있습니다.
            </p>
          </li>
        </ul>
      </section>
    </article>
  );
}
