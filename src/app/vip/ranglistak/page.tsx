import type { Metadata } from "next";
import { PageActionLinks, PageHero, PageIntro } from "../../../components/PageChrome";
import VipLeaderboard from "../../../components/VipLeaderboard";
import { getVipNavItems } from "../../../lib/navigation";
import { buildPageMetadata } from "../../../lib/siteMetadata";

export const metadata: Metadata = buildPageMetadata({
  title: "VIP Ranglisták 2026",
  description: "VIP felhasználói és körzeti ranglisták.",
  path: "/vip/ranglistak",
});

export default function VipRanglistakPage() {
  return (
    <main className="app vip-app">
      <PageHero />
      <PageActionLinks items={getVipNavItems("/vip/ranglistak")} small={false} />
      <PageIntro
        eyebrow="VIP"
        title="Ranglisták"
        intro="VIP felhasználói és körzeti ranglisták. A legaktívabb VIP szavazók és a legtöbb VIP szavazatot kapó körzetek."
      />
      <VipLeaderboard />
    </main>
  );
}
