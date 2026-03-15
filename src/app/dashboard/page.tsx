import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PageShell } from "../../components/PageChrome";
import { CityRankingCard } from "../../components/dashboard-preview/CityRankingCard";
import { CountyRankingCard } from "../../components/dashboard-preview/CountyRankingCard";
import { constituencies } from "../../lib/constituencies";
import { getSectionNavItems } from "../../lib/navigation";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";
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
  title: string;
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("hu-HU").format(value);
}

function getCityTone(item: CityVoteStat): "yes" | "no" | "neutral" {
  return item.leadBloc;
}

type KpiCardProps = {
  label: string;
  subtitle: string;
  value: string;
  detail: string;
};

function KpiCard({ label, subtitle, value, detail }: KpiCardProps) {
  return (
    <article className="kpi-card">
      <header className="chart-card-head">
        <h2>{label}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="kpi-value-chip kpi-value-chip-neutral">
        <p className="kpi-value">{value}</p>
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

function ChartCard({ title, subtitle, tone, items, valueLabel, valueForBar }: ChartCardProps) {
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
        <div className="chart-columns" role="img" aria-label={title}>
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
                  <div
                    className={`chart-column-bar chart-column-bar-${getCityTone(item)}`}
                    style={{ "--bar-height": `${height}%` } as CSSProperties}
                  />
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
      const countyCode = item.href.split("/")[3] ?? "";
      const countyCities = votedCities.filter((city) => city.href.split("/")[3] === countyCode);
      const countyYes = countyCities.reduce((acc, city) => acc + city.yes, 0);
      const countyNo = countyCities.reduce((acc, city) => acc + city.no, 0);
      return {
        countyCode,
        countyHref: `/ogy2026/egyeni-valasztokeruletek/${countyCode}`,
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
      const countyCode = item.href.split("/")[3] ?? "";
      const countyCities = votedCities.filter((city) => city.href.split("/")[3] === countyCode);
      const countyYes = countyCities.reduce((acc, city) => acc + city.yes, 0);
      const countyNo = countyCities.reduce((acc, city) => acc + city.no, 0);
      return {
        countyCode,
        countyHref: `/ogy2026/egyeni-valasztokeruletek/${countyCode}`,
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
  const countyAggregates = Array.from(
    votedCities.reduce(
      (map, item) => {
        const countyCode = item.href.split("/")[3] ?? "";
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
          value={formatNumber(summary.totalWeightedVotes)}
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
          title="Top 5 háborús övezet"
          subtitle="A legtöbb összesített szavazatot kapó EVK-k."
          tone="warm"
          items={warZone}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <ChartCard
          title="A béke szigetei"
          subtitle="A legkevesebb, de már mért aktivitást mutató EVK-k."
          tone="cool"
          items={peaceIslands}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <CountyRankingCard
          title="Kiegyensúlyozott vármegyék"
          subtitle="A legszorosabb vármegyei állások."
          emptyText="Nincs még kiegyensúlyozott vármegyei adat."
          items={balancedCounties}
          mode="balance"
        />
        <ChartCard
          title="Top 5 az igen városok"
          subtitle="Ahol az igen a legnagyobb különbséggel vezet az EVK-ban."
          tone="yes"
          items={yesCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => item.diff}
        />
        <ChartCard
          title="Top 5 a nem városok"
          subtitle="Ahol a nem a legnagyobb különbséggel dominál az EVK-ban."
          tone="no"
          items={noCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => Math.abs(item.diff)}
        />
        <ChartCard
          title="Top 5 senki nem tudja"
          subtitle="A legszorosabb EVK-k, ahol alig van különbség."
          tone="neutral"
          items={nobodyKnows}
          valueLabel={(item) => `${Math.abs(item.diff)}`}
          valueForBar={(item) => Math.max(1, item.total)}
        />
        <CityRankingCard
          title="Biztos bástyák"
          subtitle="A legnagyobb különbséggel vezető EVK-k."
          emptyText="Nincs még elég EVK adat a bástya listához."
          items={strongestBastions}
          mode="strongest"
        />
      </div>
    </PageShell>
  );
}
