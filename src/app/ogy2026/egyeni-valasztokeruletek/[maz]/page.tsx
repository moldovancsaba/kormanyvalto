import Link from "next/link";
import { notFound } from "next/navigation";
import { getConstituenciesByCounty, getCounties } from "../../../../lib/constituencies";
import { getScopeVoteCounts } from "../../../../lib/results";

type PageProps = {
  params: Promise<{ maz: string }>;
};

export const revalidate = 900;

export function generateStaticParams() {
  return getCounties().map((c) => ({ maz: c.maz }));
}

export default async function CountyPage({ params }: PageProps) {
  const { maz } = await params;
  const countyConstituencies = getConstituenciesByCounty(maz);

  if (countyConstituencies.length === 0) {
    notFound();
  }

  const countyName = countyConstituencies[0].mazNev;
  const scopes = countyConstituencies.map((c) => `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`);

  let counts: Record<string, { yes: number; no: number; yesPercent: number }> = {};
  try {
    counts = await getScopeVoteCounts(scopes);
  } catch {
    counts = {};
  }

  return (
    <main className="list-page">
      <h1>{countyName}</h1>
      <p className="list-subtitle">Válassz egyéni választókerületet.</p>

      <div className="page-actions">
        <Link href="/ogy2026/egyeni-valasztokeruletek" className="small-link-btn">
          Vissza a vármegyékhez
        </Link>
      </div>

      <section className="button-list" aria-label="Körzetek listája">
        {countyConstituencies.map((c) => {
          const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
          const stat = counts[scope] ?? { yes: 0, no: 0, yesPercent: 50 };
          const yesPercent = Number(stat.yesPercent.toFixed(1));
          const background = `linear-gradient(90deg, #ed4653 0%, #ed4653 ${yesPercent}%, #ff6f0f ${yesPercent}%, #ff6f0f 100%)`;

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
