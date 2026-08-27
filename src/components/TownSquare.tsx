"use client";

// 타운스퀘어 = 시계 문자판. 좌석이 시계 눈금 위에 앉는다.
// 좌석 A(0)가 12시 방향, 시계 방향으로 배치.
//
// 추측 토큰이 하나라도 놓이면 **판을 넓힌다**(BASE → WIDE). 시계 밖에 추측 토큰
// 링이 하나 더 생기고 좌석과 연결선으로 이어진다. 폭은 화면이 정하므로 원이 한 겹
// 늘면 전부가 그만큼 작아진다 — 그 비용은 이 기능을 쓰는 사람만 낸다.

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

/** 토큰에 얹히는 글. claim은 주장한 역할, guess는 풀이자가 놓은 추측 (둘 다 한글). */
export interface SeatAnnotation {
  claim?: string;
  guess?: string;
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

interface Geometry {
  size: number;
  ring: number;
  seat: number;
  token: number;
  /** 추측 토큰 링의 반지름과 크기. 좁은 판에서는 쓰지 않는다. */
  guess: number;
  guessToken: number;
}

const BASE: Geometry = { size: 340, ring: 158, seat: 118, token: 27, guess: 0, guessToken: 0 };
const WIDE: Geometry = { size: 410, ring: 144, seat: 112, token: 26, guess: 178, guessToken: 25 };

/**
 * 글자 수에 맞춰 원 안에 들어가는 크기. 글줄이 놓이는 높이마다 쓸 수 있는 폭이
 * 다르므로 한글 자폭을 1em으로 잡고 넘치지 않게 맞췄다.
 * 솔버가 아는 역할 중 가장 긴 이름이 6자(객실 청소부)다.
 */
function labelSize(text: string): number {
  if (text.length <= 3) return 9.5;
  if (text.length <= 4) return 9;
  if (text.length <= 5) return 8.2;
  return 7.2;
}

/** 추측 토큰은 지름이 더 작다 — 5자부터는 두 줄로 나눠 담는다. */
function splitLabel(text: string): string[] {
  if (text.length <= 4) return [text];
  const space = text.indexOf(" ");
  if (space > 0) return [text.slice(0, space), text.slice(space + 1)];
  const mid = Math.ceil(text.length / 2);
  return [text.slice(0, mid), text.slice(mid)];
}

/** 서버/브라우저의 libm 차이로 인한 hydration 불일치 방지 — 좌표는 소수 2자리로 고정 */
function r2(v: number): number {
  return Math.round(v * 100) / 100;
}

function seatAngle(i: number, n: number): number {
  return -Math.PI / 2 + (2 * Math.PI * i) / n;
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
  const wide = annotations?.some((a) => a?.guess) ?? false;
  const g = wide ? WIDE : BASE;
  const C = g.size / 2;

  // 시계 눈금: 60개 분침 눈금 + 12개 시침 눈금
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (2 * Math.PI * i) / 60;
    const isHour = i % 5 === 0;
    const r1 = g.ring - (isHour ? 10 : 5);
    ticks.push(
      <line
        key={i}
        x1={r2(C + r1 * Math.cos(a))}
        y1={r2(C + r1 * Math.sin(a))}
        x2={r2(C + g.ring * Math.cos(a))}
        y2={r2(C + g.ring * Math.sin(a))}
        stroke="var(--brass)"
        strokeOpacity={isHour ? 0.55 : 0.22}
        strokeWidth={isHour ? 1.6 : 1}
      />,
    );
  }

  return (
    <svg
      viewBox={`0 0 ${g.size} ${g.size}`}
      className={`mx-auto w-full select-none ${wide ? "max-w-md" : "max-w-sm"}`}
      role="group"
      aria-label="타운스퀘어 좌석 배치"
    >
      <circle cx={C} cy={C} r={g.ring} fill="none" stroke="var(--panel-edge)" strokeWidth={1.5} />
      <circle cx={C} cy={C} r={g.ring - 14} fill="none" stroke="var(--panel-edge)" strokeWidth={0.75} strokeOpacity={0.6} />
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
        const a = seatAngle(i, playerCount);
        const x = r2(C + g.seat * Math.cos(a));
        const y = r2(C + g.seat * Math.sin(a));
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
        const guess = note?.guess;
        const mark = note?.mark ? MARK_BY_ID.get(note.mark) : undefined;
        const badge = r2(g.token * 0.707);
        const gx = r2(C + g.guess * Math.cos(a));
        const gy = r2(C + g.guess * Math.sin(a));
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
              guess ? `내 추측: ${guess}` : null,
            ]
              .filter(Boolean)
              .join(", ")}
            className="cursor-pointer outline-none focus-visible:opacity-80"
          >
            {/* 추측 토큰 — 시계 밖에 놓고 연결선으로 좌석과 잇는다 */}
            {wide && guess && (
              <>
                <line
                  x1={r2(C + (g.seat + g.token) * Math.cos(a))}
                  y1={r2(C + (g.seat + g.token) * Math.sin(a))}
                  x2={r2(C + (g.guess - g.guessToken) * Math.cos(a))}
                  y2={r2(C + (g.guess - g.guessToken) * Math.sin(a))}
                  stroke="var(--brass)"
                  strokeOpacity={0.45}
                  strokeWidth={1}
                />
                <circle
                  cx={gx}
                  cy={gy}
                  r={g.guessToken}
                  fill="var(--panel)"
                  stroke="var(--brass)"
                  strokeOpacity={0.7}
                  strokeWidth={1.25}
                  strokeDasharray="3.5 2.5"
                />
                {splitLabel(guess).map((line, li, all) => (
                  <text
                    key={li}
                    x={gx}
                    y={r2(gy + (all.length === 1 ? 0 : li === 0 ? -4.5 : 5.5))}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--parchment)"
                    fontSize={all.length === 1 ? labelSize(line) : 8.5}
                  >
                    {line}
                  </text>
                ))}
              </>
            )}

            <circle
              cx={x}
              cy={y}
              r={g.token}
              fill={isDemonNow ? "color-mix(in srgb, var(--blood) 30%, var(--panel))" : "var(--panel)"}
              stroke={ringColor}
              strokeWidth={isSelected || isDemonNow ? 2.5 : 1.5}
              opacity={dead ? 0.55 : 1}
            />
            <text
              x={x}
              y={claim ? y - 5 : y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={dead ? "var(--faded)" : "var(--parchment)"}
              fontSize={claim ? 14 : 17}
              fontWeight={700}
              className="font-display"
            >
              {seatName(i)}
            </text>
            {claim && (
              <text
                x={x}
                y={y + 9}
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
            {mark && (
              <g>
                <circle
                  cx={x + badge}
                  cy={y - badge}
                  r={8}
                  fill="var(--ink)"
                  stroke={mark.color}
                  strokeWidth={1.5}
                />
                <text
                  x={x + badge}
                  y={y - badge + 0.5}
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
                x1={x - g.token + 5}
                y1={y + g.token - 5}
                x2={x + g.token - 5}
                y2={y - g.token + 5}
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
