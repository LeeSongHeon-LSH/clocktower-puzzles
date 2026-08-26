"use client";

// 관리자: 역할 한국어 표기 편집 → GitHub 커밋 → Vercel 자동 재배포(~1분)

import { useState } from "react";
import { ROLES, TEAM_LABELS } from "@/data/roles";
import { ROLE_IDS, type RoleId } from "@/lib/solver/types";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [edits, setEdits] = useState<Partial<Record<RoleId, string>>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = ROLE_IDS.filter(
    (id) => edits[id] !== undefined && edits[id] !== ROLES[id].ko,
  );

  const save = async () => {
    setBusy(true);
    setResult(null);
    try {
      const changes = Object.fromEntries(dirty.map((id) => [id, edits[id]!.trim()]));
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, changes }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      setResult(
        res.ok
          ? { ok: true, text: data.message ?? "커밋 완료." }
          : { ok: false, text: data.error ?? `실패 (${res.status})` },
      );
    } catch {
      setResult({ ok: false, text: "네트워크 오류." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2 pt-4">
        <h1 className="font-display text-2xl font-bold">역할 표기 관리</h1>
        <p className="text-sm text-faded">
          한국어 표기를 수정하고 저장하면 GitHub에 커밋되어 약 1분 내에 사이트
          전체에 반영됩니다. 영어 표기는 고정입니다.
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-panel-edge text-left text-xs text-faded">
            <th className="py-2 pr-3 font-normal">영어</th>
            <th className="py-2 pr-3 font-normal">팀</th>
            <th className="py-2 font-normal">한국어 표기</th>
          </tr>
        </thead>
        <tbody>
          {ROLE_IDS.map((id) => {
            const r = ROLES[id];
            const value = edits[id] ?? r.ko;
            const changed = value !== r.ko;
            return (
              <tr key={id} className="border-b border-panel-edge/50">
                <td className="py-2 pr-3">{r.en}</td>
                <td className="py-2 pr-3 text-faded">{TEAM_LABELS[r.team].ko}</td>
                <td className="py-2">
                  <input
                    value={value}
                    onChange={(e) => setEdits((p) => ({ ...p, [id]: e.target.value }))}
                    className={`w-full rounded border bg-ink px-2 py-1 outline-none focus:border-brass ${
                      changed ? "border-brass" : "border-panel-edge"
                    }`}
                    aria-label={`${r.en} 한국어 표기`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="관리자 비밀번호"
          className="rounded border border-panel-edge bg-ink px-3 py-2 text-sm outline-none focus:border-brass"
        />
        <button
          onClick={save}
          disabled={busy || dirty.length === 0 || password.length === 0}
          className="rounded-md bg-blood px-4 py-2 text-sm font-bold text-parchment hover:bg-blood-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "커밋 중…" : `저장 (${dirty.length}건)`}
        </button>
        {result && (
          <span className={`text-sm ${result.ok ? "text-brass" : "text-blood"}`}>
            {result.text}
          </span>
        )}
      </div>
    </div>
  );
}
