import type { Metadata } from "next";
import Link from "next/link";
import { CountyHeroMap } from "../../../components/CountyHeroMap";
import { PageShell } from "../../../components/PageChrome";
import { constituencies, getCounties } from "../../../lib/constituencies";
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
      <CountyHeroMap
        items={countyStats}
        title="Vármegye térkép"
        subtitle="Aktuális állás vármegyénként (igen / nem / döntetlen)."
        className="chart-card chart-card-neutral"
      />

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
