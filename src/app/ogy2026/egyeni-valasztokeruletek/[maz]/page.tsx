import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro, PageShell } from "../../../../components/PageChrome";
import { getConstituenciesByCounty, getCounties, getSeatLabel } from "../../../../lib/constituencies";
import { getScopeVoteCounts } from "../../../../lib/results";
import { getSectionNavItems } from "../../../../lib/navigation";
import { buildPageMetadata } from "../../../../lib/siteMetadata";

type PageProps = {
  params: Promise<{ maz: string }>;
};

export const revalidate = 120;

export function generateStaticParams() {
  return getCounties().map((c) => ({ maz: c.maz }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { maz } = await params;
  const countyConstituencies = getConstituenciesByCounty(maz);

  if (countyConstituencies.length === 0) {
    return buildPageMetadata({
      title: `Szavazás 2026 - ${maz}`,
      description: "A keresett vármegyei lista nem érhető el.",
      path: `/ogy2026/egyeni-valasztokeruletek/${maz}`,
    });
  }

  return buildPageMetadata({
    title: `Szavazás 2026 - ${countyConstituencies[0].mazNev}`,
    description: countyConstituencies[0].mazNev,
    path: `/ogy2026/egyeni-valasztokeruletek/${maz}`,
  });
}

export default async function CountyPage({ params }: PageProps) {
  const { maz } = await params;
  const countyConstituencies = getConstituenciesByCounty(maz);

  if (countyConstituencies.length === 0) {
    notFound();
  }

  const countyName = countyConstituencies[0].mazNev;
  const constituencyCount = countyConstituencies.length;
  const scopes = countyConstituencies.map((c) => `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`);

  let counts: Record<string, { yes: number; no: number; yesPercent: number }> = {};
  try {
    counts = await getScopeVoteCounts(scopes);
  } catch {
    counts = {};
  }

  return (
    <PageShell
      navItems={getSectionNavItems("/ogy2026/egyeni-valasztokeruletek", [
        { href: "/ogy2026/egyeni-valasztokeruletek", label: "Vissza a listához" },
      ])}
    >
      <PageIntro
        eyebrow="EVK 2026"
        title={countyName}
        intro="2. lépés: válassz egyéni választókerületet. Innen közvetlenül a szavazáshoz jutsz."
      />

      <section className="context-panel" aria-label="Vármegyei navigációs összefoglaló">
        <p className="context-panel-eyebrow">Vármegyei nézet</p>
        <p className="context-panel-title">{countyName}</p>
        <p className="context-panel-copy">{constituencyCount} körzet közül választhatsz. Minden sor közvetlenül a megfelelő EVK oldalára visz.</p>
      </section>

      <section className="button-list" aria-label="Körzetek listája">
        {countyConstituencies.map((c) => {
          const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
          const stat = counts[scope] ?? { yes: 0, no: 0, yesPercent: 50 };
          const yesPercent = Number(stat.yesPercent.toFixed(1));

          return (
            <Link
              key={`${c.maz}-${c.evk}`}
              href={`/ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`}
              className="route-button route-button--barometer"
            >
              <svg viewBox="0 0 100 10" className="route-button-barometer-bg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <rect x="0" y="0" width="100" height="10" className="route-button-bar-no" />
                <rect x="0" y="0" width={yesPercent} height="10" className="route-button-bar-yes" />
              </svg>
              <span className="route-button-content">
                <span className="route-button-title">
                  {c.evkNev} - {getSeatLabel(c.szekhely)}
                </span>
                <span className="route-button-meta">
                  igen: {stat.yes} | nem: {stat.no}
                </span>
              </span>
            </Link>
          );
        })}
      </section>
    </PageShell>
  );
}
