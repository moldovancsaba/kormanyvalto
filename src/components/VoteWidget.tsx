"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { PageHero } from "./PageChrome";

type ClickStore = {
  yesCount: number;
  noCount: number;
  cooldownSec?: number;
  matrixStatus?: {
    code: "YY" | "YN" | "NY" | "NN" | "TT";
    text: string;
  };
  history?: {
    type: "yes" | "no";
    timestamp: string;
    sourceLabel: string;
    sourceCounty?: string;
    sourceCity?: string;
    sourceCountyHref?: string;
    sourceCityHref?: string;
    sourceCountyTone?: "yes" | "no" | "neutral";
    sourceCityTone?: "yes" | "no" | "neutral";
    weight: number;
  }[];
};

type AuthState = {
  configured: boolean;
  authenticated: boolean;
  user: {
    email: string;
    name: string;
    picture: string | null;
    provider: "google";
    multiplier: number;
  } | null;
};

type VoteWidgetProps = {
  scope: string;
  aggregateMain?: boolean;
  heroTitle?: ReactNode;
  topActions?: ReactNode;
};

const defaultAuthState: AuthState = {
  configured: false,
  authenticated: false,
  user: null,
};

export default function VoteWidget({ scope, aggregateMain = false, heroTitle, topActions }: VoteWidgetProps) {
  const [data, setData] = useState<ClickStore>({ yesCount: 0, noCount: 0, history: [] });
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [returnTo, setReturnTo] = useState("/");
  const yesCount = data.yesCount;
  const noCount = data.noCount;
  const totalCount = yesCount + noCount;
  const yesPercent = totalCount === 0 ? 50 : (yesCount / totalCount) * 100;
  const noPercent = 100 - yesPercent;
  const cooldownStorageKey = `kv-cooldown-until:${scope}`;
  const mergedVotes = useMemo(
    () =>
      (data.history || []).slice(0, 20).map((item) => ({
        type: item.type,
        ts: item.timestamp,
        sourceLabel: item.sourceLabel,
        sourceCounty: item.sourceCounty,
        sourceCity: item.sourceCity,
        sourceCountyHref: item.sourceCountyHref,
        sourceCityHref: item.sourceCityHref,
        sourceCountyTone: item.sourceCountyTone ?? "neutral",
        sourceCityTone: item.sourceCityTone ?? "neutral",
        weight: item.weight,
      })),
    [data.history]
  );
  const winnerText =
    aggregateMain && data.matrixStatus
      ? data.matrixStatus.text
      : totalCount === 0
        ? "Nincs még szavazat"
        : yesCount === noCount
          ? "Döntetlen"
          : yesCount > noCount
            ? "Az igen vezet"
            : "A nem vezet";

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

  const applyCooldown = (seconds: number) => {
    const normalized = Math.max(0, Number(seconds.toFixed(1)));
    if (normalized <= 0) {
      setCooldownLeft(0);
      try {
        localStorage.removeItem(cooldownStorageKey);
      } catch {
        // ignore localStorage errors
      }
      return;
    }

    const until = Date.now() + normalized * 1000;
    try {
      localStorage.setItem(cooldownStorageKey, String(until));
    } catch {
      // ignore localStorage errors
    }
    setCooldownLeft(normalized);
  };

  useEffect(() => {
    setReturnTo(window.location.pathname + window.location.search + window.location.hash);

    const authError = new URLSearchParams(window.location.search).get("authError");
    if (authError) {
      const authMessages: Record<string, string> = {
        sso_not_configured: "A 3x VOTE belépés még nincs bekapcsolva.",
        oauth_failed: "A Google belépés nem sikerült.",
        invalid_state: "A belépési kérés lejárt vagy érvénytelen.",
        auth_failed: "A Google belépés nem sikerült.",
      };
      setError(authMessages[authError] || "A Google belépés nem sikerült.");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [resultsRes, sessionRes] = await Promise.all([
          fetch(`/api/results?scope=${encodeURIComponent(scope)}${aggregateMain ? "&aggregate=1" : ""}`, {
            cache: "no-store",
          }),
          fetch("/api/auth/session", { cache: "no-store" }),
        ]);

        if (!resultsRes.ok) {
          throw new Error("Nem sikerült betölteni az adatokat.");
        }

        const nextResults = (await resultsRes.json()) as ClickStore;
        setData(nextResults);
        if (typeof nextResults.cooldownSec === "number") {
          applyCooldown(nextResults.cooldownSec);
        }

        if (sessionRes.ok) {
          const nextSession = (await sessionRes.json()) as AuthState;
          setAuth(nextSession);
        }
      } catch {
        setError("Nem sikerült betölteni az adatokat.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [scope, aggregateMain]);

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
    } catch {
      // ignore localStorage errors
    }
  }, [cooldownStorageKey]);

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
        if (next <= 0) {
          try {
            localStorage.removeItem(cooldownStorageKey);
          } catch {
            // ignore localStorage errors
          }
        }
        return next;
      });
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownLeft, cooldownStorageKey]);

  const reloadResults = async () => {
    const refresh = await fetch(`/api/results?scope=${encodeURIComponent(scope)}${aggregateMain ? "&aggregate=1" : ""}`, {
      cache: "no-store",
    });
    if (!refresh.ok) {
      throw new Error("Nem sikerült frissíteni az adatokat.");
    }
    const next = (await refresh.json()) as ClickStore;
    setData(next);
    if (typeof next.cooldownSec === "number") {
      applyCooldown(next.cooldownSec);
    }
  };

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

      const payload = (await res.json().catch(() => null)) as (ClickStore & { error?: string }) | null;
      if (!res.ok) {
        if (typeof payload?.cooldownSec === "number") {
          applyCooldown(payload.cooldownSec);
        }
        throw new Error(payload?.error || "Nem sikerült menteni a szavazatot.");
      }

      if (aggregateMain) {
        await reloadResults();
      } else {
        const next = payload as ClickStore;
        setData(next);
        if (typeof next.cooldownSec === "number") {
          applyCooldown(next.cooldownSec);
        }
      }
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Nem sikerült menteni a szavazatot.");
    } finally {
      setSubmitting(false);
    }
  };

  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
  const voteSuffix = auth.authenticated ? " x3" : "";
  const barTrackStyle = {
    "--yes-width": `${yesPercent}%`,
    "--no-width": `${noPercent}%`,
  } as CSSProperties;

  return (
    <main className="app">
      <PageHero />
      {topActions}
      {heroTitle ? <div className="hero-title">{heroTitle}</div> : null}

      <section className="barometer" aria-label="Vezető opció">
        <p className="barometer-label">{winnerText}</p>
        <div className="bar-track" style={barTrackStyle} role="img" aria-label={`Igen: ${yesCount}, nem: ${noCount}`}>
          <div className="bar-yes" />
          <div className="bar-no" />
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
          {cooldownLeft > 0 ? `igen${voteSuffix} (${cooldownLeft.toFixed(1)}s)` : `igen${voteSuffix}`}
        </button>
        <button
          className="vote-btn vote-btn-no"
          type="button"
          onClick={() => addClick("no")}
          disabled={submitting || loading || cooldownLeft > 0}
        >
          {cooldownLeft > 0 ? `nem${voteSuffix} (${cooldownLeft.toFixed(1)}s)` : `nem${voteSuffix}`}
        </button>
      </div>

      {auth.authenticated && auth.user ? (
        <section className="boost-card" aria-label="3x vote állapot">
          <p className="boost-card-title">3x VOTE aktív</p>
          <p className="boost-card-copy">
            Google belépéssel szavazol. Minden szavazat háromszor számít, és a várakozás csak +0.2 másodperccel nő.
          </p>
          <p className="boost-card-meta">{auth.user.name}</p>
        </section>
      ) : auth.configured ? (
        <section className="boost-card" aria-label="3x vote belépés">
          <p className="boost-card-title">3x VOTE</p>
          <p className="boost-card-copy">
            Lépj be Google fiókkal, és minden szavazatod 3x súllyal számít. A várakozás is lassabban nő.
          </p>
          <a href={loginHref} className="nav-link-button boost-login-button">
            Google belépés a 3x VOTE-hoz
          </a>
        </section>
      ) : (
        <section className="boost-card boost-card-muted" aria-label="3x vote állapot">
          <p className="boost-card-title">3x VOTE</p>
          <p className="boost-card-copy">A Google belépés még nincs bekapcsolva ehhez az oldalhoz.</p>
        </section>
      )}

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
                <span className={`vote-pill ${item.type === "yes" ? "vote-pill-yes" : "vote-pill-no"}`}>
                  {item.type === "yes" ? "igen" : "nem"}
                </span>
                {item.weight > 1 ? <span className="weight-pill">x{item.weight}</span> : null}
                <span>
                  {formatter.format(new Date(item.ts))}
                  {item.sourceCounty ? " - " : ""}
                  {item.sourceCounty ? (
                    item.sourceCountyHref ? (
                      <a
                        href={item.sourceCountyHref}
                        className={`history-chip history-chip-${item.sourceCountyTone}`}
                        aria-label={`${item.sourceCounty} oldal`}
                      >
                        {item.sourceCounty}
                      </a>
                    ) : (
                      <span className={`history-chip history-chip-${item.sourceCountyTone}`}>{item.sourceCounty}</span>
                    )
                  ) : null}
                  {item.sourceCity ? (
                    <>
                      {" "}
                      {item.sourceCityHref ? (
                        <a
                          href={item.sourceCityHref}
                          className={`history-chip history-chip-${item.sourceCityTone}`}
                          aria-label={`${item.sourceCity} oldal`}
                        >
                          {item.sourceCity}
                        </a>
                      ) : (
                        <span className={`history-chip history-chip-${item.sourceCityTone}`}>{item.sourceCity}</span>
                      )}
                    </>
                  ) : null}
                  {!item.sourceCounty && item.sourceLabel ? ` - ${item.sourceLabel}` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      {auth.authenticated ? (
        <div className="logout-strip">
          <a href={logoutHref} className="nav-link-button nav-link-button-small nav-link-button-secondary">
            kijelentkezés
          </a>
        </div>
      ) : null}
    </main>
  );
}
