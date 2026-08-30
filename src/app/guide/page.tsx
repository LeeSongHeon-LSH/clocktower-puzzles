import type { Metadata } from "next";
import Link from "next/link";
import { ROLES } from "@/data/roles";
import { LIMITS } from "@/lib/puzzles/codec";
import { ROLE_IDS, SOLVER_ROLES, type RoleId } from "@/lib/solver/types";

export const metadata: Metadata = {
  title: "문제 업로드 가이드",
  description: "직접 만든 시계탑 추리 문제를 검증하고 공유하는 방법, 그리고 사이트에 정식 수록하는 방법.",
};

const DEMON_COUNT = (ROLE_IDS as readonly RoleId[]).filter((r) => ROLES[r].team === "demon").length;
const SOLVER_COUNT = SOLVER_ROLES.length;

const REPO = "https://github.com/LeeSongHeon-LSH/clocktower-puzzles";

export default function GuidePage() {
  return (
    <article className="space-y-10 text-sm leading-relaxed">
      <header className="space-y-3 pt-4">
        <h1 className="font-display text-3xl font-bold">문제 업로드 가이드</h1>
        <p className="max-w-prose text-faded">
          직접 만든 문제를 남들이 풀게 하는 방법은 두 가지입니다. <strong className="text-parchment">
          링크로 바로 공유</strong>하거나, <strong className="text-parchment">사이트에 정식 수록</strong>을
          신청하거나. 어느 쪽이든 통과해야 하는 관문은 하나로 같습니다 — 답이 논리적으로 하나뿐이어야 합니다.
        </p>
      </header>

      {/* ── 핵심 규칙 ── */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">단 하나의 원칙</h2>
        <div className="rounded-lg border border-brass/50 bg-panel p-4">
          <p className="font-bold text-brass">답이 하나뿐이어야 문제입니다.</p>
          <p className="mt-1 max-w-prose text-faded">
            찍어서 맞히는 게 아니라 추리로 반드시 도달할 수 있어야 합니다. 이 사이트는 사람이 눈으로
            검수하지 않습니다 — 대신 <strong className="text-parchment">솔버가 가능한 모든 배치를 전부
            세어서</strong> 정말 하나인지 증명합니다. 답이 여럿이거나 없으면 링크가 아예 만들어지지 않습니다.
          </p>
        </div>
        <p className="max-w-prose text-faded">
          그래서 <strong className="text-parchment">질문은 만들지 않습니다.</strong> 모든 문제의 틀이
          같습니다 — 지금까지 있었던 일을 전부 기록해 마지막 순간까지 펼쳐 보이고, 푸는 사람은{" "}
          <strong className="text-parchment">지금 이 순간의 악마가 누구인지</strong> 하나만 답합니다.
          정답은 입력한 그리모어에서 자동으로 나오므로 따로 적을 것도 없습니다. (수록 문제 중에는 악마를
          맞힌 뒤 하수인·주정뱅이를 더 묻는 것도 있습니다. 찍어서 맞힌 사람을 걸러 내는 보너스 단계일 뿐,
          틀이 다른 것은 아닙니다.)
        </p>
      </section>

      {/* ── 경로 A ── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">경로 A — 링크로 바로 공유</h2>
          <p className="max-w-prose text-faded">
            가장 빠른 방법입니다. 가입도, 승인도, 기다림도 없습니다.
          </p>
        </div>

        <ol className="space-y-3">
          {[
            {
              t: "에디터에서 문제를 짭니다",
              d: "인원수와 역할 풀을 정하고, 좌석마다 무엇을 주장하는지, 밤에 무슨 일이 있었는지, 그리고 실제 정답 배치를 입력합니다.",
            },
            {
              t: "‘유일해 검증’을 누릅니다",
              d: "브라우저가 그 자리에서 솔버를 돌립니다. 가장 큰 판(10인·전체 대본)도 0.2초 안에 끝납니다.",
            },
            {
              t: "링크를 받아 공유합니다",
              d: "문제 전체가 링크 안에 담깁니다. 카톡·디스코드 어디에 붙여도 되고, 받은 사람은 클릭만 하면 바로 풉니다.",
            },
          ].map((s, i) => (
            <li key={s.t} className="flex gap-3 rounded border border-panel-edge bg-panel p-3">
              <span className="font-display shrink-0 text-lg font-bold text-brass">{i + 1}</span>
              <span>
                <strong>{s.t}</strong>
                <span className="mt-0.5 block max-w-prose text-faded">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="rounded border-l-2 border-brass/60 bg-panel/50 py-2 pl-3">
          <p className="max-w-prose text-faded">
            <strong className="text-parchment">서버에 아무것도 저장되지 않습니다.</strong> 문제는 링크 그
            자체입니다. 그래서 사이트에 “사설 문제 목록”은 없고, 링크를 잃어버리면 문제도 사라집니다.
            아끼는 문제라면 링크를 따로 보관하거나 경로 B로 정식 수록을 신청하세요.
          </p>
        </div>

        <Link
          href="/create"
          className="inline-block rounded-md bg-blood px-5 py-2.5 font-bold text-parchment transition-colors hover:bg-blood-deep"
        >
          지금 업로드하러 가기
        </Link>
      </section>

      {/* ── 솔버 규칙 ── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">솔버가 요구하는 것</h2>
          <p className="max-w-prose text-faded">
            검증이 자꾸 실패한다면 대개 아래 중 하나에 걸린 겁니다.
          </p>
        </div>

        <dl className="space-y-3">
          {[
            {
              t: "모든 좌석이 무언가를 주장해야 합니다",
              d: "이 사이트의 문제는 ‘전원이 공개 주장을 한 상태’를 전제로 합니다. 침묵하는 좌석은 둘 수 없습니다.",
            },
            {
              t: "주장하는 역할도 역할 풀 안에 있어야 합니다",
              d: "거짓말도 판에 있을 법한 역할로 해야 합니다. 풀에 없는 역할을 주장하면 검증이 거부됩니다.",
            },
            {
              t: `주정뱅이(${ROLES.drunk.ko})와 악마 ${DEMON_COUNT}종은 주장할 수 없습니다`,
              d: "주정뱅이는 자기가 주민이라고 믿으므로, 그가 믿는 그 주민 역할을 주장하게 하면 됩니다. 악마는 자기 정체를 밝히지 않습니다.",
            },
            {
              t: `인원은 ${LIMITS.minPlayers}~${LIMITS.maxPlayers}명, 밤은 최대 ${LIMITS.maxNights}까지입니다`,
              d: "이 범위 안에서는 검증이 항상 즉시 끝납니다. 범위를 넘기면 애초에 입력할 수 없습니다.",
            },
            {
              t: "밤 사망은 밤 2부터입니다",
              d: "첫날 밤에는 악마가 아무도 죽이지 않습니다.",
            },
            {
              t: `검증되는 역할은 ${ROLE_IDS.length}종 중 ${SOLVER_COUNT}종입니다`,
              d: "역할 사전에는 3개 판본이 다 들어 있어서 무엇이든 풀에 넣고 배치할 수 있지만, 솔버가 능력을 아는 역할은 그 일부입니다. 모르는 능력을 없는 셈 치고 세면 ‘답이 하나’라는 결론이 거짓이 되므로, 그런 문제는 검증하지 않고 어떤 역할이 걸렸는지 알려 줍니다. 능력은 하나씩 구현해 넣는 중입니다.",
            },
          ].map((r) => (
            <div key={r.t} className="rounded border border-panel-edge bg-panel px-4 py-3">
              <dt className="font-bold">{r.t}</dt>
              <dd className="mt-1 max-w-prose text-faded">{r.d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 좋은 문제 만들기 ── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">잘 풀리는 문제를 만드는 요령</h2>
          <p className="max-w-prose text-faded">
            검증만 통과한 문제와 풀어서 즐거운 문제는 다릅니다.
          </p>
        </div>

        <dl className="space-y-3">
          {[
            {
              t: "대본은 넉넉하게, 정답은 그 일부만",
              d: "역할 풀은 푸는 사람에게 대본으로 공개됩니다. 좌석 수보다 넉넉히 담으세요 — 7자리에 7종이면 어떤 역할이 쓰였는지 다 드러나 답이 저절로 좁혀집니다. 특히 하수인은 두 종 이상 담아야 정체가 감춰집니다.",
            },
            {
              t: "‘해가 여럿’이면 단서가 아니라 제약이 부족한 것입니다",
              d: "정보를 더 넣거나 사건을 더 넣어 보세요. 역할 풀을 좁히면 해는 줄지만 대본이 공개되므로 그만큼 문제도 쉬워집니다 — 마지막 수단으로 쓰세요.",
            },
            {
              t: "‘해가 없음’은 대개 정답 배치와 주장이 어긋난 것입니다",
              d: "정답 배치를 기준으로, 선하고 멀쩡한 사람의 주장이 실제로 나올 수 있는 정보인지 하나씩 짚어 보세요. 취하거나 중독된 사람의 정보는 아무 값이나 가능하다는 점도 기억하세요.",
            },
            {
              t: "거짓말의 출처를 하나로 몰지 마세요",
              d: "누가 왜 틀린 말을 하는지가 추리의 핵심입니다. 악역의 거짓말, 주정뱅이, 독살 — 이 셋이 섞일 때 문제가 재미있어집니다.",
            },
          ].map((r) => (
            <div key={r.t} className="rounded border border-panel-edge bg-panel px-4 py-3">
              <dt className="font-bold">{r.t}</dt>
              <dd className="mt-1 max-w-prose text-faded">{r.d}</dd>
            </div>
          ))}
        </dl>

        <p className="max-w-prose text-faded">
          취함·중독이 정확히 어떻게 작동하는지는{" "}
          <Link href="/rules/drunk-and-poison" className="text-brass underline underline-offset-2 hover:text-parchment">
            규칙 문서
          </Link>
          에 공식 원문과 함께 정리해 두었습니다. 문제를 만들기 전에 한 번 읽어 두면 훨씬 수월합니다.
        </p>
      </section>

      {/* ── 경로 B ── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">경로 B — 사이트에 정식 수록</h2>
          <p className="max-w-prose text-faded">
            잘 만든 문제는 사이트 목록에 영구히 올릴 수 있습니다. 만든 사람 이름도 함께 남습니다.
            접수는 저장소(GitHub)에서 받습니다 — 이 사이트에는 서버가 없어 접수함을 둘 데가 거기뿐입니다.
            <strong className="text-parchment"> GitHub이 처음이어도 됩니다.</strong> 아래 2번의 두 방법 중
            첫 번째는 코드도 파일도 건드리지 않습니다.
          </p>
        </div>

        <ol className="space-y-3">
          {[
            {
              t: "먼저 경로 A로 검증을 통과시키고, 해설을 적으세요",
              d: "유일해가 아닌 문제는 어차피 수록되지 않습니다. 그리고 수록 문제에는 해설이 필수입니다 — 기계가 답을 보증하더라도, 푼 사람이 왜 그 답인지 읽을 수 있어야 합니다.",
            },
            {
              t: "에디터 맨 아래에 열리는 ‘수록 신청’에서 방법을 고릅니다",
              d: "방법 1(쉬움·5분) — 버튼 하나로 GitHub 신청서가 제목·내용까지 채워진 채 열립니다. 문제 전체가 공유 링크 안에 들어 있어서 링크만 보내면 되고, 나머지는 받는 쪽에서 합니다. 방법 2(직접 PR) — 저장소에 넣을 문제 파일을 에디터가 만들어 줍니다. 복사해 붙여넣기만 하면 되고, 브라우저에서 누를 버튼 이름까지 순서대로 적혀 있습니다. 설치할 프로그램은 없습니다.",
            },
            {
              t: "자동 검증이 돌아갑니다",
              d: "PR을 열면 CI가 전 퍼즐에 대해 유일해 검증을 다시 실행합니다. 통과하지 못하면 병합되지 않습니다.",
            },
            {
              t: "확인 후 병합되면 바로 배포됩니다",
              d: "수록된 문제는 목록에서 ‘사설’ 표시와 함께 보입니다.",
            },
          ].map((s, i) => (
            <li key={s.t} className="flex gap-3 rounded border border-panel-edge bg-panel p-3">
              <span className="font-display shrink-0 text-lg font-bold text-brass">{i + 1}</span>
              <span>
                <strong>{s.t}</strong>
                <span className="mt-0.5 block max-w-prose text-faded">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="max-w-prose text-faded">
          저장소는{" "}
          <a
            href={REPO}
            className="text-brass underline underline-offset-2 hover:text-parchment"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/LeeSongHeon-LSH/clocktower-puzzles
          </a>
          입니다. 계정 만들기가 내키지 않으면 경로 A의 링크를 아무 데로나 보내 주셔도 됩니다.
        </p>
      </section>

      {/* ── 표시 규칙 ── */}
      <section className="space-y-3 border-t border-panel-edge pt-8">
        <h2 className="font-display text-base font-bold">알아 두실 것</h2>
        <ul className="max-w-prose list-disc space-y-1.5 pl-5 text-xs text-faded">
          <li>
            난이도와 출처는 별개입니다. 사설 문제도 쉬움·보통·어려움을 그대로 고를 수 있습니다.
          </li>
          <li>
            공유 링크에는 정답이 들어 있습니다. 링크를 받은 사람이 주소창을 뜯어보면 답을 알 수 있으니,
            정식 대회용으로는 적합하지 않습니다.
          </li>
          <li>
            이 사이트는 비공식 팬 프로젝트입니다. 공식 아트워크는 사용하지 않으며, 만드신 문제도 같은
            기준을 지켜 주세요.
          </li>
        </ul>
      </section>
    </article>
  );
}
