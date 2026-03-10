"use client";

import { useEffect, useState } from "react";

type ConsentState = "granted" | "denied";

const STORAGE_KEY = "kv-consent-v1";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function updateConsent(state: ConsentState) {
  const granted = state === "granted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: granted,
    analytics_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
  });
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    if (!saved) {
      setVisible(true);
      return;
    }

    updateConsent(saved);
  }, []);

  const handleChoice = (choice: ConsentState) => {
    localStorage.setItem(STORAGE_KEY, choice);
    updateConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="consent-banner" role="dialog" aria-label="Hozzájárulás kezelése">
      <p className="consent-text">
        Az EGT szabályok szerint engedélyezheted vagy elutasíthatod a mérési és személyre szabott hirdetési sütiket.
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-btn consent-btn-deny" onClick={() => handleChoice("denied")}>
          Elutasítás
        </button>
        <button
          type="button"
          className="consent-btn consent-btn-accept"
          onClick={() => handleChoice("granted")}
        >
          Elfogadás
        </button>
      </div>
    </div>
  );
}
