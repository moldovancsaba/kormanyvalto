import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../../../components/PageChrome";
import { constituencies, getCounties } from "../../../lib/constituencies";
import { getSectionNavItems } from "../../../lib/navigation";
import { getScopeVoteCounts } from "../../../lib/results";
import { buildPageMetadata } from "../../../lib/siteMetadata";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Szavazás 2026 - OGY 2026 vármegyei lista",
  description: "Szavazás 2026 vármegyei lista és körzetnavigáció.",
  path: "/ogy2026/egyeni-valasztokeruletek",
});

export default async function Ogy2026ConstituenciesPage() {
  const counties = getCounties();
  const scopes = constituencies.map((c) => `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`);

  let counts: Record<string, { yes: number; no: number; yesPercent: number }> = {};
  try {
    counts = await getScopeVoteCounts(scopes);
  } catch {
    counts = {};
  }

  return (
    <PageShell navItems={getSectionNavItems("/ogy2026/egyeni-valasztokeruletek")}>
      <h1>OGY 2026 vármegyei lista</h1>
      <p className="list-subtitle">1. lépés: válassz vármegyét. Utána megmutatjuk az adott vármegye összes egyéni körzetét.</p>

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
