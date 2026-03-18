import type { Metadata } from "next";
import { PageIntro, PageShell } from "../../../components/PageChrome";
import { CityRankingCard } from "../../../components/dashboard/CityRankingCard";
import { getSectionNavItems } from "../../../lib/navigation";
import { getClosestBattlegroundDetailItems } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Csataterek",
  description: "A legszorosabb EVK-k teljes listája, a legalacsonyabb 20%-ból.",
  path: "/dashboard/csataterek",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardCsataterekPage() {
  const items = await getClosestBattlegroundDetailItems().catch(() => []);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <PageIntro eyebrow="Grafikon" title="Csataterek" intro="A legszorosabb EVK-k teljes listája, ahol minden szavazat számít." />
      <CityRankingCard
        title="Csataterek"
        subtitle="Teljes lista a legszorosabb EVK-k 20%-ából."
        emptyText="Nincs még elég EVK adat a csatatér listához."
        items={items}
        mode="closest"
      />
    </PageShell>
  );
}
