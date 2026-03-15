import Link from "next/link";

type CityRankingItem = {
  city: string;
  county: string;
  districtLabel: string;
  href: string;
  totalVotes: number;
  marginPercent: number;
  leadBloc: "yes" | "no" | "neutral";
};

type CityRankingCardProps = {
  title: string;
  subtitle: string;
  emptyText: string;
  items: CityRankingItem[];
  mode: "closest" | "strongest";
};

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1).replace(".", ",")}%`;
}

function getBlocLabel(leadBloc: CityRankingItem["leadBloc"]): string {
  if (leadBloc === "yes") return "igen";
  if (leadBloc === "no") return "nem";
  return "döntetlen";
}

export function CityRankingCard({ title, subtitle, emptyText, items, mode }: CityRankingCardProps) {
  const maxMagnitude = Math.max(1, ...items.map((item) => Math.abs(item.marginPercent)));

  return (
    <section className="preview-visual-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="chart-empty">{emptyText}</p>
      ) : (
        <div className="preview-ranking-list" role="list" aria-label={title}>
          {items.map((item, index) => {
            const normalizedPercent = mode === "closest" ? (maxMagnitude - Math.abs(item.marginPercent)) / maxMagnitude : Math.abs(item.marginPercent) / maxMagnitude;
            const barPercent = Math.max(8, normalizedPercent * 100);
            const toneClass = item.leadBloc === "yes" ? "preview-tone-yes" : item.leadBloc === "no" ? "preview-tone-no" : "preview-tone-neutral";

            return (
              <Link key={`${item.href}-${index}`} href={item.href} className="preview-ranking-item" role="listitem">
                <div className="preview-ranking-meta">
                  <strong>{item.city}</strong>
                  <span>{item.county} · {item.districtLabel}</span>
                </div>
                <div className="preview-ranking-values">
                  <span className="preview-ranking-chip">{getBlocLabel(item.leadBloc)}</span>
                  <span className="preview-ranking-chip">{formatPercent(item.marginPercent)}</span>
                  <span className="preview-ranking-chip">{item.totalVotes} szavazat</span>
                </div>
                <svg viewBox="0 0 100 10" className="preview-ranking-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <rect x="0" y="0" width="100" height="10" className="preview-ranking-track" />
                  <rect x="0" y="0" width={barPercent} height="10" className={toneClass} />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
