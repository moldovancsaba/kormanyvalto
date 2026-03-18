import Link from "next/link";
import type { ReactNode } from "react";
import { getHungaryCountyMapData } from "../../lib/hungaryCountyMap";
import { formatAbsolutePercent } from "../../lib/numberFormat";
import { getSvgPathBounds } from "../../lib/svgPath";

type CityRankingItem = {
  city: string;
  county: string;
  countyCode: string;
  countyHref: string;
  countyLeadBloc: "yes" | "no" | "neutral";
  districtLabel: string;
  href: string;
  totalVotes: number;
  marginPercent: number;
  leadBloc: "yes" | "no" | "neutral";
  indicatorDistance?: number;
};

type CityRankingCardProps = {
  title: ReactNode;
  subtitle: string;
  emptyText: string;
  items: CityRankingItem[];
  mode: "closest" | "strongest" | "indicator" | "activity-low" | "activity-high";
  nationalYesPercent?: number;
};

function getBlocLabel(leadBloc: CityRankingItem["leadBloc"]): string {
  if (leadBloc === "yes") return "igen";
  if (leadBloc === "no") return "nem";
  return "döntetlen";
}

function CountyShapeStamp({
  countyCode,
  leadBloc,
}: {
  countyCode: string;
  leadBloc: "yes" | "no" | "neutral";
}) {
  const countyMap = getHungaryCountyMapData();
  const county = countyMap.counties.find((item) => item.countyCode === countyCode);
  if (!county) {
    return <div className="preview-card-stamp-fallback">{countyCode}</div>;
  }

  const bounds = getSvgPathBounds(county.pathData);
  const pad = 8;
  const viewBox = `${bounds.minX - pad} ${bounds.minY - pad} ${bounds.width + pad * 2} ${bounds.height + pad * 2}`;

  return (
    <svg viewBox={viewBox} className="preview-card-stamp-svg" aria-hidden="true" focusable="false">
      <path d={county.pathData} className={`preview-card-stamp-shape preview-card-stamp-shape-${leadBloc}`} />
    </svg>
  );
}

export function CityRankingCard({ title, subtitle, emptyText, items, mode, nationalYesPercent }: CityRankingCardProps) {
  const maxMagnitude = Math.max(1, ...items.map((item) => Math.abs(item.marginPercent)));
  const maxTotalVotes = Math.max(1, ...items.map((item) => item.totalVotes));
  const maxIndicatorDistance = Math.max(1, ...items.map((item) => item.indicatorDistance ?? 0));

  return (
    <section className="preview-visual-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="chart-empty">{emptyText}</p>
      ) : (
        <div className="preview-trading-grid" role="list" aria-label={typeof title === "string" ? title : "Városi rangsor"}>
          {items.map((item, index) => {
            const normalizedPercent =
              mode === "closest"
                ? (maxMagnitude - Math.abs(item.marginPercent)) / maxMagnitude
                : mode === "indicator"
                  ? (maxIndicatorDistance - (item.indicatorDistance ?? 0)) / maxIndicatorDistance
                : mode === "activity-low"
                  ? (maxTotalVotes - item.totalVotes) / maxTotalVotes
                  : mode === "activity-high"
                    ? item.totalVotes / maxTotalVotes
                : Math.abs(item.marginPercent) / maxMagnitude;
            const barPercent = Math.max(8, normalizedPercent * 100);

            return (
              <article key={`${item.href}-${index}`} className={`preview-trading-card preview-trading-card-${item.leadBloc}`} role="listitem">
                <header className="preview-trading-card-head">
                  <h3>
                    <Link href={item.href} className={`preview-ranking-chip preview-ranking-chip-title preview-ranking-chip-${item.leadBloc}`}>
                      {item.city}
                    </Link>
                  </h3>
                  <Link href={item.countyHref} className={`preview-ranking-chip preview-ranking-chip-${item.countyLeadBloc}`}>
                    {item.county}
                  </Link>
                  <p>{item.districtLabel}</p>
                </header>

                <div className="preview-trading-card-media">
                  <CountyShapeStamp countyCode={item.countyCode} leadBloc={item.countyLeadBloc} />
                </div>

                <div className="preview-trading-card-props">
                  <p>Vármegye: {getBlocLabel(item.countyLeadBloc)}</p>
                  <p>EVK: {getBlocLabel(item.leadBloc)}</p>
                  {mode === "indicator" ? (
                    <>
                      <p>Országos igen: {(nationalYesPercent ?? 50).toFixed(1).replace(".", ",")}%</p>
                      <p>Helyi eltérés: {formatAbsolutePercent(item.indicatorDistance ?? 0)}</p>
                      <p>Mintaszám: {item.totalVotes} szavazat</p>
                    </>
                  ) : null}
                  {mode === "indicator" ? null : mode === "activity-low" || mode === "activity-high" ? (
                    <>
                      <p>{item.totalVotes} szavazat</p>
                      <p>Eltérés: {formatAbsolutePercent(item.marginPercent)}</p>
                    </>
                  ) : (
                    <>
                      <p>{formatAbsolutePercent(item.marginPercent)}</p>
                      <p>{item.totalVotes} szavazat</p>
                    </>
                  )}
                </div>

                <svg viewBox="0 0 100 10" className="preview-ranking-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <rect x="0" y="0" width="100" height="10" className="preview-ranking-track" />
                  <rect x="0" y="0" width={barPercent} height="10" className={`preview-card-bar preview-card-bar-${item.leadBloc}`} />
                </svg>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
