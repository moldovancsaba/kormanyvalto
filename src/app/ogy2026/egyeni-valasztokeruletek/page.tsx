import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../../../components/PageChrome";
import { constituencies, getCounties } from "../../../lib/constituencies";
import { getHungaryCountyMapData } from "../../../lib/hungaryCountyMap";
import { getSectionNavItems } from "../../../lib/navigation";
import { getLeadBlocFromCounts, getScopeVoteCounts } from "../../../lib/results";
import { buildPageMetadata } from "../../../lib/siteMetadata";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Váltani akarsz?",
  description: "OGY 2026 körzetek listája",
  path: "/ogy2026/egyeni-valasztokeruletek",
});

type CountyMapStat = {
  maz: string;
  name: string;
  yes: number;
  no: number;
  leadBloc: "yes" | "no" | "neutral";
};

function CountyMapCard({ items }: { items: CountyMapStat[] }) {
  const byMaz = new Map(items.map((item) => [item.maz, item]));
  const countyMap = getHungaryCountyMapData();
  const countyPaths = new Map(countyMap.counties.map((item) => [item.countyCode, item]));

  return (
    <section className="chart-card chart-card-neutral county-map-card">
      <header className="chart-card-head">
        <h2>Vármegye térkép</h2>
        <p>Aktuális állás vármegyénként (igen / nem / döntetlen).</p>
      </header>
      <div className="county-map-wrap">
        <svg viewBox={countyMap.viewBox} className="county-map-svg" role="img" aria-label="Magyarország vármegyei térkép">
          {getCounties().map((county) => {
            const stat = byMaz.get(county.maz) ?? { maz: county.maz, name: county.mazNev, yes: 0, no: 0, leadBloc: "neutral" as const };
            const countyPath = countyPaths.get(county.maz);
            if (!countyPath) return null;
            return (
              <a key={county.maz} href={`/ogy2026/egyeni-valasztokeruletek/${county.maz}`}>
                <path d={countyPath.pathData} className={`county-shape county-shape-${stat.leadBloc}`}>
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

export default async function Ogy2026ConstituenciesPage() {
  const counties = getCounties();
  const scopes = constituencies.map((c) => `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`);

  let counts: Record<string, { yes: number; no: number; yesPercent: number }> = {};
  let countyStats: CountyMapStat[] = [];
  try {
    counts = await getScopeVoteCounts(scopes);
    countyStats = counties.map((county) => {
      const countyConstituencies = constituencies.filter((c) => c.maz === county.maz);
      const yes = countyConstituencies.reduce((sum, c) => {
        const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
        return sum + (counts[scope]?.yes ?? 0);
      }, 0);
      const no = countyConstituencies.reduce((sum, c) => {
        const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
        return sum + (counts[scope]?.no ?? 0);
      }, 0);
      return {
        maz: county.maz,
        name: county.mazNev,
        yes,
        no,
        leadBloc: getLeadBlocFromCounts(yes, no),
      };
    });
  } catch {
    counts = {};
    countyStats = [];
  }

  return (
    <PageShell navItems={getSectionNavItems("/ogy2026/egyeni-valasztokeruletek")}>
      <h1>OGY 2026 vármegyei lista</h1>
      <p className="list-subtitle">Frissítés 120 másodpercenként. Válassz vármegyét.</p>
      <CountyMapCard items={countyStats} />

      <section className="button-list" aria-label="Vármegyék listája">
        {counties.map((county) => {
          const countyConstituencies = constituencies.filter((c) => c.maz === county.maz);
          const totalYes = countyConstituencies.reduce((sum, c) => {
            const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
            return sum + (counts[scope]?.yes ?? 0);
          }, 0);
          const totalNo = countyConstituencies.reduce((sum, c) => {
            const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
            return sum + (counts[scope]?.no ?? 0);
          }, 0);
          const total = totalYes + totalNo;
          const yesPercent = total === 0 ? 50 : Number(((totalYes / total) * 100).toFixed(1));
          return (
            <Link
              key={county.maz}
              href={`/ogy2026/egyeni-valasztokeruletek/${county.maz}`}
              className="route-button route-button--barometer"
            >
              <svg viewBox="0 0 100 10" className="route-button-barometer-bg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <rect x="0" y="0" width="100" height="10" className="route-button-bar-no" />
                <rect x="0" y="0" width={yesPercent} height="10" className="route-button-bar-yes" />
              </svg>
              <span className="route-button-content">
                <span className="route-button-title">{county.mazNev}</span>
                <span className="route-button-meta">
                  körzetek: {countyConstituencies.length} | igen: {totalYes} | nem: {totalNo}
                </span>
              </span>
            </Link>
          );
        })}
      </section>
    </PageShell>
  );
}
