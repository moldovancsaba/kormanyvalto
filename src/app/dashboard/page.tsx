import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "../../components/PageChrome";
import { CityRankingCard } from "../../components/dashboard/CityRankingCard";
import { CountyRankingCard } from "../../components/dashboard/CountyRankingCard";
import { constituencies } from "../../lib/constituencies";
import { getSectionNavItems } from "../../lib/navigation";
import { formatCompactChipNumber, formatNumber } from "../../lib/numberFormat";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";
import { getCountyCodeFromConstituencyHref, getCountyHrefFromConstituencyHref } from "../../lib/territoryPaths";
import {
  CityVoteStat,
  DashboardSummary,
  getDashboardCityStats,
  getDashboardSummary,
  getLeadBlocFromCounts,
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

type KpiCardProps = {
  label: string;
  subtitle: string;
  value: number;
  valueHint?: string;
  detail: string;
};

function KpiCard({ label, subtitle, value, valueHint, detail }: KpiCardProps) {
  return (
    <article className="kpi-card">
      <header className="chart-card-head">
        <h2>{label}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="kpi-value-chip kpi-value-chip-neutral">
        <p className="kpi-value chip-number-fit">{formatCompactChipNumber(value)}</p>
        {valueHint ? <span className="kpi-value-hint">{valueHint}</span> : null}
      </div>
      <p className="kpi-detail">{detail}</p>
    </article>
  );
}

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
  const leftRatio = total === 0 ? 0.5 : leftValue / total;
  const rightRatio = total === 0 ? 0.5 : rightValue / total;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const leftArc = Math.max(0, Math.min(circumference, leftRatio * circumference));
  const rightArc = Math.max(0, Math.min(circumference, rightRatio * circumference));

  return (
    <section className="pie-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="pie-layout">
        <div className="pie-chart">
          <svg viewBox="0 0 100 100" className="pie-chart-svg" aria-hidden="true" focusable="false">
            <circle cx="50" cy="50" r={radius} className="pie-chart-ring pie-chart-ring-track" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`pie-chart-ring pie-chart-ring-${leftTone}`}
              strokeDasharray={`${leftArc} ${circumference - leftArc}`}
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`pie-chart-ring pie-chart-ring-${rightTone}`}
              strokeDasharray={`${rightArc} ${circumference - rightArc}`}
              strokeDashoffset={-leftArc}
            />
          </svg>
          <div className="pie-hole">
            <strong>{formatCompactChipNumber(total)}</strong>
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
  let stats: CityVoteStat[] = [];
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
    const [cityStats, summaryStats] = await Promise.all([
      getDashboardCityStats(),
      getDashboardSummary(),
    ]);
    stats = cityStats;
    summary = summaryStats;
  } catch {
    stats = [];
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
  const votedCities = stats.filter((item) => item.total > 0);

  const warZone = [...votedCities].sort((a, b) => b.total - a.total || a.city.localeCompare(b.city, "hu")).slice(0, 5);
  const peaceIslands = [...votedCities].sort((a, b) => a.total - b.total || a.city.localeCompare(b.city, "hu")).slice(0, 5);
  const yesCities = [...votedCities]
    .filter((item) => item.leadBloc === "yes")
    .sort((a, b) => b.diff - a.diff || b.total - a.total)
    .slice(0, 5);
  const noCities = [...votedCities]
    .filter((item) => item.leadBloc === "no")
    .sort((a, b) => a.diff - b.diff || b.total - a.total)
    .slice(0, 5);
  const nobodyKnows = [...votedCities]
    .sort((a, b) => Math.abs(a.diffPercent) - Math.abs(b.diffPercent) || b.total - a.total)
    .slice(0, 5);
  const closestBattlegrounds = [...votedCities]
    .sort((a, b) => Math.abs(a.diffPercent) - Math.abs(b.diffPercent) || b.total - a.total)
    .slice(0, 5)
    .map((item) => {
      const countyCode = getCountyCodeFromConstituencyHref(item.href);
      const countyCities = votedCities.filter((city) => getCountyCodeFromConstituencyHref(city.href) === countyCode);
      const countyYes = countyCities.reduce((acc, city) => acc + city.yes, 0);
      const countyNo = countyCities.reduce((acc, city) => acc + city.no, 0);
      return {
        countyCode,
        countyHref: getCountyHrefFromConstituencyHref(item.href),
        countyLeadBloc: getLeadBlocFromCounts(countyYes, countyNo),
        city: item.city,
        county: item.county,
        districtLabel: item.districtLabel,
        href: item.href,
        totalVotes: item.total,
        marginPercent: item.diffPercent,
        leadBloc: item.leadBloc,
      };
    });
  const strongestBastions = [...votedCities]
    .sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent) || b.total - a.total)
    .slice(0, 5)
    .map((item) => {
      const countyCode = getCountyCodeFromConstituencyHref(item.href);
      const countyCities = votedCities.filter((city) => getCountyCodeFromConstituencyHref(city.href) === countyCode);
      const countyYes = countyCities.reduce((acc, city) => acc + city.yes, 0);
      const countyNo = countyCities.reduce((acc, city) => acc + city.no, 0);
      return {
        countyCode,
        countyHref: getCountyHrefFromConstituencyHref(item.href),
        countyLeadBloc: getLeadBlocFromCounts(countyYes, countyNo),
        city: item.city,
        county: item.county,
        districtLabel: item.districtLabel,
        href: item.href,
        totalVotes: item.total,
        marginPercent: item.diffPercent,
        leadBloc: item.leadBloc,
      };
    });
  const nationalYes = votedCities.reduce((sum, item) => sum + item.yes, 0);
  const nationalNo = votedCities.reduce((sum, item) => sum + item.no, 0);
  const nationalTotal = nationalYes + nationalNo;
  const nationalYesPercent = nationalTotal > 0 ? (nationalYes / nationalTotal) * 100 : 50;
  const indicatorCities = [...votedCities]
    .map((item) => {
      const countyCode = getCountyCodeFromConstituencyHref(item.href);
      const countyCities = votedCities.filter((city) => getCountyCodeFromConstituencyHref(city.href) === countyCode);
      const countyYes = countyCities.reduce((acc, city) => acc + city.yes, 0);
      const countyNo = countyCities.reduce((acc, city) => acc + city.no, 0);
      const cityYesPercent = item.total > 0 ? (item.yes / item.total) * 100 : 50;
      return {
        countyCode,
        countyHref: getCountyHrefFromConstituencyHref(item.href),
        countyLeadBloc: getLeadBlocFromCounts(countyYes, countyNo),
        city: item.city,
        county: item.county,
        districtLabel: item.districtLabel,
        href: item.href,
        totalVotes: item.total,
        marginPercent: item.diffPercent,
        indicatorDistance: Math.abs(cityYesPercent - nationalYesPercent),
        leadBloc: item.leadBloc,
      };
    })
    .sort((a, b) => a.indicatorDistance - b.indicatorDistance || b.totalVotes - a.totalVotes)
    .slice(0, 5);
  const countyAggregates = Array.from(
    votedCities.reduce(
      (map, item) => {
        const countyCode = getCountyCodeFromConstituencyHref(item.href);
        const current = map.get(countyCode) ?? { yes: 0, no: 0, totalVotes: 0, countyName: item.county };
        current.yes += item.yes;
        current.no += item.no;
        current.totalVotes += item.total;
        map.set(countyCode, current);
        return map;
      },
      new Map<string, { yes: number; no: number; totalVotes: number; countyName: string }>()
    )
  ).map(([countyCode, data]) => {
    const totalVotes = data.yes + data.no;
    const marginPercent = totalVotes > 0 ? ((data.yes - data.no) / totalVotes) * 100 : 0;
    return {
      countyName: data.countyName,
      countyCode,
      href: `/ogy2026/egyeni-valasztokeruletek/${countyCode}`,
      totalVotes: data.totalVotes,
      marginPercent,
      leadBloc: getLeadBlocFromCounts(data.yes, data.no),
    };
  });
  const balancedCounties = [...countyAggregates]
    .filter((item) => item.totalVotes > 0)
    .sort((left, right) => Math.abs(left.marginPercent) - Math.abs(right.marginPercent) || right.totalVotes - left.totalVotes)
    .slice(0, 5);

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Grafikon</p>
        <h1>Általános hangulat</h1>
        <p className="dashboard-intro">
          A legforróbb egyéni körzetek, a legcsendesebb körzetközpontok, és azok a helyek, ahol az igen és a nem fej fej mellett halad.
        </p>
      </header>

      <section className="dashboard-summary-grid">
        <KpiCard
          label="Összes eddigi szavazat"
          subtitle="A teljes rendszer eddigi súlyozott aktivitása."
          value={summary.totalWeightedVotes}
          valueHint="szavazat"
          detail={`${formatNumber(summary.totalVoteEvents)} leadott kattintás alapján`}
        />
        <PieCard
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
          title="Csataterek"
          subtitle="A legkisebb különbségű EVK-k, ahol minden szavazat számít."
          emptyText="Nincs még elég EVK adat a csatatér listához."
          items={closestBattlegrounds}
          mode="closest"
        />
        <ChartCard
          title="A béke szigetei"
          ariaLabel="A béke szigetei"
          subtitle="A legkevesebb, de már mért aktivitást mutató EVK-k."
          tone="cool"
          items={peaceIslands}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <CityRankingCard
          title="Előrejelző városok"
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
          title="Kiegyensúlyozott vármegyék"
          subtitle="A legszorosabb vármegyei állások."
          emptyText="Nincs még kiegyensúlyozott vármegyei adat."
          items={balancedCounties}
          mode="balance"
        />
        <ChartCard
          title="Háborús övezetek"
          ariaLabel="Háborús övezetek"
          subtitle="A legtöbb összesített szavazatot kapó EVK-k."
          tone="warm"
          items={warZone}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <CityRankingCard
          title="Biztos bástyák"
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
