import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "../../lib/siteMetadata";
import { CityVoteStat, getDashboardCityStats } from "../../lib/results";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Grafikon",
  description: "Kormanyvalto dashboard a legforróbb, legcsendesebb és legmegosztottabb városokkal.",
  path: "/dashboard",
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
              <article key={`${title}-${item.city}-${index}`} className="chart-column">
                <div className="chart-column-value">{valueLabel(item)}</div>
                <div className="chart-column-plot">
                  <div className="chart-column-bar" style={{ height: `${height}%` }} />
                </div>
                <div className="chart-column-label" title={`${item.city} - ${item.county}`}>
                  <strong>{item.city}</strong>
                  <span>{item.county}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  let stats: CityVoteStat[] = [];
  try {
    stats = await getDashboardCityStats();
  } catch {
    stats = [];
  }
  const votedCities = stats.filter((item) => item.total > 0);

  const warZone = [...votedCities].sort((a, b) => b.total - a.total || a.city.localeCompare(b.city, "hu")).slice(0, 10);
  const peaceIslands = [...votedCities].sort((a, b) => a.total - b.total || a.city.localeCompare(b.city, "hu")).slice(0, 10);
  const yesCities = [...votedCities].filter((item) => item.diff > 0).sort((a, b) => b.diff - a.diff || b.total - a.total).slice(0, 10);
  const noCities = [...votedCities].filter((item) => item.diff < 0).sort((a, b) => a.diff - b.diff || b.total - a.total).slice(0, 10);
  const nobodyKnows = [...votedCities].sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff) || b.total - a.total).slice(0, 10);

  return (
    <main className="dashboard-page list-page">
      <div className="hero-actions">
        <Link href="/" className="nav-link-button nav-link-button-small">
          Főoldal
        </Link>
        <Link href="/ogy2026/egyeni-valasztokeruletek" className="nav-link-button nav-link-button-small">
          OGY 2026 körzetek listája
        </Link>
      </div>

      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Grafikon</p>
        <h1>Kormanyváltó dashboard</h1>
        <p className="dashboard-intro">
          A legforróbb városok, a legcsendesebb körzetközpontok, és azok a helyek, ahol az igen és a nem fej fej mellett halad.
        </p>
      </header>

      <div className="dashboard-grid">
        <ChartCard
          title="Top 10 háborús övezet"
          subtitle="A legtöbb összesített szavazatot kapó városok."
          tone="warm"
          items={warZone}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <ChartCard
          title="Top 10 a béke szigetei"
          subtitle="A legkevesebb, de már mért aktivitást mutató városok."
          tone="cool"
          items={peaceIslands}
          valueLabel={(item) => `${item.total}`}
          valueForBar={(item) => item.total}
        />
        <ChartCard
          title="Top 10 az igen városok"
          subtitle="Ahol az igen a legnagyobb különbséggel vezet."
          tone="yes"
          items={yesCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => item.diff}
        />
        <ChartCard
          title="Top 10 a nem városok"
          subtitle="Ahol a nem a legnagyobb különbséggel dominál."
          tone="no"
          items={noCities}
          valueLabel={(item) => formatSignedDiff(item.diff)}
          valueForBar={(item) => Math.abs(item.diff)}
        />
        <ChartCard
          title="Top 10 senki nem tudja"
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
