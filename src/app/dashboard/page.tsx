import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PageShell } from "../../components/PageChrome";
import { constituencies, getCounties } from "../../lib/constituencies";
import { getHungaryCountyMapData } from "../../lib/hungaryCountyMap";
import { getSectionNavItems } from "../../lib/navigation";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";
import {
  CityVoteStat,
  DashboardSummary,
  getDashboardCityStats,
  getDashboardSummary,
  getLeadBlocFromCounts,
  getScopeVoteCounts,
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

type CountyMapStat = {
  maz: string;
  name: string;
  yes: number;
  no: number;
  total: number;
  leadBloc: "yes" | "no" | "neutral";
};



function formatSignedDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatPercent(value: number) {
  const abs = Math.abs(value);
  return `${abs.toFixed(1).replace(".", ",")}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("hu-HU").format(value);
}

function getCityTone(item: CityVoteStat): "yes" | "no" | "neutral" {
  return item.leadBloc;
}

type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
};

function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <article className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
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

function CountyMapCard({ items }: { items: CountyMapStat[] }) {
  const byMaz = new Map(items.map((item) => [item.maz, item]));
  const countyMap = getHungaryCountyMapData();
  const countyPaths = new Map(countyMap.paths.map((item) => [item.maz, item]));

  return (
    <section className="chart-card chart-card-neutral county-map-card">
      <header className="chart-card-head">
        <h2>Vármegye térkép</h2>
        <p>Aktuális állás vármegyénként (igen / nem / döntetlen).</p>
      </header>
      <div className="county-map-wrap">
        <svg viewBox={countyMap.viewBox} className="county-map-svg" role="img" aria-label="Magyarország vármegyei térkép">
          {getCounties().map((county) => {
            const stat = byMaz.get(county.maz) ?? { maz: county.maz, name: county.mazNev, yes: 0, no: 0, total: 0, leadBloc: "neutral" as const };
            const countyPath = countyPaths.get(county.maz);
            if (!countyPath) return null;
            return (
              <a key={county.maz} href={`/ogy2026/egyeni-valasztokeruletek/${county.maz}`}>
                <path d={countyPath.d} className={`county-shape county-shape-${stat.leadBloc}`}>
                  <title>
                    {stat.name} · igen: {stat.yes} · nem: {stat.no}
                  </title>
                </path>
              </a>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  let stats: CityVoteStat[] = [];
  let countyStats: CountyMapStat[] = [];
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
    const scopes = constituencies.map((c) => `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`);
    const [cityStats, summaryStats, scopeCounts] = await Promise.all([
      getDashboardCityStats(),
      getDashboardSummary(),
      getScopeVoteCounts(scopes),
    ]);
    stats = cityStats;
    summary = summaryStats;
    countyStats = getCounties().map((county) => {
      const countyConstituencies = constituencies.filter((c) => c.maz === county.maz);
      const yes = countyConstituencies.reduce((sum, c) => {
        const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
        return sum + (scopeCounts[scope]?.yes ?? 0);
      }, 0);
      const no = countyConstituencies.reduce((sum, c) => {
        const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
        return sum + (scopeCounts[scope]?.no ?? 0);
      }, 0);
      return {
        maz: county.maz,
        name: county.mazNev,
        yes,
        no,
        total: yes + no,
        leadBloc: getLeadBlocFromCounts(yes, no),
      };
    });
  } catch {
    stats = [];
    countyStats = [];
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
  const landslides = [...votedCities].sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent) || b.total - a.total).slice(0, 5);

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Grafikon</p>
        <h1>Általános hangulat</h1>
        <p className="dashboard-intro">
          A legforróbb egyéni körzetek, a legcsendesebb körzetközpontok, és azok a helyek, ahol az igen és a nem fej fej mellett halad.
        </p>
      </header>

      <section className="kpi-grid">
        <KpiCard
          label="Összes eddigi szavazat"
          value={formatNumber(summary.totalWeightedVotes)}
          detail={`${formatNumber(summary.totalVoteEvents)} leadott kattintás alapján`}
        />
      </section>

      <section className="pie-grid">
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

      <CountyMapCard items={countyStats} />

      <div className="dashboard-grid">
        <ChartCard
          title="Top 5 háborús övezet"
          subtitle="A legtöbb összesített szavazatot kapó EVK-k."
          tone="warm"
          items={warZone}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <ChartCard
          title="Top 5 a béke szigetei"
          subtitle="A legkevesebb, de már mért aktivitást mutató EVK-k."
          tone="cool"
          items={peaceIslands}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
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
        <ChartCard
          title="Elsöprő győzelmek"
          subtitle="Top 5 legnagyobb százalékos különbség az EVK-kban."
          tone="warm"
          items={landslides}
          valueLabel={(item) => formatPercent(item.diffPercent)}
          valueForBar={(item) => Math.max(0.1, Math.abs(item.diffPercent))}
        />
      </div>
    </PageShell>
  );
}
