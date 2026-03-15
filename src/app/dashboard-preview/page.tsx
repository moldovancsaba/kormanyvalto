import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageShell } from "../../components/PageChrome";
import { getSectionNavItems } from "../../lib/navigation";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";
import { type DashboardSummary, getDashboardSummary } from "../../lib/results";

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
  const leftPercent = total === 0 ? 50 : (leftValue / total) * 100;
  const chartStyle = {
    "--pie-left-percent": `${leftPercent}%`,
    "--pie-left-tone": `var(--tone-${leftTone})`,
    "--pie-right-tone": `var(--tone-${rightTone})`,
  };

  return (
    <section className="pie-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="pie-layout">
        <div className="pie-chart" style={chartStyle as CSSProperties}>
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
  let summary: DashboardSummary = {
    totalWeightedVotes: 0,
    totalVoteEvents: 0,
    totalRegisteredPlayers: 0,
    weightedYes: 0,
    weightedNo: 0,
    weightedTripleVotes: 0,
    weightedRegularVotes: 0,
    tripleVoteEvents: 0,
    regularVoteEvents: 0,
  };

  try {
    summary = await getDashboardSummary();
  } catch {
    summary = {
      totalWeightedVotes: 0,
      totalVoteEvents: 0,
      totalRegisteredPlayers: 0,
      weightedYes: 0,
      weightedNo: 0,
      weightedTripleVotes: 0,
      weightedRegularVotes: 0,
      tripleVoteEvents: 0,
      regularVoteEvents: 0,
    };
  }

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard") }>
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Dashboard Preview</p>
        <h1>Előnézet</h1>
        <p className="dashboard-intro">Kísérleti grafikonok tesztelése publikálás előtt.</p>
      </header>

      <section className="kpi-grid">
        <KpiCard
          label="Összes regisztrált játékos"
          value={formatNumber(summary.totalRegisteredPlayers)}
          detail="A 3x VOTE módot használó belépett játékosok"
        />
      </section>

      <section className="pie-grid">
        <PieCard
          title="3x-os szavazatok vs sima szavazatok"
          subtitle="Súlyozott összesítés a belépett és anonim játékmód között."
          leftLabel="3x-os"
          leftValue={summary.weightedTripleVotes}
          rightLabel="sima"
          rightValue={summary.weightedRegularVotes}
          leftTone="no"
          rightTone="yes"
        />
      </section>
    </PageShell>
  );
}
