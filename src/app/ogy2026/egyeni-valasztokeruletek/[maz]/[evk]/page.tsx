import Link from "next/link";
import { notFound } from "next/navigation";
import VoteWidget from "../../../../../components/VoteWidget";
import { constituencies, findConstituency } from "../../../../../lib/constituencies";

type PageProps = {
  params: Promise<{ maz: string; evk: string }>;
};

export async function generateStaticParams() {
  return constituencies.map((c) => ({ maz: c.maz, evk: c.evk }));
}

export default async function ConstituencyVotePage({ params }: PageProps) {
  const { maz, evk } = await params;
  const item = findConstituency(maz, evk);

  if (!item) {
    notFound();
  }

  const scope = `ogy2026/egyeni-valasztokeruletek/${item.maz}/${item.evk}`;

  return (
    <>
      <main className="list-page list-page--narrow">
        <h1>
          {item.evkNev} - {item.szekhely}
        </h1>
        <p className="list-subtitle">{item.mazNev}</p>
      </main>

      <VoteWidget
        scope={scope}
        topActions={
          <>
            <Link href="/" className="nav-link-button nav-link-button-small">
              Főoldal
            </Link>
            <Link href={`/ogy2026/egyeni-valasztokeruletek/${item.maz}`} className="nav-link-button nav-link-button-small">
              Vissza a vármegyéhez
            </Link>
            <a
              href={item.sourceUrl}
              className="nav-link-button nav-link-button-small nav-link-button-secondary"
              target="_blank"
              rel="noreferrer"
            >
              Forrás (NVI)
            </a>
          </>
        }
      />
    </>
  );
}
