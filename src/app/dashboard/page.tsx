import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageIntro, PageShell } from "../../components/PageChrome";
import { CityRankingCard } from "../../components/dashboard/CityRankingCard";
import { CountyRankingCard } from "../../components/dashboard/CountyRankingCard";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { PieCard } from "../../components/dashboard/PieCard";
import { CountyBalanceDetailItem, CityRankingDetailItem, getDashboardTopMetrics } from "../../lib/dashboardDetailData";
import { getSectionNavItems } from "../../lib/navigation";
import { formatNumber } from "../../lib/numberFormat";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";
import {
  CityVoteStat,
  DashboardSummary,
  getDashboardSummary,
} from "../../lib/results";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Grafikon",
  description: "Kormanyvalto dashboard a legforróbb, legcsendesebb és legmegosztottabb egyéni körzetekkel.",
  path: "/dashboard",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

type ChartCardProps = {
  title: ReactNode;
  ariaLabel: string;
  subtitle: string;
  tone: "warm" | "cool" | "yes" | "no" | "neutral";
  items: CityVoteStat[];
  valueLabel: (item: CityVoteStat) => string;
  valueForBar: (item: CityVoteStat) => number;
};

function formatSignedDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function getCityTone(item: CityVoteStat): "yes" | "no" | "neutral" {
  return item.leadBloc;
}

function ChartCard({ title, ariaLabel, subtitle, tone, items, valueLabel, valueForBar }: ChartCardProps) {
  const maxValue = items.length > 0 ? Math.max(...items.map((item) => valueForBar(item)), 1) : 1;

  return (
    <section className={`chart-card chart-card-${tone}`}>
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="chart-empty">Nincs elég adat ehhez a grafikonhoz.</p>
      ) : (
        <div className="chart-columns" role="img" aria-label={ariaLabel}>
          {items.map((item, index) => {
            const height = Math.max(12, Math.round((valueForBar(item) / maxValue) * 100));
            return (
              <Link
                key={`${title}-${item.county}-${item.city}-${item.districtLabel}-${index}`}
                href={item.href}
                className="chart-column chart-column-link"
                title={`${item.county}, ${item.city}, ${item.districtLabel}`}
              >
                <div className="chart-column-value">{valueLabel(item)}</div>
                <div className="chart-column-plot">
                  <svg viewBox="0 0 100 100" className="chart-column-bar-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                    <rect
                      x="0"
                      y={100 - height}
                      width="100"
                      height={height}
                      rx="8"
                      ry="8"
                      className={`chart-column-bar chart-column-bar-${getCityTone(item)}`}
                    />
                  </svg>
                </div>
                <div className="chart-column-label" title={`${item.city} - ${item.county} - ${item.districtLabel}`}>
                  <strong>{item.city}</strong>
                  <span>
                    {item.county} · {item.districtLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  let warZone: CityVoteStat[] = [];
  let peaceIslands: CityVoteStat[] = [];
  let yesCities: CityVoteStat[] = [];
  let noCities: CityVoteStat[] = [];
  let nobodyKnows: CityVoteStat[] = [];
  let closestBattlegrounds: CityRankingDetailItem[] = [];
  let strongestBastions: CityRankingDetailItem[] = [];
  let indicatorCities: CityRankingDetailItem[] = [];
  let balancedCounties: CountyBalanceDetailItem[] = [];
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
    const [dashboardTopMetrics, summaryStats] = await Promise.all([
      getDashboardTopMetrics(),
      getDashboardSummary(),
    ]);
    warZone = dashboardTopMetrics.warZone;
    peaceIslands = dashboardTopMetrics.peaceIslands;
    yesCities = dashboardTopMetrics.yesCities;
    noCities = dashboardTopMetrics.noCities;
    nobodyKnows = dashboardTopMetrics.nobodyKnows;
    closestBattlegrounds = dashboardTopMetrics.closestBattlegrounds;
    strongestBastions = dashboardTopMetrics.strongestBastions;
    indicatorCities = dashboardTopMetrics.indicatorCities;
    balancedCounties = dashboardTopMetrics.balancedCounties;
    summary = summaryStats;
  } catch {
    warZone = [];
    peaceIslands = [];
    yesCities = [];
    noCities = [];
    nobodyKnows = [];
    closestBattlegrounds = [];
    strongestBastions = [];
    indicatorCities = [];
    balancedCounties = [];
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
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <PageIntro
        eyebrow="Grafikon"
        title="Általános hangulat"
        intro="A legforróbb egyéni körzetek, a legcsendesebb körzetközpontok, és azok a helyek, ahol az igen és a nem fej fej mellett halad."
      />

      <section className="dashboard-summary-grid">
        <KpiCard
          variant="dashboard"
          label="Összes eddigi szavazat"
          subtitle="A teljes rendszer eddigi súlyozott aktivitása."
          value={summary.totalWeightedVotes}
          valueHint="szavazat"
          detail={`${formatNumber(summary.totalVoteEvents)} leadott kattintás alapján`}
        />
        <PieCard
          variant="dashboard"
          title="Összes igen vs összes nem"
          subtitle="A teljes rendszer jelenlegi súlyozott állása."
          leftLabel="igen"
          leftValue={summary.weightedYes}
          rightLabel="nem"
          rightValue={summary.weightedNo}
          leftTone="yes"
          rightTone="no"
        />
      </section>

      <div className="dashboard-grid">
        <CityRankingCard
          title={
            <Link href="/dashboard/csataterek" className="title-inline-chip title-inline-chip-link title-inline-chip-neutral">
              Csataterek
            </Link>
          }
          subtitle="A legkisebb különbségű EVK-k, ahol minden szavazat számít."
          emptyText="Nincs még elég EVK adat a csatatér listához."
          items={closestBattlegrounds}
          mode="closest"
        />
        <ChartCard
          title={
            <Link href="/dashboard/beke-szigetei" className="title-inline-chip title-inline-chip-link title-inline-chip-neutral">
              A béke szigetei
            </Link>
          }
          ariaLabel="A béke szigetei"
          subtitle="A legkevesebb, de már mért aktivitást mutató EVK-k."
          tone="cool"
          items={peaceIslands}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <CityRankingCard
          title={
            <Link href="/dashboard/elorejelzo-varosok" className="title-inline-chip title-inline-chip-link title-inline-chip-neutral">
              Előrejelző városok
            </Link>
          }
          subtitle="Az EVK-k, ahol a helyi arány a legközelebb áll az aktuális országos arányhoz."
          emptyText="Nincs még elég adat az előrejelző kártyákhoz."
          items={indicatorCities}
          mode="indicator"
        />
        <ChartCard
          title="Senki nem tudja"
          ariaLabel="Senki nem tudja"
          subtitle="A legszorosabb EVK-k, ahol alig van különbség."
          tone="neutral"
          items={nobodyKnows}
          valueLabel={(item) => `${Math.abs(item.diff)}`}
          valueForBar={(item) => Math.max(1, item.total)}
        />
        <CountyRankingCard
          title={
            <Link href="/dashboard/kiegyensulyozott-varmegyek" className="title-inline-chip title-inline-chip-link title-inline-chip-neutral">
              Kiegyensúlyozott vármegyék
            </Link>
          }
          subtitle="A legszorosabb vármegyei állások."
          emptyText="Nincs még kiegyensúlyozott vármegyei adat."
          items={balancedCounties}
          mode="balance"
        />
        <ChartCard
          title={
            <Link href="/dashboard/haborus-ovezetek" className="title-inline-chip title-inline-chip-link title-inline-chip-neutral">
              Háborús övezetek
            </Link>
          }
          ariaLabel="Háborús övezetek"
          subtitle="A legtöbb összesített szavazatot kapó EVK-k."
          tone="warm"
          items={warZone}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <CityRankingCard
          title={
            <Link href="/dashboard/biztos-bastyak" className="title-inline-chip title-inline-chip-link title-inline-chip-neutral">
              Biztos bástyák
            </Link>
          }
          subtitle="A legnagyobb különbséggel vezető EVK-k."
          emptyText="Nincs még elég EVK adat a bástya listához."
          items={strongestBastions}
          mode="strongest"
        />
        <ChartCard
          title={
            <>
              Az{" "}
              <Link href="/dashboard/igen" className="title-inline-chip title-inline-chip-link title-inline-chip-yes">
                igen
              </Link>{" "}
              városok
            </>
          }
          ariaLabel="Az igen városok"
          subtitle="Ahol az igen a legnagyobb különbséggel vezet az EVK-ban."
          tone="yes"
          items={yesCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => item.diff}
        />
        <ChartCard
          title={
            <>
              A{" "}
              <Link href="/dashboard/nem" className="title-inline-chip title-inline-chip-link title-inline-chip-no">
                nem
              </Link>{" "}
              városok
            </>
          }
          ariaLabel="A nem városok"
          subtitle="Ahol a nem a legnagyobb különbséggel dominál az EVK-ban."
          tone="no"
          items={noCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => Math.abs(item.diff)}
        />
      </div>
    </PageShell>
  );
}
