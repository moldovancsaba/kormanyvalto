import { type ReportingCoverageMetric } from "../../lib/dashboardPreviewData";

type ReportingCoverageCardProps = {
  metric: ReportingCoverageMetric;
};

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function ratioPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function CoverageMeter({ label, numerator, denominator }: { label: string; numerator: number; denominator: number }) {
  const percent = ratioPercent(numerator, denominator);

  return (
    <article className="preview-coverage-item">
      <header>
        <h3>{label}</h3>
        <p>
          {numerator}/{denominator} ({formatPercent(percent)})
        </p>
      </header>
      <svg viewBox="0 0 100 10" className="preview-coverage-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <rect x="0" y="0" width="100" height="10" className="preview-coverage-track" />
        <rect x="0" y="0" width={percent} height="10" className="preview-coverage-fill" />
      </svg>
    </article>
  );
}

export function ReportingCoverageCard({ metric }: ReportingCoverageCardProps) {
  return (
    <section className="preview-visual-card">
      <header className="chart-card-head">
        <h2>2. Feldolgozottság</h2>
        <p>Aktív lefedettség EVK és vármegye szinten.</p>
      </header>

      <div className="preview-coverage-grid">
        <CoverageMeter label="Aktív EVK" numerator={metric.activeDistricts} denominator={metric.totalDistricts} />
        <CoverageMeter label="Aktív vármegye" numerator={metric.activeCounties} denominator={metric.totalCounties} />
        <article className="preview-coverage-item preview-coverage-item-national">
          <header>
            <h3>Országos szavazás</h3>
            <p>{metric.hasNationalVotes ? "Elérhető" : "Nincs adat"}</p>
          </header>
          <div className="preview-coverage-national-state" data-state={metric.hasNationalVotes ? "active" : "inactive"}>
            {metric.hasNationalVotes ? "Aktív" : "Inaktív"}
          </div>
        </article>
      </div>
    </section>
  );
}
