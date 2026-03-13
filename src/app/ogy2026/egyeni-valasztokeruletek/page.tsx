import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { constituencies, getCounties } from "../../../lib/constituencies";
import { getScopeVoteCounts } from "../../../lib/results";
import { buildPageMetadata } from "../../../lib/siteMetadata";

export const revalidate = 900;

export const metadata: Metadata = buildPageMetadata({
  title: "Váltani akarsz?",
  description: "OGY 2026 körzetek listája",
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
    <main className="list-page">
      <div className="top-logo">
        <Image
          src="/images/hero_vote.png"
          alt="Szavazás 2026 hero"
          width={1536}
          height={1024}
          priority
        />
      </div>
      <div className="hero-actions">
        <Link href="/" className="nav-link-button nav-link-button-small">
          Főoldal
        </Link>
      </div>

      <h1>OGY 2026 vármegyei lista</h1>
      <p className="list-subtitle">Frissítés 15 percenként. Válassz vármegyét.</p>

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
          const background = `linear-gradient(90deg, var(--yes) 0%, var(--yes) ${yesPercent}%, var(--no) ${yesPercent}%, var(--no) 100%)`;

          return (
            <Link
              key={county.maz}
              href={`/ogy2026/egyeni-valasztokeruletek/${county.maz}`}
              className="route-button route-button--barometer"
              style={{ backgroundImage: background }}
            >
              <span className="route-button-title">{county.mazNev}</span>
              <span className="route-button-meta">
                körzetek: {countyConstituencies.length} | igen: {totalYes} | nem: {totalNo}
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
