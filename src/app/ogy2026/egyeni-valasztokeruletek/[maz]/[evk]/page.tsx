import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VoteWidget from "../../../../../components/VoteWidget";
import { constituencies, findConstituency } from "../../../../../lib/constituencies";
import { buildPageMetadata } from "../../../../../lib/siteMetadata";

type PageProps = {
  params: Promise<{ maz: string; evk: string }>;
};

export async function generateStaticParams() {
  return constituencies.map((c) => ({ maz: c.maz, evk: c.evk }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { maz, evk } = await params;
  const item = findConstituency(maz, evk);

  if (!item) {
    return buildPageMetadata({
      title: "Váltani akarsz?",
      description: "A keresett választókerület nem érhető el.",
      path: `/ogy2026/egyeni-valasztokeruletek/${maz}/${evk}`,
    });
  }

  return buildPageMetadata({
    title: "Váltani akarsz?",
    description: `${item.mazNev}, ${item.szekhely}`,
    path: `/ogy2026/egyeni-valasztokeruletek/${item.maz}/${item.evk}`,
  });
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
      <VoteWidget
        scope={scope}
        heroTitle={
          <h1>
            {item.evkNev} - {item.szekhely}
          </h1>
        }
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
