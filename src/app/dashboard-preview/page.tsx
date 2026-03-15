import type { Metadata } from "next";
import { PageShell } from "../../components/PageChrome";
import { LeadOverviewCard } from "../../components/dashboard-preview/LeadOverviewCard";
import { ReportingCoverageCard } from "../../components/dashboard-preview/ReportingCoverageCard";
import { type DashboardPreviewMetrics, getDashboardPreviewMetrics } from "../../lib/dashboardPreviewData";
import { getSectionNavItems } from "../../lib/navigation";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard Preview",
  description: "Kísérleti előnézeti oldal új dashboard grafikonok teszteléséhez.",
  path: "/dashboard-preview",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
};

type PieCardProps = {
  title: string;
  subtitle: string;
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  leftTone: "yes" | "no" | "warm" | "cool";
  rightTone: "yes" | "no" | "warm" | "cool";
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("hu-HU").format(value);
}

function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <article className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <p className="kpi-detail">{detail}</p>
    </article>
  );
}

function PieCard({
  title,
  subtitle,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftTone,
  rightTone,
}: PieCardProps) {
  const total = leftValue + rightValue;
  const leftPercent = total === 0 ? 0.5 : leftValue / total;
  const radius = 42;
  const centerX = 50;
  const centerY = 50;
  const circumference = 2 * Math.PI * radius;
  const leftLength = circumference * leftPercent;
  const rightLength = Math.max(0, circumference - leftLength);
  const leftClassName = leftTone === "yes" ? "preview-tone-yes" : "preview-tone-no";
  const rightClassName = rightTone === "yes" ? "preview-tone-yes" : "preview-tone-no";

  return (
    <section className="pie-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="pie-layout">
        <div className="pie-chart preview-pie-chart">
          <svg viewBox="0 0 100 100" className="preview-pie-svg" aria-hidden="true" focusable="false">
            <circle cx={centerX} cy={centerY} r={radius} className="preview-pie-track" />
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              className={leftClassName}
              strokeDasharray={`${leftLength} ${rightLength}`}
              strokeDashoffset={circumference * 0.25}
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              className={rightClassName}
              strokeDasharray={`${rightLength} ${leftLength}`}
              strokeDashoffset={circumference * (0.25 + leftPercent)}
            />
          </svg>
          <div className="pie-hole">
            <strong>{formatNumber(total)}</strong>
            <span>összesen</span>
          </div>
        </div>
        <div className="pie-legend">
          <article>
            <span className={`pie-swatch pie-swatch-${leftTone}`} />
            <div>
              <strong>{leftLabel}</strong>
              <span>{formatNumber(leftValue)}</span>
            </div>
          </article>
          <article>
            <span className={`pie-swatch pie-swatch-${rightTone}`} />
            <div>
              <strong>{rightLabel}</strong>
              <span>{formatNumber(rightValue)}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPreviewPage() {
  let metrics: DashboardPreviewMetrics = {
    leadOverview: {
      totalWeightedVotes: 0,
      weightedYes: 0,
      weightedNo: 0,
      yesPercent: 0,
      noPercent: 0,
      leadBloc: "neutral" as const,
      marginVotes: 0,
      marginPercent: 0,
    },
    reportingCoverage: {
      activeDistricts: 0,
      totalDistricts: 0,
      activeCounties: 0,
      totalCounties: 0,
      hasNationalVotes: false,
    },
    totalRegisteredPlayers: 0,
    weightedTripleVotes: 0,
    weightedRegularVotes: 0,
  };
  try {
    metrics = await getDashboardPreviewMetrics();
  } catch {
    // Keep zero-value fallback metrics.
  }

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Dashboard Preview</p>
        <h1>Előnézet</h1>
        <p className="dashboard-intro">Kísérleti grafikonok tesztelése publikálás előtt.</p>
      </header>

      <div className="dashboard-grid">
        <LeadOverviewCard metric={metrics.leadOverview} />
        <ReportingCoverageCard metric={metrics.reportingCoverage} />
      </div>

      <section className="kpi-grid">
        <KpiCard
          label="Összes regisztrált játékos"
          value={formatNumber(metrics.totalRegisteredPlayers)}
          detail="A 3x VOTE módot használó belépett játékosok"
        />
      </section>

      <section className="pie-grid">
        <PieCard
          title="3x-os szavazatok vs sima szavazatok"
          subtitle="Súlyozott összesítés a belépett és anonim játékmód között."
          leftLabel="3x-os"
          leftValue={metrics.weightedTripleVotes}
          rightLabel="sima"
          rightValue={metrics.weightedRegularVotes}
          leftTone="no"
          rightTone="yes"
        />
      </section>
    </PageShell>
  );
}
