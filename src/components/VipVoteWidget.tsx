"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

type ClickStore = {
  yesCount: number;
  noCount: number;
  cooldownSec?: number;
  vipWeight?: number;
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
    mode?: string;
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

type VipVoteWidgetProps = {
  scope: string;
  hero?: ReactNode;
  topActions?: ReactNode;
  pageIntro?: ReactNode;
};

export default function VipVoteWidget({ scope, hero, topActions, pageIntro }: VipVoteWidgetProps) {
  const [data, setData] = useState<ClickStore>({ yesCount: 0, noCount: 0, history: [] });
  const [auth, setAuth] = useState<AuthState>({ configured: false, authenticated: false, user: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashVote, setFlashVote] = useState<"yes" | "no" | null>(null);
  const [flashWeight, setFlashWeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [returnTo, setReturnTo] = useState("/vip");
  const [nickname, setNickname] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);

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
    const res = await fetch(`/api/results?scope=${encodeURIComponent(scope)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Nem sikerült betölteni az adatokat.");
    const nextResults = (await res.json()) as ClickStore;
    setData(nextResults);
  };

  const loadAuthSession = async () => {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return;
    const session = (await res.json()) as AuthState;
    setAuth(session);
  };

  const loadNickname = async () => {
    const res = await fetch("/api/nickname", { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    if (body.nickname) {
      setNickname(body.nickname);
      setNicknameInput(body.nickname);
    }
  };

  const applyCooldown = (seconds: number) => {
    const normalized = Math.max(0, Number(seconds.toFixed(1)));
    if (normalized <= 0) {
      setCooldownLeft(0);
      return;
    }
    setCooldownLeft(normalized);
  };

  useEffect(() => {
    setReturnTo(window.location.pathname + window.location.search + window.location.hash);

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
  }, [scope]);

  useEffect(() => {
    if (auth.authenticated) {
      loadNickname().catch(() => undefined);
    }
  }, [auth.authenticated]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((prev) => Math.max(0, Number((prev - 0.1).toFixed(1))));
    }, 100);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  useEffect(() => {
    if (!flashVote) return;
    const timer = window.setTimeout(() => {
      setFlashVote(null);
      setFlashWeight(null);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [flashVote]);

  const addClick = async (type: "yes" | "no") => {
    if (submitting || loading || cooldownLeft > 0 || !auth.authenticated) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, scope, vip: true }),
      });

      const payload = (await res.json().catch(() => null)) as (ClickStore & { error?: string; vipWeight?: number }) | null;
      if (!res.ok) {
        throw new Error(payload?.error || "Nem sikerült menteni a szavazatot.");
      }

      const weight = payload?.vipWeight ?? 1;
      const cd = payload?.cooldownSec ?? 1;

      setFlashVote(type);
      setFlashWeight(weight);
      applyCooldown(cd);

      await loadResults().catch(() => undefined);
    } catch (voteError) {
      setFlashVote(null);
      setFlashWeight(null);
      setError(voteError instanceof Error ? voteError.message : "Nem sikerült menteni a szavazatot.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveNickname = async () => {
    if (nicknameSaving) return;
    const cleaned = nicknameInput.trim().slice(0, 24);
    if (cleaned.length < 2) {
      setError("A becenév legalább 2 karakter legyen.");
      return;
    }
    setNicknameSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: cleaned }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Nem sikerült menteni a becenevet.");
      }
      setNickname(cleaned);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nem sikerült menteni a becenevet.");
    } finally {
      setNicknameSaving(false);
    }
  };

  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  const vipHref = (href: string | undefined) => {
    if (!href) return undefined;
    if (href.startsWith("/vip")) return href;
    if (href.startsWith("/")) return `/vip${href}`;
    return href;
  };

  const flashLabel = flashVote && flashWeight ? `VIP ${flashVote === "yes" ? "igen" : "nem"} x${flashWeight}` : null;

  const yesButtonLabel =
    flashVote === "yes" && flashLabel
      ? flashLabel
      : cooldownLeft > 0
        ? `VIP igen (${cooldownLeft.toFixed(1)}s)`
        : "VIP igen";
  const noButtonLabel =
    flashVote === "no" && flashLabel
      ? flashLabel
      : cooldownLeft > 0
        ? `VIP nem (${cooldownLeft.toFixed(1)}s)`
        : "VIP nem";

  return (
    <main className="app vip-app">
      {hero}
      {topActions}
      {pageIntro}

      {!auth.configured ? (
        <section className="boost-card boost-card-muted" aria-label="VIP belépés">
          <p className="boost-card-title">VIP VOTE</p>
          <p className="boost-card-copy">A Google belépés még nincs bekapcsolva. A VIP szavazáshoz Google belépés szükséges.</p>
        </section>
      ) : !auth.authenticated ? (
        <section className="boost-card boost-card-warning" aria-label="VIP belépés">
          <p className="boost-card-title">VIP VOTE</p>
          <p className="boost-privacy-strong">
            A VIP szavazáshoz Google belépés szükséges. Minden szavazatod 1x-7x véletlen súllyal számít, és 1-7 másodperces véletlen cooldown-t kapsz!
          </p>
          <div className="boost-fact-grid" aria-label="VIP tudnivalók">
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Szavazati súly</p>
              <p className="boost-fact-value">1x - 7x véletlen minden szavazatnál</p>
            </article>
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Cooldown</p>
              <p className="boost-fact-value">1 - 7 másodperc véletlen</p>
            </article>
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Ranglista</p>
              <p className="boost-fact-value">Állíts be egy becenevet és versenyezz!</p>
            </article>
          </div>
          <a href={loginHref} className="nav-link-button boost-login-button boost-login-button-warning">
            <span className="material-symbols-rounded" aria-hidden="true">release_alert</span>
            <span>Google-belépés a VIP VOTE-hoz</span>
          </a>
        </section>
      ) : (
        <>
          <section className="boost-card boost-card-vip" aria-label="VIP állapot">
            <p className="boost-card-title">VIP VOTE AKTÍV</p>
            <p className="boost-card-copy">
              VIP módban minden szavazatod 1x-7x véletlen súllyal számít, és 1-7 másodperces véletlen cooldown-t kapsz.
            </p>
            <p className="boost-card-meta">Belépve: {auth.user?.name}</p>
          </section>

          <section className="vip-nickname-section" aria-label="Becenév beállítása">
            <h2>Becenév a ranglistához</h2>
            {nickname ? (
              <div className="vip-nickname-display">
                <p className="vip-nickname-value">{nickname}</p>
                <div className="vip-nickname-edit">
                  <input
                    type="text"
                    className="vip-nickname-input"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value.slice(0, 24))}
                    maxLength={24}
                    placeholder="Új becenév"
                  />
                  <button type="button" className="nav-link-button nav-link-button-small" onClick={() => void saveNickname()} disabled={nicknameSaving}>
                    {nicknameSaving ? "Mentés..." : "Módosítás"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="vip-nickname-edit">
                <input
                  type="text"
                  className="vip-nickname-input"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value.slice(0, 24))}
                  maxLength={24}
                  placeholder="Adj meg egy becenevet"
                />
                <button type="button" className="nav-link-button nav-link-button-small" onClick={() => void saveNickname()} disabled={nicknameSaving}>
                  {nicknameSaving ? "Mentés..." : "Mentés"}
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {error ? (
        <div className="status-stack" role="status" aria-live="polite">
          <p className="error">{error}</p>
        </div>
      ) : null}

      {auth.authenticated ? (
        <>
          <section className="barometer vip-barometer" aria-label="VIP eredmény">
            <p className="barometer-label">
              {data.yesCount + data.noCount === 0
                ? "Nincs még szavazat"
                : data.yesCount === data.noCount
                  ? "Döntetlen"
                  : data.yesCount > data.noCount
                    ? "Az igen vezet"
                    : "A nem vezet"}
            </p>
            <div className="bar-track" role="img" aria-label={`Igen: ${data.yesCount}, nem: ${data.noCount}`}>
              <svg viewBox="0 0 100 10" className="bar-track-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <rect x="0" y="0" width="100" height="10" className="bar-no" />
                <rect
                  x="0"
                  y="0"
                  width={data.yesCount + data.noCount === 0 ? 50 : (data.yesCount / (data.yesCount + data.noCount)) * 100}
                  height="10"
                  className="bar-yes"
                />
              </svg>
            </div>
            <p className="barometer-stats">
              igen: {data.yesCount} | nem: {data.noCount}
            </p>
          </section>

          <div className="buttons" aria-label="VIP válasz gombok">
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

          <section className="timeline" aria-label="Utolsó VIP szavazatok">
            <h2>Utolsó szavazatok</h2>
            <ul>
              {loading ? (
                <li className="empty">Betöltés...</li>
              ) : (data.history || []).length === 0 ? (
                <li className="empty">Nincs kattintás.</li>
              ) : (
                (data.history || []).slice(0, 20).map((item, idx) => (
                  <li key={`${item.timestamp}-${idx}`} className="timeline-item">
                    <span className={`vote-pill ${item.type === "yes" ? "vote-pill-yes" : "vote-pill-no"}`}>
                      {item.type === "yes" ? "igen" : "nem"}
                    </span>
                    {item.mode === "vip" ? (
                      <span className="weight-pill weight-pill-vip">VIP x{item.weight}</span>
                    ) : item.weight > 1 ? (
                      <span className="weight-pill">x{item.weight}</span>
                    ) : null}
                    <span>
                      {formatter.format(new Date(item.timestamp))}
                      {item.sourceCounty ? " - " : ""}
                      {item.sourceCounty ? (
                        item.sourceCountyHref ? (
                          <a
                            href={vipHref(item.sourceCountyHref)}
                            className={`history-chip history-chip-${item.sourceCountyTone ?? "neutral"}`}
                            aria-label={`${item.sourceCounty} oldal`}
                          >
                            {item.sourceCounty}
                          </a>
                        ) : (
                          <span className={`history-chip history-chip-${item.sourceCountyTone ?? "neutral"}`}>{item.sourceCounty}</span>
                        )
                      ) : null}
                      {item.sourceCity ? (
                        <>
                          {" "}
                          {item.sourceCityHref ? (
                            <a
                              href={vipHref(item.sourceCityHref)}
                              className={`history-chip history-chip-${item.sourceCityTone ?? "neutral"}`}
                              aria-label={`${item.sourceCity} oldal`}
                            >
                              {item.sourceCity}
                            </a>
                          ) : (
                            <span className={`history-chip history-chip-${item.sourceCityTone ?? "neutral"}`}>{item.sourceCity}</span>
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
        </>
      ) : null}

      {auth.authenticated ? (
        <div className="vip-leaderboard-link-strip">
          <a href="/vip/ranglistak" className="nav-link-button">
            <span className="material-symbols-rounded" aria-hidden="true">leaderboard</span>
            <span>VIP ranglisták megtekintése</span>
          </a>
        </div>
      ) : null}

      {auth.authenticated ? (
        <div className="logout-strip">
          <a href={`/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`} className="nav-link-button nav-link-button-small nav-link-button-secondary">
            kijelentkezés
          </a>
        </div>
      ) : null}
    </main>
  );
}
