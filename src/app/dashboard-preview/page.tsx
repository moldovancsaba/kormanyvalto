import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "../../components/PageChrome";
import { CityRankingCard } from "../../components/dashboard-preview/CityRankingCard";
import { CountyRankingCard } from "../../components/dashboard-preview/CountyRankingCard";
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

type PreviewCityItem = {
  city: string;
  county: string;
  districtLabel: string;
  href: string;
  totalVotes: number;
  diff: number;
  diffPercent: number;
  leadBloc: "yes" | "no" | "neutral";
};

type CityListCardProps = {
  title: ReactNode;
  subtitle: string;
  emptyText: string;
  items: PreviewCityItem[];
  metricLabel: "votes" | "diff" | "percent";
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("hu-HU").format(value);
}

function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <article className="preview-visual-card preview-kpi-card">
      <p className="preview-kpi-label">{label}</p>
      <p className="preview-kpi-value">{value}</p>
      <p className="preview-kpi-detail">{detail}</p>
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
    <section className="preview-visual-card">
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

function formatSignedDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatPercent(value: number) {
  return `${Math.abs(value).toFixed(1).replace(".", ",")}%`;
}

function getMetricValue(item: PreviewCityItem, metricLabel: CityListCardProps["metricLabel"]) {
  if (metricLabel === "votes") return item.totalVotes;
  if (metricLabel === "diff") return Math.abs(item.diff);
  return Math.abs(item.diffPercent);
}

function getMetricText(item: PreviewCityItem, metricLabel: CityListCardProps["metricLabel"]) {
  if (metricLabel === "votes") return `${formatNumber(item.totalVotes)} szavazat`;
  if (metricLabel === "diff") return `${formatSignedDiff(item.diff)} különbség`;
  return `${formatPercent(item.diffPercent)} különbség`;
}

function CityListCard({ title, subtitle, emptyText, items, metricLabel }: CityListCardProps) {
  const maxMetric = Math.max(1, ...items.map((item) => getMetricValue(item, metricLabel)));

  return (
    <section className="preview-visual-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      {items.length === 0 ? (
        <p className="chart-empty">{emptyText}</p>
      ) : (
        <div className="preview-ranking-list" role="list" aria-label={typeof title === "string" ? title : "Város ranglista"}>
          {items.map((item, index) => {
            const fillPercent = Math.max(8, (getMetricValue(item, metricLabel) / maxMetric) * 100);
            return (
              <Link key={`${item.href}-${index}`} href={item.href} className="preview-ranking-item" role="listitem">
                <div className="preview-ranking-meta">
                  <strong>{item.city}</strong>
                  <span>
                    {item.county} · {item.districtLabel}
                  </span>
                </div>
                <div className="preview-ranking-values">
                  <span className={`preview-ranking-chip preview-ranking-chip-${item.leadBloc}`}>{getMetricText(item, metricLabel)}</span>
                </div>
                <svg viewBox="0 0 100 10" className="preview-ranking-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <rect x="0" y="0" width="100" height="10" className="preview-ranking-track" />
                  <rect x="0" y="0" width={fillPercent} height="10" className={`preview-card-bar preview-card-bar-${item.leadBloc}`} />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
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
    topClosestCities: [],
    topStrongestCities: [],
    topActiveCounties: [],
    topBalancedCounties: [],
    topWarZones: [],
    topPeaceIslands: [],
    topYesCities: [],
    topNoCities: [],
    topUncertainCities: [],
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
        <CityRankingCard
          title="Elsöprő győzelmek"
          subtitle="Top 5 legnagyobb százalékos különbség az EVK-kban."
          emptyText="Nincs még elég EVK adat az elsöprő győzelmek listához."
          items={metrics.topStrongestCities}
          mode="strongest"
        />
        <CityListCard
          title="Háborús övezetek"
          subtitle="A legtöbb összesített szavazatot kapó EVK-k."
          emptyText="Nincs még elég adat ehhez a listához."
          items={metrics.topWarZones}
          metricLabel="votes"
        />
        <CityListCard
          title="A béke szigetei"
          subtitle="A legkevesebb, de már mért aktivitást mutató EVK-k."
          emptyText="Nincs még elég adat ehhez a listához."
          items={metrics.topPeaceIslands}
          metricLabel="votes"
        />
        <CityListCard
          title={
            <>
              Az <span className="title-inline-chip title-inline-chip-yes">igen</span> városok
            </>
          }
          subtitle="Ahol az igen a legnagyobb különbséggel vezet."
          emptyText="Nincs még elég igen vezetésű EVK."
          items={metrics.topYesCities}
          metricLabel="diff"
        />
        <CityListCard
          title={
            <>
              A <span className="title-inline-chip title-inline-chip-no">nem</span> városok
            </>
          }
          subtitle="Ahol a nem a legnagyobb különbséggel vezet."
          emptyText="Nincs még elég nem vezetésű EVK."
          items={metrics.topNoCities}
          metricLabel="diff"
        />
        <CityListCard
          title="Senki nem tudja"
          subtitle="A legszorosabb EVK-k, ahol alig van különbség."
          emptyText="Nincs még elég szoros EVK adat."
          items={metrics.topUncertainCities}
          metricLabel="percent"
        />
        <CountyRankingCard
          title="5. Top aktív vármegyék"
          subtitle="A legtöbb összesített szavazatot kapó vármegyék."
          emptyText="Nincs még vármegyei aktivitási adat."
          items={metrics.topActiveCounties}
          mode="activity"
        />
        <CountyRankingCard
          title="6. Top kiegyensúlyozott vármegyék"
          subtitle="A legszorosabb vármegyei állások."
          emptyText="Nincs még kiegyensúlyozott vármegyei adat."
          items={metrics.topBalancedCounties}
          mode="balance"
        />
        <KpiCard
          label="Összes regisztrált játékos"
          value={formatNumber(metrics.totalRegisteredPlayers)}
          detail="A 3x VOTE módot használó belépett játékosok"
        />
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
      </div>
    </PageShell>
  );
}
