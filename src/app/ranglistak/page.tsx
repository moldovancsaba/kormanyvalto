import type { Metadata } from "next";
import { PageActionLinks, PageHero, PageIntro } from "../../components/PageChrome";
import VipLeaderboard from "../../components/VipLeaderboard";
import { getRootNavItems } from "../../lib/navigation";
import { buildPageMetadata } from "../../lib/siteMetadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Ranglisták 2026",
  description: "VIP felhasználói és körzeti ranglisták.",
  path: "/ranglistak",
});

export default function RanglistakPage() {
  return (
    <main className="app">
      <PageHero />
      <PageActionLinks items={getRootNavItems()} small={false} />
      <PageIntro
        eyebrow="Ranglisták"
        title="VIP ranglisták"
        intro="A legaktívabb VIP szavazók és a legtöbb VIP szavazatot kapó körzetek. Csatlakozz te is a VIP szavazáshoz!"
      />
      <VipLeaderboard />
    </main>
  );
}
