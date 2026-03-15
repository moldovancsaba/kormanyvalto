"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type BlocCityItem = {
  city: string;
  county: string;
  districtLabel: string;
  href: string;
  yes: number;
  no: number;
  total: number;
  diff: number;
  diffPercent: number;
  leadBloc: "yes" | "no" | "neutral";
};

type CityBlocGridClientProps = {
  bloc: "yes" | "no";
  title: string;
  subtitle: string;
  initialItems: BlocCityItem[];
  initialHasMore: boolean;
};

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1).replace(".", ",")}%`;
}

export default function CityBlocGridClient({
  bloc,
  title,
  subtitle,
  initialItems,
  initialHasMore,
}: CityBlocGridClientProps) {
  const [items, setItems] = useState<BlocCityItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const canLoad = useMemo(() => hasMore && !loading, [hasMore, loading]);

  useEffect(() => {
    if (!canLoad) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setLoading(true);
        fetch(`/api/city-cards?bloc=${bloc}&offset=${items.length}&limit=10`, { cache: "no-store" })
          .then(async (res) => {
            const payload = (await res.json()) as { items?: BlocCityItem[]; hasMore?: boolean; error?: string };
            if (!res.ok) throw new Error(payload.error || "Nem sikerült betölteni a következő elemeket.");
            setItems((prev) => [...prev, ...(payload.items ?? [])]);
            setHasMore(Boolean(payload.hasMore));
            setError(null);
          })
          .catch(() => {
            setError("Nem sikerült betölteni a következő elemeket.");
          })
          .finally(() => {
            setLoading(false);
          });
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [bloc, canLoad, items.length]);

  return (
    <section className="preview-visual-card">
      <header className="chart-card-head">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      <div className="preview-trading-grid" role="list" aria-label={title}>
        {items.map((item, index) => (
          <article key={`${item.href}-${index}`} className={`preview-trading-card preview-trading-card-${item.leadBloc}`} role="listitem">
            <header className="preview-trading-card-head">
              <h3>
                <Link href={item.href} className={`preview-ranking-chip preview-ranking-chip-title preview-ranking-chip-${item.leadBloc}`}>
                  {item.city}
                </Link>
              </h3>
              <p>
                {item.county} · {item.districtLabel}
              </p>
            </header>
            <div className="preview-trading-card-props">
              <p>Különbség: {item.diff}</p>
              <p>Eltérés: {formatPercent(item.diffPercent)}</p>
              <p>{item.total} szavazat</p>
            </div>
            <svg viewBox="0 0 100 10" className="preview-ranking-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <rect x="0" y="0" width="100" height="10" className="preview-ranking-track" />
              <rect x="0" y="0" width={Math.max(8, Math.abs(item.diffPercent))} height="10" className={`preview-card-bar preview-card-bar-${item.leadBloc}`} />
            </svg>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-hidden="true" />
      {loading ? <p className="infinite-scroll-status">Betöltés...</p> : null}
      {!hasMore ? <p className="infinite-scroll-status">A lista vége.</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}

