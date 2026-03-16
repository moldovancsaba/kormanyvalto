"use client";

import { useEffect, useState } from "react";
import { formatNumber, formatPercent } from "../../lib/numberFormat";

type ListVotePreviewData = {
  listBasisYes: number;
  listBasisNo: number;
  listYesSeats: number;
  listNoSeats: number;
  unresolvedListSeats: number;
  yesPercent: number;
  noPercent: number;
  marginVotes: number;
  marginPercent: number;
  matrixText: string;
  cooldownSec?: number;
};

type ListVotePreviewCardProps = {
  initialData: ListVotePreviewData;
};

export function ListVotePreviewCard({ initialData }: ListVotePreviewCardProps) {
  const [data, setData] = useState<ListVotePreviewData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownStorageKey = "kv-cooldown-until:main";

  const applyCooldown = (seconds: number) => {
    const normalized = Math.max(0, Number(seconds.toFixed(1)));
    if (normalized <= 0) {
      setCooldownLeft(0);
      try {
        localStorage.removeItem(cooldownStorageKey);
      } catch {}
      return;
    }

    const until = Date.now() + normalized * 1000;
    try {
      localStorage.setItem(cooldownStorageKey, String(until));
    } catch {}
    setCooldownLeft(normalized);
  };

  useEffect(() => {
    if (typeof initialData.cooldownSec === "number") {
      applyCooldown(initialData.cooldownSec);
    }
  }, [initialData.cooldownSec]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cooldownStorageKey);
      const until = raw ? Number(raw) : 0;
      if (!until || Number.isNaN(until)) return;
      const remainingSec = Math.max(0, (until - Date.now()) / 1000);
      setCooldownLeft(Number(remainingSec.toFixed(1)));
      if (remainingSec <= 0) {
        localStorage.removeItem(cooldownStorageKey);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        if (next <= 0) {
          try {
            localStorage.removeItem(cooldownStorageKey);
          } catch {}
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  const refresh = async () => {
    const res = await fetch("/api/list-preview", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Nem sikerült betölteni a listás adatokat.");
    }
    const next = (await res.json()) as ListVotePreviewData;
    setData(next);
    if (typeof next.cooldownSec === "number") {
      applyCooldown(next.cooldownSec);
    }
  };

  const submitVote = async (type: "yes" | "no") => {
    if (submitting || cooldownLeft > 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, scope: "main" }),
      });
      const payload = (await res.json().catch(() => null)) as ({ cooldownSec?: number; error?: string }) | null;
      if (!res.ok) {
        if (typeof payload?.cooldownSec === "number") {
          applyCooldown(payload.cooldownSec);
        }
        throw new Error(payload?.error || "Nem sikerült menteni a szavazatot.");
      }

      await refresh();
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Nem sikerült menteni a szavazatot.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="preview-visual-card list-vote-card">
      <header className="chart-card-head">
        <h2>Listás szavazás</h2>
        <p>Az országos listás és töredékszavazatok együttes állása a 93 listás mandátum becsléséhez.</p>
      </header>

      <div className="preview-lead-meta">
        <p className="preview-lead-status">{data.matrixText}</p>
        <p className="preview-lead-margin">
          Különbség: {formatNumber(data.marginVotes)} szavazat ({formatPercent(data.marginPercent)})
        </p>
      </div>

      <div className="preview-lead-chart" role="img" aria-label={`Listás igen: ${data.listBasisYes}, listás nem: ${data.listBasisNo}`}>
        <svg viewBox="0 0 100 12" className="preview-lead-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect x="0" y="0" width={data.yesPercent} height="12" className="preview-tone-yes" />
          <rect x={data.yesPercent} y="0" width={data.noPercent} height="12" className="preview-tone-no" />
        </svg>
      </div>

      <div className="preview-lead-values">
        <p className="preview-lead-chip preview-lead-chip-yes">
          igen: <strong>{formatNumber(data.listBasisYes)}</strong> ({formatPercent(data.yesPercent)})
        </p>
        <p className="preview-lead-chip preview-lead-chip-no">
          nem: <strong>{formatNumber(data.listBasisNo)}</strong> ({formatPercent(data.noPercent)})
        </p>
      </div>

      <div className="kpi-dual-stack list-vote-seat-stack" aria-label="Becsült listás mandátumok">
        <article className="kpi-dual-chip kpi-dual-chip-yes">
          <strong>{data.listYesSeats}</strong>
          <span>becsült igen listás mandátum</span>
        </article>
        <article className="kpi-dual-chip kpi-dual-chip-no">
          <strong>{data.listNoSeats}</strong>
          <span>becsült nem listás mandátum</span>
        </article>
      </div>

      {data.unresolvedListSeats > 0 ? <p className="list-vote-meta">Még nyitott listás helyek: {data.unresolvedListSeats}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="list-vote-actions" aria-label="Listás szavazás">
        <button className="vote-btn vote-btn-yes" type="button" onClick={() => submitVote("yes")} disabled={submitting || cooldownLeft > 0}>
          {cooldownLeft > 0 ? `igen (${cooldownLeft.toFixed(1)}s)` : "igen"}
        </button>
        <button className="vote-btn vote-btn-no" type="button" onClick={() => submitVote("no")} disabled={submitting || cooldownLeft > 0}>
          {cooldownLeft > 0 ? `nem (${cooldownLeft.toFixed(1)}s)` : "nem"}
        </button>
      </div>
    </section>
  );
}
