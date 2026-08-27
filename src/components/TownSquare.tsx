"use client";

// 타운스퀘어 = 시계 문자판. 좌석이 시계 눈금 위에 앉는다.
// 좌석 A(0)가 12시 방향, 시계 방향으로 배치.

import type { Team } from "@/lib/solver/types";
import { seatName } from "@/lib/puzzles/schema";
import type { SeatMark } from "@/lib/notes";

const TEAM_COLOR: Record<Team, string> = {
  townsfolk: "var(--team-townsfolk)",
  outsider: "var(--team-outsider)",
  minion: "var(--team-minion)",
  demon: "var(--team-demon)",
};

export interface TownSquareReveal {
  teams: Team[];
  demonSeat: number;
  /** 정답 공개 뒤 토큰에 실을 실제 역할(한글). 주장 대신 이쪽을 보여준다. */
  roles?: string[];
}

/**
 * 좌석 표시 순서와 색. 풀이자가 누르는 버튼(PuzzleClient)과 토큰 배지가
 * 같은 기호·같은 색을 쓰도록 한 곳에서 정의한다.
 */
export const MARKS: { id: SeatMark; symbol: string; label: string; color: string }[] = [
  { id: "trust", symbol: "✓", label: "믿음", color: "var(--team-townsfolk)" },
  { id: "doubt", symbol: "?", label: "의심", color: "var(--brass)" },
  { id: "lie", symbol: "✗", label: "거짓", color: "var(--team-minion)" },
  { id: "evil", symbol: "악", label: "악역?", color: "var(--blood)" },
];

const MARK_BY_ID = new Map(MARKS.map((m) => [m.id, m]));

/** 토큰에 얹히는 글. claim은 주장한 역할(한글), memo는 풀이자가 쓴 짧은 글. */
export interface SeatAnnotation {
  claim?: string;
  memo?: string;
  mark?: SeatMark;
}

interface TownSquareProps {
  playerCount: number;
  deadSeats: ReadonlySet<number>;
  selected: number | null;
  onSelect: (seat: number) => void;
  reveal?: TownSquareReveal | null;
  centerLabel: string;
  annotations?: SeatAnnotation[];
}

const SIZE = 340;
const C = SIZE / 2;
const RING_R = 158;
const SEAT_R = 118;
const TOKEN_R = 27;

/**
 * 글자 수에 맞춰 토큰 안에 들어가는 크기.
 * 토큰 반지름 27의 원 안에서 글줄이 놓이는 높이(y)마다 쓸 수 있는 폭이 다르다 —
 * 한글 자폭을 1em으로 잡고 가장 아래 줄(메모, y+13)까지 넘치지 않게 잡은 값이다.
 */
function labelSize(text: string): number {
  if (text.length <= 3) return 9.5;
  if (text.length <= 4) return 9;
  if (text.length <= 5) return 8.2;
  if (text.length <= 6) return 7.2;
  return 6.2;
}

/** 서버/브라우저의 libm 차이로 인한 hydration 불일치 방지 — 좌표는 소수 2자리로 고정 */
function r2(v: number): number {
  return Math.round(v * 100) / 100;
}

function seatPos(i: number, n: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return { x: r2(C + SEAT_R * Math.cos(angle)), y: r2(C + SEAT_R * Math.sin(angle)) };
}

export function TownSquare({
  playerCount,
  deadSeats,
  selected,
  onSelect,
  reveal,
  centerLabel,
  annotations,
}: TownSquareProps) {
  // 시계 눈금: 60개 분침 눈금 + 12개 시침 눈금
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (2 * Math.PI * i) / 60;
    const isHour = i % 5 === 0;
    const r1 = RING_R - (isHour ? 10 : 5);
    ticks.push(
      <line
        key={i}
        x1={r2(C + r1 * Math.cos(a))}
        y1={r2(C + r1 * Math.sin(a))}
        x2={r2(C + RING_R * Math.cos(a))}
        y2={r2(C + RING_R * Math.sin(a))}
        stroke="var(--brass)"
        strokeOpacity={isHour ? 0.55 : 0.22}
        strokeWidth={isHour ? 1.6 : 1}
      />,
    );
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-sm select-none"
      role="group"
      aria-label="타운스퀘어 좌석 배치"
    >
      <circle cx={C} cy={C} r={RING_R} fill="none" stroke="var(--panel-edge)" strokeWidth={1.5} />
      <circle cx={C} cy={C} r={RING_R - 14} fill="none" stroke="var(--panel-edge)" strokeWidth={0.75} strokeOpacity={0.6} />
      {ticks}

      <text
        x={C}
        y={C + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--faded)"
        fontSize={15}
        className="font-display"
      >
        {centerLabel}
      </text>

      {Array.from({ length: playerCount }, (_, i) => {
        const { x, y } = seatPos(i, playerCount);
        const dead = deadSeats.has(i);
        const isSelected = selected === i;
        const team = reveal?.teams[i];
        const ringColor = team
          ? TEAM_COLOR[team]
          : isSelected
            ? "var(--brass)"
            : "var(--panel-edge)";
        const isDemonNow = reveal != null && reveal.demonSeat === i;
        const note = annotations?.[i];
        // 정답이 공개되면 토큰은 주장 대신 진짜 역할을 든다 —
        // 링이 이미 진영색이라 주장을 그대로 두면 어느 쪽인지 읽히지 않는다.
        const truth = reveal?.roles?.[i];
        const claim = truth ?? note?.claim;
        const memo = note?.memo;
        const mark = note?.mark ? MARK_BY_ID.get(note.mark) : undefined;
        // 한 줄일 때는 가운데, 주장·메모가 붙으면 위로 밀어 올린다
        const letterY = memo ? y - 11 : claim ? y - 5 : y + 1;
        return (
          <g
            key={i}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(i);
              }
            }}
            tabIndex={0}
            role="button"
            aria-pressed={isSelected}
            aria-label={[
              `좌석 ${seatName(i)}`,
              truth ? `실제 ${truth}` : claim ? `${claim} 주장` : null,
              dead ? "사망" : null,
              mark ? `내 표시: ${mark.label}` : null,
              memo ? `내 메모: ${memo}` : null,
            ]
              .filter(Boolean)
              .join(", ")}
            className="cursor-pointer outline-none focus-visible:opacity-80"
          >
            <circle
              cx={x}
              cy={y}
              r={TOKEN_R}
              fill={isDemonNow ? "color-mix(in srgb, var(--blood) 30%, var(--panel))" : "var(--panel)"}
              stroke={ringColor}
              strokeWidth={isSelected || isDemonNow ? 2.5 : 1.5}
              opacity={dead ? 0.55 : 1}
            />
            <text
              x={x}
              y={letterY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={dead ? "var(--faded)" : "var(--parchment)"}
              fontSize={!claim ? 17 : memo ? 13 : 14}
              fontWeight={700}
              className="font-display"
            >
              {seatName(i)}
            </text>
            {claim && (
              <text
                x={x}
                y={memo ? y + 1 : y + 9}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={truth ? ringColor : "var(--brass)"}
                fontSize={labelSize(claim)}
                fontWeight={truth ? 700 : 400}
                opacity={dead ? 0.6 : 0.95}
              >
                {claim}
              </text>
            )}
            {memo && (
              <text
                x={x}
                y={y + 13}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--faded)"
                fontSize={labelSize(memo)}
              >
                {memo}
              </text>
            )}
            {mark && (
              <g>
                <circle
                  cx={x + 19.1}
                  cy={y - 19.1}
                  r={8}
                  fill="var(--ink)"
                  stroke={mark.color}
                  strokeWidth={1.5}
                />
                <text
                  x={x + 19.1}
                  y={y - 18.6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={mark.color}
                  fontSize={9}
                  fontWeight={700}
                >
                  {mark.symbol}
                </text>
              </g>
            )}
            {dead && (
              // 죽은 토큰의 수의(壽衣) 띠
              <line
                x1={x - TOKEN_R + 5}
                y1={y + TOKEN_R - 5}
                x2={x + TOKEN_R - 5}
                y2={y - TOKEN_R + 5}
                stroke="var(--faded)"
                strokeWidth={1.75}
                strokeOpacity={0.8}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
