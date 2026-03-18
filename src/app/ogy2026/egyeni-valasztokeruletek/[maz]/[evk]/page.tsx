import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageActionLinks, PageHero, PageIntro } from "../../../../../components/PageChrome";
import VoteWidget from "../../../../../components/VoteWidget";
import { constituencies, findConstituency, getSeatLabel } from "../../../../../lib/constituencies";
import { getSectionNavItems } from "../../../../../lib/navigation";
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
      title: `Szavazás 2026 - ${evk}`,
      description: "A keresett választókerület nem érhető el.",
      path: `/ogy2026/egyeni-valasztokeruletek/${maz}/${evk}`,
    });
  }

  return buildPageMetadata({
    title: `Szavazás 2026 - ${getSeatLabel(item.szekhely)}`,
    description: `${item.mazNev}, ${getSeatLabel(item.szekhely)}`,
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
        hero={<PageHero />}
        pageIntro={
          <PageIntro
            eyebrow={item.mazNev}
            title={getSeatLabel(item.szekhely)}
            intro={`${item.evkNev}. Ezen az oldalon ehhez az EVK-hoz adhatsz le igen vagy nem szavazatot.`}
          />
        }
        showDefaultHeading={false}
        topActions={
          <PageActionLinks
            items={[
              { href: `/ogy2026/egyeni-valasztokeruletek/${item.maz}`, label: "Vissza a vármegyéhez" },
              { href: "/ogy2026/egyeni-valasztokeruletek", label: "Összes vármegye", secondary: true },
              { href: item.sourceUrl, label: "Forrás (NVI)", secondary: true, external: true },
              ...getSectionNavItems("/ogy2026/egyeni-valasztokeruletek"),
            ]}
          />
        }
      />
    </>
  );
}
