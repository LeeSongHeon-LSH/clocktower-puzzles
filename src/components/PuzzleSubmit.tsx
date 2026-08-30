"use client";

// 수록 신청 안내.
//
// 검증을 통과한 문제를 사이트 목록에 올리려면 저장소(GitHub)를 거쳐야 한다 — 서버가 없어
// 사이트가 직접 접수할 수 없기 때문이다. 그 사정이 GitHub을 모르는 사람에게는 그냥
// 벽이라, 두 갈래로 나눠 둔다.
//
//   방법 1 — 신청서 한 장. 문제 전체가 공유 링크 안에 들어 있으므로 링크만 보내면 된다.
//            코드도 파일도 건드리지 않는다. GitHub 계정 하나가 전부다.
//   방법 2 — 직접 PR. 파일은 여기서 만들어 준다. 붙여넣기만 하면 되고, 화면에 실제로
//            찍혀 있는 영문 버튼 이름을 그대로 적는다.

import { useState } from "react";
import { type SharedPuzzle } from "@/lib/puzzles/codec";
import { indexSnippet, puzzleFileSource } from "@/lib/puzzles/source";

const REPO = "https://github.com/LeeSongHeon-LSH/clocktower-puzzles";
/** GitHub이 414로 되돌려보내는 지점 언저리. 넘으면 미리 채우지 않고 복사로 돌린다. */
const URL_BUDGET = 7000;

const DIFFICULTY_LABEL: Record<string, string> = { easy: "쉬움", normal: "보통", hard: "어려움" };

function CopyButton({ text, children }: { text: string; children: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded border border-panel-edge px-3 py-1.5 text-xs text-faded transition-colors hover:text-parchment"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          },
          () => setDone(false),
        );
      }}
    >
      {done ? "복사했습니다" : children}
    </button>
  );
}

/** 번호가 붙은 절차 한 벌 */
function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="font-display shrink-0 text-sm font-bold text-brass">{i + 1}</span>
          <span className="max-w-prose text-xs leading-relaxed text-faded">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** 화면에 영문 그대로 찍혀 있는 버튼 — 눈으로 찾을 수 있게 같은 모양으로 보여준다 */
function Btn({ children }: { children: string }) {
  return (
    <code className="rounded border border-panel-edge bg-ink px-1.5 py-0.5 text-[11px] text-parchment">
      {children}
    </code>
  );
}

export function PuzzleSubmit({
  shared,
  link,
  unverified,
  puzzleId,
}: {
  shared: SharedPuzzle;
  link: string;
  unverified: boolean;
  puzzleId: string;
}) {
  const steps = shared.walkthrough?.length ?? 0;

  // 해설이 없으면 수록은 성립하지 않는다 — definePuzzle이 거부하고, CI도 거기서 멈춘다.
  // 신청 경로를 열어 두면 헛걸음만 시키므로 여기서 막고 어디를 채워야 하는지 말한다.
  if (steps === 0) {
    return (
      <div className="max-w-prose space-y-1.5 rounded-lg border border-panel-edge bg-panel p-4">
        <p className="font-display text-sm font-bold text-parchment">사이트에 수록 신청하기</p>
        <p className="text-xs leading-relaxed text-faded">
          지금 만든 링크는 <strong className="text-parchment">사적인 링크</strong>입니다. 이 사이트 목록에
          영구히 올리려면 신청이 필요하고, 수록 문제에는{" "}
          <strong className="text-brass">해설이 반드시 있어야 합니다</strong> — 푼 사람이 왜 그 답인지
          읽을 수 있어야 하기 때문입니다. 위 6번에 해설을 적으면 여기에 신청 방법이 나옵니다.
        </p>
      </div>
    );
  }

  const fileName = `${puzzleId}.ts`;
  const filePath = `src/data/puzzles/${fileName}`;
  const fileSource = puzzleFileSource(shared, puzzleId);
  const { importLine, arrayItem } = indexSnippet(puzzleId);

  const issueTitle = `[수록 신청] ${shared.title}`;
  const issueBody = [
    "## 수록 신청",
    "",
    `- 제목: ${shared.title}`,
    `- 만든 사람: ${shared.author ?? "(밝히지 않음)"}`,
    `- 난이도: ${DIFFICULTY_LABEL[shared.difficulty] ?? shared.difficulty}`,
    `- 규모: ${shared.playerCount}명 · 밤 ${shared.nights}`,
    `- 유일해 검증: ${unverified ? "건너뜀 — 검증기가 능력을 모르는 역할이 들어 있습니다" : "통과 (브라우저 솔버 전수 탐색)"}`,
    `- 해설: ${steps}단계`,
    "",
    "### 공유 링크",
    "주장·사건·정답 배치·해설이 전부 이 링크 안에 들어 있습니다. 열면 그대로 풀립니다.",
    "",
    link,
    "",
    "### 덧붙일 말",
    "(만든 배경이나 하고 싶은 말이 있으면 여기에 적어 주세요. 없으면 이 줄은 지우셔도 됩니다.)",
  ].join("\n");

  const issueUrl = `${REPO}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
  const prefilled = issueUrl.length <= URL_BUDGET;

  return (
    <div className="max-w-prose space-y-4 rounded-lg border border-panel-edge bg-panel p-4">
      <div className="space-y-1.5">
        <p className="font-display text-sm font-bold text-parchment">사이트에 수록 신청하기</p>
        <p className="text-xs leading-relaxed text-faded">
          지금 만든 링크는 <strong className="text-parchment">사적인 링크</strong>입니다. 잃어버리면 문제도
          사라집니다. 이 사이트 목록에 영구히 올리고 싶다면 신청하세요 — 접수는{" "}
          <strong className="text-parchment">GitHub</strong>에서 받습니다. 이 사이트에는 서버가 없어서
          (그래서 가입도 없습니다) 접수함을 둘 데가 거기뿐입니다.
        </p>
        {unverified && (
          <p className="text-xs leading-relaxed text-brass">
            이 문제는 답이 하나라는 보장이 없습니다. 신청은 할 수 있지만, 검토가 더 깐깐하고 수록되더라도
            「솔버 미검증」 표시가 함께 붙습니다.
          </p>
        )}
      </div>

      {/* ── 방법 1 ── */}
      <section className="space-y-2.5 border-t border-panel-edge pt-3">
        <h3 className="font-display text-sm font-bold text-brass">
          방법 1 — 신청서 한 장 <span className="font-sans text-xs font-normal text-faded">쉬움 · 5분</span>
        </h3>
        <p className="max-w-prose text-xs leading-relaxed text-faded">
          코드도 파일도 건드리지 않습니다. 문제 전체가 링크 안에 들어 있어서{" "}
          <strong className="text-parchment">링크만 보내면 됩니다.</strong> 나머지(파일로 옮기고 목록에 등록)는
          받는 쪽에서 합니다.
        </p>
        <Steps
          items={[
            <>
              아래 <strong className="text-parchment">「GitHub에 신청서 열기」</strong>를 누릅니다. 제목과 내용이{" "}
              {prefilled ? "이미 채워진 채로" : "빈 채로"} 글쓰기 화면이 열립니다.
              {!prefilled && (
                <>
                  {" "}
                  이 문제는 내용이 길어 자동으로 채워지지 않으니,{" "}
                  <strong className="text-parchment">「신청서 내용 복사」</strong>를 눌러 본문에 붙여넣으세요.
                </>
              )}
            </>,
            <>
              GitHub 계정이 없으면 가입 화면이 먼저 나옵니다. 이메일·비밀번호·아이디만 있으면 되고 무료입니다.
              가입을 마친 뒤 이 버튼을 다시 누르세요.
            </>,
            <>
              내용을 확인하고 초록색 <Btn>Create</Btn> 버튼을 누릅니다. 이걸로 접수는 끝입니다.
            </>,
            <>
              검토 결과는 방금 올린 그 글에 댓글로 달립니다. 알림은 가입할 때 쓴 이메일로 옵니다. 고칠 곳이
              있으면 에디터에서 고쳐 새 링크를 만들어 댓글로 붙이시면 됩니다.
            </>,
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <a
            href={prefilled ? issueUrl : `${REPO}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-brass/60 px-3 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
          >
            GitHub에 신청서 열기
          </a>
          <CopyButton text={issueBody}>신청서 내용 복사</CopyButton>
        </div>
      </section>

      {/* ── 방법 2 ── */}
      <section className="space-y-2.5 border-t border-panel-edge pt-3">
        <h3 className="font-display text-sm font-bold text-brass">
          방법 2 — 직접 올리기 (Pull Request){" "}
          <span className="font-sans text-xs font-normal text-faded">30분 · 설치할 것 없음</span>
        </h3>
        <p className="max-w-prose text-xs leading-relaxed text-faded">
          내 손으로 저장소에 넣고 싶다면 이쪽입니다. 프로그램을 깔 필요도, 명령어를 칠 필요도 없습니다 —
          전부 브라우저 안에서 끝납니다. <strong className="text-parchment">문제 파일은 아래에 이미
          만들어 두었습니다.</strong> 복사해서 붙여넣기만 하세요.
        </p>

        <details className="rounded border border-panel-edge bg-ink/40 p-3">
          <summary className="cursor-pointer text-xs text-parchment">
            붙여넣을 파일 보기 — <code className="text-brass">{filePath}</code>
          </summary>
          <div className="mt-2 space-y-2">
            <textarea
              readOnly
              value={fileSource}
              rows={12}
              className="w-full rounded border border-panel-edge bg-ink px-2 py-1 font-mono text-[11px] leading-relaxed text-parchment"
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={fileSource}>파일 내용 복사</CopyButton>
              <CopyButton text={fileName}>파일 이름 복사</CopyButton>
            </div>
            <p className="text-[11px] leading-relaxed text-faded">
              파일 이름의 <code className="text-parchment">{puzzleId}</code>는 아직 쓰이지 않은 번호로
              골랐습니다. 그 사이 누가 같은 번호를 쓰면 검사에서 걸리니, 그때 번호만 올리면 됩니다.
            </p>
          </div>
        </details>

        <Steps
          items={[
            <>
              <a
                href={`${REPO}/fork`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brass underline underline-offset-2 hover:text-parchment"
              >
                저장소 복사(Fork) 만들기
              </a>{" "}
              를 누르고, 나오는 화면에서 초록색 <Btn>Create fork</Btn>를 누릅니다. 내 계정 안에 저장소
              사본이 생깁니다 — 원본은 건드리지 않으니 마음껏 해도 됩니다.
            </>,
            <>
              내 사본에서 <code className="text-parchment">src</code> → <code className="text-parchment">data</code> →{" "}
              <code className="text-parchment">puzzles</code> 폴더로 들어갑니다. 오른쪽 위{" "}
              <Btn>Add file</Btn> → <Btn>Create new file</Btn>.
            </>,
            <>
              파일 이름 칸에 <code className="text-parchment">{fileName}</code>을 넣고, 위에서 복사한 파일
              내용을 아래 넓은 칸에 붙여넣습니다. 오른쪽 위 <Btn>Commit changes...</Btn> → <Btn>Commit changes</Btn>.
            </>,
            <>
              같은 폴더의 <code className="text-parchment">index.ts</code>를 클릭하고 연필 아이콘(<Btn>Edit</Btn>)을
              누릅니다. 문제 목록에 등록하는 두 줄을 더해야 합니다 — 파일만 있고 등록이 없으면 아무 데도
              뜨지 않습니다.
              <span className="mt-1.5 block space-y-1">
                <span className="block rounded bg-ink/60 px-2 py-1 font-mono text-[11px] text-parchment">
                  {importLine}
                </span>
                <span className="block text-[11px] text-faded">
                  ↑ 다른 <code>import</code> 줄들 바로 아래에. 그리고{" "}
                  <code className="text-parchment">PUZZLES</code> 배열 맨 끝에{" "}
                  <code className="text-parchment">{arrayItem}</code>을 쉼표로 이어 붙입니다.
                </span>
              </span>
              고쳤으면 다시 <Btn>Commit changes...</Btn> → <Btn>Commit changes</Btn>.
            </>,
            <>
              내 사본 첫 화면으로 돌아가 <Btn>Contribute</Btn> → <Btn>Open pull request</Btn> →{" "}
              <Btn>Create pull request</Btn>. 이걸로 &ldquo;원본에 이 문제를 넣어 주세요&rdquo;라는 요청이
              전달됩니다.
            </>,
            <>
              올리자마자 자동 검사가 돕니다. 초록색 체크(✓)면 통과, 빨간 X면 어디가 틀렸는지 그 자리에
              기록이 남습니다 — 대개 4번의 등록 두 줄이 빠졌거나 번호가 겹친 경우입니다. 고쳐서 다시
              커밋하면 검사는 알아서 다시 돕니다.
            </>,
          ]}
        />
      </section>

      <p className="border-t border-panel-edge pt-3 text-[11px] leading-relaxed text-faded">
        어느 쪽이든 심사 기준은 하나입니다 — 답이 논리로 하나에 이르는가. 이미 그 검사를 통과했으니
        나머지는 형식 문제입니다. 공식 아트워크를 쓰지 않는 것, 그리고 별명이 목록에 남는 것에 동의하는
        것만 확인해 주세요.
      </p>
    </div>
  );
}
