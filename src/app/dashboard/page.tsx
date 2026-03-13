import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";
import { CityVoteStat, DashboardSummary, getDashboardCityStats, getDashboardSummary } from "../../lib/results";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Grafikon",
  description: "Kormanyvalto dashboard a legforróbb, legcsendesebb és legmegosztottabb városokkal.",
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
  if (item.diff > 0) return "yes";
  if (item.diff < 0) return "no";
  return "neutral";
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
    background: `conic-gradient(var(--tone-${leftTone}) 0 ${leftPercent}%, var(--tone-${rightTone}) ${leftPercent}% 100%)`,
  };

  return (
    <section className="pie-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="pie-layout">
        <div className="pie-chart" style={chartStyle}>
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
                key={`${title}-${item.county}-${item.city}-${index}`}
                href={item.href}
                className="chart-column chart-column-link"
                title={`${item.county}, ${item.city}`}
              >
                <div className="chart-column-value">{valueLabel(item)}</div>
                <div className="chart-column-plot">
                  <div
                    className={`chart-column-bar chart-column-bar-${getCityTone(item)}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="chart-column-label" title={`${item.city} - ${item.county}`}>
                  <strong>{item.city}</strong>
                  <span>{item.county}</span>
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
    [stats, summary] = await Promise.all([getDashboardCityStats(), getDashboardSummary()]);
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
  const yesCities = [...votedCities].filter((item) => item.diff > 0).sort((a, b) => b.diff - a.diff || b.total - a.total).slice(0, 5);
  const noCities = [...votedCities].filter((item) => item.diff < 0).sort((a, b) => a.diff - b.diff || b.total - a.total).slice(0, 5);
  const nobodyKnows = [...votedCities].sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff) || b.total - a.total).slice(0, 5);

  return (
    <main className="dashboard-page list-page">
      <div className="hero-actions">
        <Link href="/" className="nav-link-button nav-link-button-small">
          Főoldal
        </Link>
        <Link href="/ogy2026/egyeni-valasztokeruletek" className="nav-link-button nav-link-button-small">
          OGY 2026 körzetek listája
        </Link>
        <Link href="/mandatumbecsles" className="nav-link-button nav-link-button-small">
          Mandátumbecslés
        </Link>
      </div>

      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Grafikon</p>
        <h1>Általános hangulat</h1>
        <p className="dashboard-intro">
          A legforróbb városok, a legcsendesebb körzetközpontok, és azok a helyek, ahol az igen és a nem fej fej mellett halad.
        </p>
      </header>

      <section className="kpi-grid">
        <KpiCard
          label="Összes eddigi szavazat"
          value={formatNumber(summary.totalWeightedVotes)}
          detail={`${formatNumber(summary.totalVoteEvents)} leadott kattintás alapján`}
        />
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
          leftTone="warm"
          rightTone="cool"
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
        <ChartCard
          title="Top 5 háborús övezet"
          subtitle="A legtöbb összesített szavazatot kapó városok."
          tone="warm"
          items={warZone}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <ChartCard
          title="Top 5 a béke szigetei"
          subtitle="A legkevesebb, de már mért aktivitást mutató városok."
          tone="cool"
          items={peaceIslands}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <ChartCard
          title="Top 5 az igen városok"
          subtitle="Ahol az igen a legnagyobb különbséggel vezet."
          tone="yes"
          items={yesCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => item.diff}
        />
        <ChartCard
          title="Top 5 a nem városok"
          subtitle="Ahol a nem a legnagyobb különbséggel dominál."
          tone="no"
          items={noCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => Math.abs(item.diff)}
        />
        <ChartCard
          title="Top 5 senki nem tudja"
          subtitle="A legszorosabb városok, ahol alig van különbség."
          tone="neutral"
          items={nobodyKnows}
          valueLabel={(item) => `${Math.abs(item.diff)}`}
          valueForBar={(item) => Math.max(1, item.total)}
        />
      </div>
    </main>
  );
}
