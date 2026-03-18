"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { LeadOverviewCard } from "./dashboard/LeadOverviewCard";

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
  hero?: ReactNode;
  topActions?: ReactNode;
  pageIntro?: ReactNode;
  showDefaultHeading?: boolean;
};

const defaultAuthState: AuthState = {
  configured: false,
  authenticated: false,
  user: null,
};

function toUserFacingErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  if (message === "Load failed" || message === "Failed to fetch") {
    return fallback;
  }

  return message;
}

export default function VoteWidget({
  scope,
  aggregateMain = false,
  hero,
  topActions,
  pageIntro,
  showDefaultHeading = true,
}: VoteWidgetProps) {
  const [data, setData] = useState<ClickStore>({ yesCount: 0, noCount: 0, history: [] });
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashVote, setFlashVote] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [nextCooldownSec, setNextCooldownSec] = useState(1);
  const [returnTo, setReturnTo] = useState("/");
  const yesCount = data.yesCount;
  const noCount = data.noCount;
  const totalCount = yesCount + noCount;
  const yesPercent = totalCount === 0 ? 50 : (yesCount / totalCount) * 100;
  const noPercent = totalCount === 0 ? 50 : (noCount / totalCount) * 100;
  const marginVotes = Math.abs(yesCount - noCount);
  const marginPercent = totalCount === 0 ? 0 : (marginVotes / totalCount) * 100;
  const cooldownStorageKey = `kv-cooldown-until:${scope}`;
  const voteCooldownStep = auth.authenticated ? 0.2 : 1;
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

  const loadResults = async () => {
    const resultsRes = await fetch(`/api/results?scope=${encodeURIComponent(scope)}${aggregateMain ? "&aggregate=1" : ""}`, {
      cache: "no-store",
    });
    if (!resultsRes.ok) {
      throw new Error("Nem sikerült betölteni az adatokat.");
    }

    const nextResults = (await resultsRes.json()) as ClickStore;
    setData(nextResults);
    if (typeof nextResults.cooldownSec === "number") {
      applyCooldown(nextResults.cooldownSec);
    }
  };

  const loadAuthSession = async () => {
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    if (!sessionRes.ok) {
      throw new Error("Nem sikerült betölteni a belépési állapotot.");
    }

    const nextSession = (await sessionRes.json()) as AuthState;
    setAuth(nextSession);
  };

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

  const clearCooldown = () => {
    setCooldownLeft(0);
    try {
      localStorage.removeItem(cooldownStorageKey);
    } catch {
      // ignore localStorage errors
    }
  };

  // Warm the vote route and fetch the predicted next cooldown so the first
  // click can move directly from the temporary `szavaztál` state into the
  // countdown label without a visible plain-label gap.
  useEffect(() => {
    const warmVoteAction = async () => {
      try {
        const response = await fetch(`/api/vote?scope=${encodeURIComponent(scope)}`, {
          method: "HEAD",
          cache: "no-store",
        });
        const headerValue = Number(response.headers.get("X-Next-Cooldown-Sec"));
        if (!Number.isNaN(headerValue) && headerValue > 0) {
          setNextCooldownSec(headerValue);
        }
      } catch {
        // Ignore warmup errors.
      }
    };

    const idle = window.setTimeout(() => {
      void warmVoteAction();
    }, 250);

    return () => {
      window.clearTimeout(idle);
    };
  }, [scope]);

  useEffect(() => {
    setReturnTo(window.location.pathname + window.location.search + window.location.hash);

    const authError = new URLSearchParams(window.location.search).get("authError");
    if (authError) {
    const authMessages: Record<string, string> = {
        sso_not_configured: "A 3x VOTE belépés még nincs bekapcsolva. Anonim módban továbbra is tudsz szavazni.",
        oauth_failed: "A Google belépés most nem sikerült. Szavazhatsz tovább anonim módban, vagy próbáld újra.",
        invalid_state: "A belépési kérés lejárt vagy érvénytelen. Szavazhatsz anonim módban, vagy indíts új belépést.",
        auth_failed: "A Google belépés most nem sikerült. Szavazhatsz tovább anonim módban, vagy próbáld újra.",
      };
      setError(authMessages[authError] || "A Google belépés nem sikerült.");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await loadResults();
      } catch {
        setError("Nem sikerült betölteni az adatokat.");
      } finally {
        setLoading(false);
      }

      loadAuthSession().catch(() => undefined);
    };

    void load();
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
    try {
      await loadResults();
      setError(null);
    } catch {
      throw new Error("Nem sikerült frissíteni az adatokat.");
    }
  };

  const retryResultsLoad = async () => {
    setError(null);
    try {
      await reloadResults();
    } catch (retryError) {
      setError(toUserFacingErrorMessage(retryError, "Nem sikerült frissíteni az adatokat."));
    }
  };

  const addClick = async (type: "yes" | "no") => {
    if (submitting || loading || cooldownLeft > 0) return;

    setSubmitting(true);
    setError(null);
    setFlashVote(type);
    // Start the predicted cooldown immediately so the countdown is already
    // active while the temporary success flash is still visible.
    applyCooldown(nextCooldownSec);
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });

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
        if (payload) {
          setData(payload);
        }
        if (typeof payload?.cooldownSec === "number") {
          applyCooldown(payload.cooldownSec);
          setNextCooldownSec(Number((payload.cooldownSec + voteCooldownStep).toFixed(1)));
        }
        try {
          await reloadResults();
        } catch {
          setError("A szavazat mentve lett, de az összesítés frissítése most nem sikerült.");
        }
      } else {
        const next = payload as ClickStore;
        setData(next);
        if (typeof next.cooldownSec === "number") {
          applyCooldown(next.cooldownSec);
          setNextCooldownSec(Number((next.cooldownSec + voteCooldownStep).toFixed(1)));
        }
      }
    } catch (voteError) {
      clearCooldown();
      setFlashVote(null);
      setError(toUserFacingErrorMessage(voteError, "Nem sikerült menteni a szavazatot."));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!flashVote) return;
    const timer = window.setTimeout(() => {
      setFlashVote(null);
    }, 720);
    return () => window.clearTimeout(timer);
  }, [flashVote]);

  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
  const voteSuffix = auth.authenticated ? " x3" : "";
  const yesButtonLabel =
    flashVote === "yes"
      ? "szavaztál"
      : cooldownLeft > 0
        ? `igen${voteSuffix} (${cooldownLeft.toFixed(1)}s)`
        : `igen${voteSuffix}`;
  const noButtonLabel =
    flashVote === "no"
      ? "szavaztál"
      : cooldownLeft > 0
        ? `nem${voteSuffix} (${cooldownLeft.toFixed(1)}s)`
        : `nem${voteSuffix}`;

  return (
    <main className="app">
      {hero}
      {topActions}
      {pageIntro}

      {aggregateMain ? (
        <LeadOverviewCard
          className="home-lead-card"
          statusText={winnerText}
          marginVotes={marginVotes}
          marginPercent={marginPercent}
          yesCount={yesCount}
          noCount={noCount}
          yesPercent={yesPercent}
          noPercent={noPercent}
          yesHref="/dashboard/igen"
          noHref="/dashboard/nem"
        />
      ) : (
        <section className="barometer" aria-label="Vezető opció">
          <p className="barometer-label">{winnerText}</p>
          <div className="bar-track" role="img" aria-label={`Igen: ${yesCount}, nem: ${noCount}`}>
            <svg viewBox="0 0 100 10" className="bar-track-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <rect x="0" y="0" width="100" height="10" className="bar-no" />
              <rect x="0" y="0" width={yesPercent} height="10" className="bar-yes" />
            </svg>
          </div>
          <p className="barometer-stats">
            igen: {yesCount} | nem: {noCount}
          </p>
        </section>
      )}

      {showDefaultHeading ? (
        <h1>
          Váltani akarsz? Vagy nem?
          <br />
          Egyszerű kérdés. Egyszerű válasz?
        </h1>
      ) : null}

      {error ? (
        <div className="status-stack" role="status" aria-live="polite">
          <p className="error">{error}</p>
          {error.includes("betölteni") || error.includes("frissítése") ? (
            <button type="button" className="nav-link-button nav-link-button-small nav-link-button-secondary" onClick={() => void retryResultsLoad()}>
              Újrapróbálás
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="buttons" aria-label="Válasz gombok">
        <button
          className={`vote-btn vote-btn-yes${flashVote === "yes" ? " vote-btn-flash vote-btn-flash-yes" : ""}`}
          type="button"
          onClick={() => addClick("yes")}
          disabled={submitting || loading || cooldownLeft > 0}
        >
          {yesButtonLabel}
        </button>
        <button
          className={`vote-btn vote-btn-no${flashVote === "no" ? " vote-btn-flash vote-btn-flash-no" : ""}`}
          type="button"
          onClick={() => addClick("no")}
          disabled={submitting || loading || cooldownLeft > 0}
        >
          {noButtonLabel}
        </button>
      </div>

      {auth.authenticated && auth.user ? (
        <section className="boost-card" aria-label="3x vote állapot">
          <p className="boost-card-title">3x VOTE aktív</p>
          <p className="boost-card-copy">Google-belépéssel erősített mód. Az anonim szavazás ettől függetlenül továbbra is elérhető.</p>
          <p className="boost-card-meta">Belépve: {auth.user.name}</p>
          <div className="boost-fact-grid" aria-label="3x vote előnyök">
            <article className="boost-fact-card">
              <p className="boost-fact-label">Mit kapsz</p>
              <p className="boost-fact-value">Minden szavazatod 3x súllyal számít.</p>
            </article>
            <article className="boost-fact-card">
              <p className="boost-fact-label">Cooldown</p>
              <p className="boost-fact-value">A várakozás csak +0.2 másodperccel nő.</p>
            </article>
            <article className="boost-fact-card">
              <p className="boost-fact-label">Mit nem tárolunk</p>
              <p className="boost-fact-value">A Google-fiókod adatait nem használjuk külön célra vagy marketinghez.</p>
            </article>
          </div>
        </section>
      ) : auth.configured ? (
        <section className="boost-card boost-card-warning" aria-label="3x vote belépés">
          <p className="boost-card-title">3x VOTE elérhető</p>
          <p className="boost-privacy-strong">Az anonim szavazás most is működik. A Google-belépés csak a 3x VOTE bónusz módhoz kell.</p>

          <div className="boost-fact-grid" aria-label="3x vote tudnivalók">
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Mit kapsz</p>
              <p className="boost-fact-value">3x súlyú szavazatot és lassabban növekvő cooldown-t.</p>
            </article>
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Mit használunk</p>
              <p className="boost-fact-value">Csak a belépési igazolást arra, hogy valódi felhasználó szavaz.</p>
            </article>
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Mit nem tárolunk</p>
              <p className="boost-fact-value">Nem mentjük el a Google-fiókod adatait külön célra vagy marketinghez.</p>
            </article>
          </div>

          <a href={loginHref} className="nav-link-button boost-login-button boost-login-button-warning">
            <span className="material-symbols-rounded" aria-hidden="true">
              release_alert
            </span>
            <span>Google-belépés a 3x VOTE-hoz</span>
          </a>
        </section>
      ) : (
        <section className="boost-card boost-card-muted" aria-label="3x vote állapot">
          <p className="boost-card-title">3x VOTE</p>
          <p className="boost-card-copy">A Google belépés még nincs bekapcsolva ehhez az oldalhoz, de anonim módban ugyanúgy tudsz szavazni.</p>
          <div className="boost-fact-grid" aria-label="3x vote állapot">
            <article className="boost-fact-card">
              <p className="boost-fact-label">Jelenlegi mód</p>
              <p className="boost-fact-value">Normál anonim szavazás aktív.</p>
            </article>
          </div>
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
