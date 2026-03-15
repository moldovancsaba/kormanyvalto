import { type LeadOverviewMetric } from "../../lib/dashboardPreviewData";

type LeadOverviewCardProps = {
  metric: LeadOverviewMetric;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("hu-HU").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function getLeadLabel(leadBloc: LeadOverviewMetric["leadBloc"]): string {
  if (leadBloc === "yes") return "Az igen vezet";
  if (leadBloc === "no") return "A nem vezet";
  return "Döntetlen";
}

export function LeadOverviewCard({ metric }: LeadOverviewCardProps) {
  const total = Math.max(1, metric.totalWeightedVotes);
  const yesWidth = (metric.weightedYes / total) * 100;
  const noWidth = (metric.weightedNo / total) * 100;

  return (
    <section className="preview-visual-card">
      <header className="chart-card-head">
        <h2>1. Országos vezetés</h2>
        <p>Összesített igen/nem állás és pillanatnyi különbség.</p>
      </header>

      <div className="preview-lead-meta">
        <p className="preview-lead-status">{getLeadLabel(metric.leadBloc)}</p>
        <p className="preview-lead-margin">
          Különbség: {formatNumber(metric.marginVotes)} szavazat ({formatPercent(metric.marginPercent)})
        </p>
      </div>

      <div className="preview-lead-chart" role="img" aria-label="Országos igen és nem arány">
        <svg viewBox="0 0 100 12" className="preview-lead-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect x="0" y="0" width={yesWidth} height="12" className="preview-tone-yes" />
          <rect x={yesWidth} y="0" width={noWidth} height="12" className="preview-tone-no" />
        </svg>
      </div>

      <div className="preview-lead-values">
        <p>
          igen: <strong>{formatNumber(metric.weightedYes)}</strong> ({formatPercent(metric.yesPercent)})
        </p>
        <p>
          nem: <strong>{formatNumber(metric.weightedNo)}</strong> ({formatPercent(metric.noPercent)})
        </p>
      </div>
    </section>
  );
}
