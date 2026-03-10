import Link from "next/link";
import { constituencies, getCounties } from "../../../lib/constituencies";
import { getScopeVoteCounts } from "../../../lib/results";

export const revalidate = 900;

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
      <h1>OGY 2026 vármegyei lista</h1>
      <p className="list-subtitle">Frissítés 15 percenként. Válassz vármegyét.</p>
      <div className="page-actions">
        <Link href="/" className="small-link-btn">
          Főoldal
        </Link>
      </div>

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
          const background = `linear-gradient(90deg, #ed4653 0%, #ed4653 ${yesPercent}%, #ff6f0f ${yesPercent}%, #ff6f0f 100%)`;

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
