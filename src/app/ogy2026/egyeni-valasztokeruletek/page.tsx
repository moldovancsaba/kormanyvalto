import Link from "next/link";
import { constituencies } from "../../../lib/constituencies";

export default function Ogy2026ConstituenciesPage() {
  return (
    <main className="list-page">
      <h1>OGY 2026 egyéni választókerületek</h1>
      <p className="list-subtitle">Egyszerű gomblista az összes körzethez.</p>

      <section className="button-list" aria-label="Körzetek listája">
        {constituencies.map((c) => (
          <Link
            key={`${c.maz}-${c.evk}`}
            href={`/ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`}
            className="route-button"
          >
            {c.evkNev} - {c.szekhely}
          </Link>
        ))}
      </section>
    </main>
  );
}
