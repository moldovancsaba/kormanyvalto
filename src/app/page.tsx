"use client";

import { useEffect, useMemo, useState } from "react";

type ClickStore = {
  yes: string[];
  no: string[];
};

const STORAGE_KEY = "valtani-clicks-v1";

function readStore(): ClickStore {
  if (typeof window === "undefined") {
    return { yes: [], no: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ClickStore) : null;
    if (!parsed || !Array.isArray(parsed.yes) || !Array.isArray(parsed.no)) {
      return { yes: [], no: [] };
    }
    return parsed;
  } catch {
    return { yes: [], no: [] };
  }
}

function writeStore(data: ClickStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function HomePage() {
  const [data, setData] = useState<ClickStore>({ yes: [], no: [] });
  const yesCount = data.yes.length;
  const noCount = data.no.length;
  const totalCount = yesCount + noCount;
  const yesPercent = totalCount === 0 ? 50 : (yesCount / totalCount) * 100;
  const noPercent = 100 - yesPercent;
  const winnerText =
    totalCount === 0
      ? "Nincs még szavazat"
      : yesCount === noCount
        ? "Döntetlen"
        : yesCount > noCount
          ? "Az igen vezet"
          : "A nem vezet";

  useEffect(() => {
    setData(readStore());
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // no-op
      });
    }
  }, []);

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

  const addClick = (type: "yes" | "no") => {
    const next = {
      ...data,
      [type]: [new Date().toISOString(), ...data[type]],
    };
    setData(next);
    writeStore(next);
  };

  return (
    <main className="app">
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

      <h1>Váltani akarsz?</h1>

      <div className="buttons" aria-label="Válasz gombok">
        <button type="button" onClick={() => addClick("yes")}>
          igen
        </button>
        <button type="button" onClick={() => addClick("no")}>
          nem
        </button>
      </div>

      <section className="columns" aria-label="Kattintási időpontok">
        <article className="column">
          <h2>igen</h2>
          <ul>
            {data.yes.length === 0 ? (
              <li className="empty">Nincs kattintás.</li>
            ) : (
              data.yes.map((ts, idx) => <li key={`${ts}-${idx}`}>{formatter.format(new Date(ts))}</li>)
            )}
          </ul>
        </article>

        <article className="column">
          <h2>nem</h2>
          <ul>
            {data.no.length === 0 ? (
              <li className="empty">Nincs kattintás.</li>
            ) : (
              data.no.map((ts, idx) => <li key={`${ts}-${idx}`}>{formatter.format(new Date(ts))}</li>)
            )}
          </ul>
        </article>
      </section>
    </main>
  );
}
