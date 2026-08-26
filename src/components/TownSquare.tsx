"use client";

// 타운스퀘어 = 시계 문자판. 좌석이 시계 눈금 위에 앉는다.
// 좌석 A(0)가 12시 방향, 시계 방향으로 배치.

import type { Team } from "@/lib/solver/types";
import { seatName } from "@/lib/puzzles/schema";

const TEAM_COLOR: Record<Team, string> = {
  townsfolk: "var(--team-townsfolk)",
  outsider: "var(--team-outsider)",
  minion: "var(--team-minion)",
  demon: "var(--team-demon)",
};

export interface TownSquareReveal {
  teams: Team[];
  demonSeat: number;
}

interface TownSquareProps {
  playerCount: number;
  deadSeats: ReadonlySet<number>;
  selected: number | null;
  onSelect: (seat: number) => void;
  reveal?: TownSquareReveal | null;
  centerLabel: string;
}

const SIZE = 340;
const C = SIZE / 2;
const RING_R = 158;
const SEAT_R = 118;
const TOKEN_R = 27;

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
            aria-label={`좌석 ${seatName(i)}${dead ? " (사망)" : ""}`}
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
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={dead ? "var(--faded)" : "var(--parchment)"}
              fontSize={17}
              fontWeight={700}
              className="font-display"
            >
              {seatName(i)}
            </text>
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
