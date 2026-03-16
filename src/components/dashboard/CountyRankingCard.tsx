import Link from "next/link";
import { getHungaryCountyMapData } from "../../lib/hungaryCountyMap";
import { formatAbsolutePercent } from "../../lib/numberFormat";
import { getSvgPathBounds } from "../../lib/svgPath";

type CountyRankingItem = {
  countyName: string;
  countyCode: string;
  href: string;
  totalVotes: number;
  marginPercent: number;
  leadBloc: "yes" | "no" | "neutral";
};

type CountyRankingCardProps = {
  title: string;
  subtitle: string;
  emptyText: string;
  items: CountyRankingItem[];
  mode: "activity" | "balance";
};

function getBlocLabel(leadBloc: CountyRankingItem["leadBloc"]): string {
  if (leadBloc === "yes") return "igen";
  if (leadBloc === "no") return "nem";
  return "döntetlen";
}

function CountyShapeStamp({ countyCode, leadBloc }: { countyCode: string; leadBloc: "yes" | "no" | "neutral" }) {
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

export function CountyRankingCard({ title, subtitle, emptyText, items, mode }: CountyRankingCardProps) {
  const maxTotalVotes = Math.max(1, ...items.map((item) => item.totalVotes));
  const maxMarginPercent = Math.max(1, ...items.map((item) => Math.abs(item.marginPercent)));

  return (
    <section className="preview-visual-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="chart-empty">{emptyText}</p>
      ) : (
        <div className="preview-trading-grid" role="list" aria-label={title}>
          {items.map((item, index) => {
            const barPercent =
              mode === "activity"
                ? Math.max(8, (item.totalVotes / maxTotalVotes) * 100)
                : Math.max(8, ((maxMarginPercent - Math.abs(item.marginPercent)) / maxMarginPercent) * 100);

            return (
              <article key={`${item.countyCode}-${index}`} className={`preview-trading-card preview-trading-card-${item.leadBloc}`} role="listitem">
                <header className="preview-trading-card-head">
                  <h3>
                    <Link href={item.href} className={`preview-ranking-chip preview-ranking-chip-title preview-ranking-chip-${item.leadBloc}`}>
                      {item.countyName}
                    </Link>
                  </h3>
                </header>

                <div className="preview-trading-card-media">
                  <CountyShapeStamp countyCode={item.countyCode} leadBloc={item.leadBloc} />
                </div>

                <div className="preview-trading-card-props">
                  <p>{getBlocLabel(item.leadBloc)}</p>
                  <p>{formatAbsolutePercent(item.marginPercent)}</p>
                  <p>{item.totalVotes} szavazat</p>
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
