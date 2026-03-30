import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageActionLinks, PageHero, PageIntro } from "../../../../../../components/PageChrome";
import VipVoteWidget from "../../../../../../components/VipVoteWidget";
import { constituencies, findConstituency, getSeatLabel } from "../../../../../../lib/constituencies";
import { getVipNavItems } from "../../../../../../lib/navigation";
import { buildPageMetadata } from "../../../../../../lib/siteMetadata";

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
      title: `VIP Szavazás 2026 - ${evk}`,
      description: "A keresett választókerület nem érhető el.",
      path: `/vip/ogy2026/egyeni-valasztokeruletek/${maz}/${evk}`,
    });
  }

  return buildPageMetadata({
    title: `VIP Szavazás 2026 - ${getSeatLabel(item.szekhely)}`,
    description: `VIP - ${item.mazNev}, ${getSeatLabel(item.szekhely)}`,
    path: `/vip/ogy2026/egyeni-valasztokeruletek/${item.maz}/${item.evk}`,
  });
}

export default async function VipConstituencyVotePage({ params }: PageProps) {
  const { maz, evk } = await params;
  const item = findConstituency(maz, evk);

  if (!item) {
    notFound();
  }

  const scope = `ogy2026/egyeni-valasztokeruletek/${item.maz}/${item.evk}`;

  return (
    <>
      <VipVoteWidget
        scope={scope}
        hero={<PageHero />}
        pageIntro={
          <PageIntro
            eyebrow={`VIP - ${item.mazNev}`}
            title={getSeatLabel(item.szekhely)}
            intro={`${item.evkNev}. VIP szavazás ehhez az EVK-hoz. 1x-7x véletlen súly, 1-7mp véletlen cooldown.`}
          />
        }
        topActions={
          <PageActionLinks
            items={[
              { href: `/vip/ogy2026/egyeni-valasztokeruletek/${item.maz}`, label: "Vissza a vármegyéhez" },
              { href: "/vip/ogy2026/egyeni-valasztokeruletek", label: "Vissza a listához", secondary: true },
              { href: item.sourceUrl, label: "NVI forrás", secondary: true, external: true },
              ...getVipNavItems("/vip/ogy2026/egyeni-valasztokeruletek"),
            ]}
          />
        }
      />
    </>
  );
}
