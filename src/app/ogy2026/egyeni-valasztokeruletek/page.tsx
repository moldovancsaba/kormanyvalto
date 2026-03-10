import Link from "next/link";
import { constituencies } from "../../../lib/constituencies";
import { getScopeVoteCounts } from "../../../lib/results";

export const revalidate = 900;

export default async function Ogy2026ConstituenciesPage() {
  const scopes = constituencies.map((c) => `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`);
  let counts: Record<string, { yes: number; no: number; yesPercent: number }> = {};

  try {
    counts = await getScopeVoteCounts(scopes);
  } catch {
    counts = {};
  }

  return (
    <main className="list-page">
      <h1>OGY 2026 egyéni választókerületek</h1>
      <p className="list-subtitle">Frissítés 15 percenként. A gomb háttere a körzet barométere.</p>

      <section className="button-list" aria-label="Körzetek listája">
        {constituencies.map((c) => {
          const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
          const stat = counts[scope] ?? { yes: 0, no: 0, yesPercent: 50 };
          const yesPercent = Number(stat.yesPercent.toFixed(1));
          const background = `linear-gradient(90deg, #15803d 0%, #15803d ${yesPercent}%, #b91c1c ${yesPercent}%, #b91c1c 100%)`;

          return (
            <Link
              key={`${c.maz}-${c.evk}`}
              href={`/ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`}
              className="route-button route-button--barometer"
              style={{ backgroundImage: background }}
            >
              <span className="route-button-title">
                {c.evkNev} - {c.szekhely}
              </span>
              <span className="route-button-meta">
                igen: {stat.yes} | nem: {stat.no}
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
