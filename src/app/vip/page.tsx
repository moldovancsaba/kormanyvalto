import type { Metadata } from "next";
import { PageActionLinks, PageHero, PageIntro } from "../../components/PageChrome";
import VipVoteWidget from "../../components/VipVoteWidget";
import { getVipNavItems } from "../../lib/navigation";
import { buildPageMetadata } from "../../lib/siteMetadata";

export const metadata: Metadata = buildPageMetadata({
  title: "VIP Szavazás 2026",
  description: "VIP befolyásolói szavazási felület. Véletlen súly, véletlen cooldown, ranglista.",
  path: "/vip",
});

export default function VipHomePage() {
  return (
    <VipVoteWidget
      scope="main"
      hero={<PageHero />}
      pageIntro={
        <PageIntro
          eyebrow="VIP"
          title="VIP szavazás"
          intro="VIP befolyásolói felület. 1x-7x véletlen súly, 1-7mp véletlen cooldown. Google belépés szükséges."
        />
      }
      topActions={<PageActionLinks items={getVipNavItems()} small={false} />}
    />
  );
}
