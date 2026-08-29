import type { Metadata } from "next";

export const metadata: Metadata = { title: "소개" };

export default function AboutPage() {
  return (
    <article className="space-y-8 text-sm leading-relaxed">
      <header className="space-y-3 pt-4">
        <h1 className="font-display text-3xl font-bold">이 마을에 대하여</h1>
        <p className="max-w-prose text-faded">
          시계탑 퍼즐은 소셜 추리 보드게임 <em>Blood on the Clocktower</em>의
          상황을 순수 논리 퍼즐로 바꿔 놓은 비공식 팬 사이트입니다.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">푸는 법</h2>
        <ul className="max-w-prose list-disc space-y-2 pl-5">
          <li>
            모든 플레이어의 <strong>공개 주장</strong>(자기 역할과 밤마다 받은 정보)과{" "}
            <strong>사건 기록</strong>(처형·밤 사망)이 주어집니다.
          </li>
          <li>
            선한 플레이어는 거짓말을 하지 않습니다 — 다만 악한 플레이어는 마음껏
            거짓말을 하고, 취함·중독 상태의 선한 플레이어는 틀린 정보를 받았을 수
            있습니다.
          </li>
          <li>
            게임의 역할 구성 규칙(인원수별 마을 주민·외지인·하수인·악마 수)도
            추리의 단서입니다. 각 퍼즐에 등장할 수 있는 역할은 대본으로 공개되며, 그중 일부만 실제로 쓰입니다.
          </li>
          <li>
            질문에 좌석을 골라 답하세요. 재시도는 무제한이고, 힌트는 퍼즐당 최대
            2개, 막히면 포기하고 단계별 해설을 볼 수 있습니다.
          </li>
          <li>
            퍼즐은 자동 검증기로 <strong>답이 논리적으로 하나뿐임이 증명</strong>된 뒤에
            올라옵니다. 찍기가 아니라 추리로 반드시 도달할 수 있습니다. 예외는 검증기가 아직
            능력을 모르는 역할이 든 문제(주로 실제로 진행된 판의 기록)뿐이고, 그런
            문제에는 <strong>「솔버 미검증」</strong> 표시가 붙습니다 — 답이 둘 이상일 수 있어
            스토리텔러가 쓴 해설이 근거입니다.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">기록</h2>
        <p className="max-w-prose text-faded">
          풀이 기록(해결 배지, 힌트 사용)과 좌석에 남긴 표시·추측은 이 브라우저의
          localStorage에만 저장됩니다. 서버에는 아무것도 저장되지 않고, 계정도
          이용자 구분도 없어서 같은 기기를 함께 쓰지 않는 한 다른 사람의 화면에
          나타나지 않습니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">팬 고지</h2>
        <p className="max-w-prose text-faded">
          이 사이트는 The Pandemonium Institute와 무관한 비공식 팬 프로젝트이며,
          공식 아트워크를 사용하지 않습니다. Blood on the Clocktower는 The
          Pandemonium Institute의 상표입니다. 원작 게임이 궁금하다면{" "}
          <a
            href="https://bloodontheclocktower.com"
            className="text-brass underline underline-offset-2 hover:text-parchment"
            target="_blank"
            rel="noopener noreferrer"
          >
            bloodontheclocktower.com
          </a>
          을 방문하세요.
        </p>
      </section>
    </article>
  );
}
