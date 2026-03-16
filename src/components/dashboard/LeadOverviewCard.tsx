import Link from "next/link";
import { formatNumber, formatPercent } from "../../lib/numberFormat";

type LeadOverviewCardProps = {
  statusText: string;
  marginVotes: number;
  marginPercent: number;
  yesCount: number;
  noCount: number;
  yesPercent: number;
  noPercent: number;
  yesHref?: string;
  noHref?: string;
  className?: string;
};

function LeadValue({ href, tone, label, count, percent }: { href?: string; tone: "yes" | "no"; label: string; count: number; percent: number }) {
  const content = (
    <>
      {label}: <strong>{formatNumber(count)}</strong> ({formatPercent(percent)})
    </>
  );

  if (!href) {
    return <p className={`preview-lead-chip preview-lead-chip-${tone}`}>{content}</p>;
  }

  return (
    <Link href={href} className={`preview-lead-chip preview-lead-chip-${tone}`} aria-label={`${label} városok`}>
      {content}
    </Link>
  );
}

export function LeadOverviewCard({
  statusText,
  marginVotes,
  marginPercent,
  yesCount,
  noCount,
  yesPercent,
  noPercent,
  yesHref,
  noHref,
  className,
}: LeadOverviewCardProps) {
  return (
    <section className={`preview-visual-card ${className ?? ""}`.trim()}>
      <header className="chart-card-head">
        <h2>Pillanatkép</h2>
        <p>Összesített igen/nem állás és pillanatnyi különbség.</p>
      </header>

      <div className="preview-lead-meta">
        <p className="preview-lead-status">{statusText}</p>
        <p className="preview-lead-margin">
          Különbség: {formatNumber(marginVotes)} szavazat ({formatPercent(marginPercent)})
        </p>
      </div>

      <div className="preview-lead-chart" role="img" aria-label={`Igen: ${yesCount}, nem: ${noCount}`}>
        <svg viewBox="0 0 100 12" className="preview-lead-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect x="0" y="0" width={yesPercent} height="12" className="preview-tone-yes" />
          <rect x={yesPercent} y="0" width={noPercent} height="12" className="preview-tone-no" />
        </svg>
      </div>

      <div className="preview-lead-values">
        <LeadValue href={yesHref} tone="yes" label="igen" count={yesCount} percent={yesPercent} />
        <LeadValue href={noHref} tone="no" label="nem" count={noCount} percent={noPercent} />
      </div>
    </section>
  );
}
