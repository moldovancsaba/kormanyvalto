"use client";

import { useEffect, useMemo, useState } from "react";

type ClickStore = {
  yes: string[];
  no: string[];
  history?: {
    type: "yes" | "no";
    timestamp: string;
    sourceLabel: string;
  }[];
};

type VoteWidgetProps = {
  scope: string;
  aggregateMain?: boolean;
};

export default function VoteWidget({ scope, aggregateMain = false }: VoteWidgetProps) {
  const [data, setData] = useState<ClickStore>({ yes: [], no: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const yesCount = data.yes.length;
  const noCount = data.no.length;
  const totalCount = yesCount + noCount;
  const yesPercent = totalCount === 0 ? 50 : (yesCount / totalCount) * 100;
  const noPercent = 100 - yesPercent;
  const mergedVotes = useMemo(() => {
    if (data.history && data.history.length > 0) {
      return data.history.slice(0, 20).map((h) => ({
        type: h.type,
        ts: h.timestamp,
        sourceLabel: h.sourceLabel,
      }));
    }

    return [...data.yes.map((ts) => ({ type: "yes" as const, ts })), ...data.no.map((ts) => ({ type: "no" as const, ts }))]
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, 20)
      .map((v) => ({ ...v, sourceLabel: "" }));
  }, [data]);
  const winnerText =
    totalCount === 0
      ? "Nincs még szavazat"
      : yesCount === noCount
        ? "Döntetlen"
        : yesCount > noCount
          ? "Az igen vezet"
          : "A nem vezet";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/results?scope=${encodeURIComponent(scope)}${aggregateMain ? "&aggregate=1" : ""}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Nem sikerült betölteni az adatokat.");
        const next = (await res.json()) as ClickStore;
        setData(next);
      } catch {
        setError("Nem sikerült betölteni az adatokat.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [scope, aggregateMain]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        reg.unregister();
      });
    });
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownLeft((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        return next;
      });
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownLeft]);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    []
  );

  const addClick = async (type: "yes" | "no") => {
    if (submitting || loading || cooldownLeft > 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, scope }),
      });

      if (!res.ok) throw new Error("Nem sikerült menteni a szavazatot.");
      if (aggregateMain) {
        const refresh = await fetch(`/api/results?scope=${encodeURIComponent(scope)}&aggregate=1`, {
          cache: "no-store",
        });
        if (!refresh.ok) throw new Error("Nem sikerült frissíteni az adatokat.");
        const next = (await refresh.json()) as ClickStore;
        setData(next);
      } else {
        const next = (await res.json()) as ClickStore;
        setData(next);
      }
      setCooldownLeft(5);
    } catch {
      setError("Nem sikerült menteni a szavazatot.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app">
      <div className="top-logo" aria-hidden="true">
        🗳️
      </div>

      <section className="barometer" aria-label="Vezető opció">
        <p className="barometer-label">{winnerText}</p>
        <div className="bar-track" role="img" aria-label={`Igen: ${yesCount}, nem: ${noCount}`}>
          <div className="bar-yes" style={{ width: `${yesPercent}%` }} />
          <div className="bar-no" style={{ width: `${noPercent}%` }} />
        </div>
        <p className="barometer-stats">
          igen: {yesCount} | nem: {noCount}
        </p>
      </section>

      <h1>
        Váltani akarsz? Vagy nem?
        <br />
        Egyszerű kérdés. Egyszerű válasz?
      </h1>

      {error ? <p className="error">{error}</p> : null}

      <div className="buttons" aria-label="Válasz gombok">
        <button
          className="vote-btn vote-btn-yes"
          type="button"
          onClick={() => addClick("yes")}
          disabled={submitting || loading || cooldownLeft > 0}
        >
          {cooldownLeft > 0 ? `igen (${cooldownLeft.toFixed(1)}s)` : "igen"}
        </button>
        <button
          className="vote-btn vote-btn-no"
          type="button"
          onClick={() => addClick("no")}
          disabled={submitting || loading || cooldownLeft > 0}
        >
          {cooldownLeft > 0 ? `nem (${cooldownLeft.toFixed(1)}s)` : "nem"}
        </button>
      </div>

      <section className="timeline" aria-label="Kattintási időpontok">
        <h2>Utolsó szavazatok</h2>
        <ul>
          {loading ? (
            <li className="empty">Betöltés...</li>
          ) : mergedVotes.length === 0 ? (
            <li className="empty">Nincs kattintás.</li>
          ) : (
            mergedVotes.map((item, idx) => (
              <li key={`${item.ts}-${idx}`} className="timeline-item">
                <span
                  className={`vote-pill ${item.type === "yes" ? "vote-pill-yes" : "vote-pill-no"}`}
                >
                  {item.type === "yes" ? "igen" : "nem"}
                </span>
                <span>
                  {formatter.format(new Date(item.ts))}
                  {item.sourceLabel ? ` - ${item.sourceLabel}` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
