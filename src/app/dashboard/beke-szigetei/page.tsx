import type { Metadata } from "next";
import { PageShell } from "../../../components/PageChrome";
import { CityRankingCard } from "../../../components/dashboard/CityRankingCard";
import { getSectionNavItems } from "../../../lib/navigation";
import { getPeaceIslandDetailItems } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "A béke szigetei",
  description: "A legalacsonyabb aktivitású EVK-k teljes listája, a legalacsonyabb 20%-ból.",
  path: "/dashboard/beke-szigetei",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardBekeSzigeteiPage() {
  const items = await getPeaceIslandDetailItems().catch(() => []);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <CityRankingCard
        title="A béke szigetei"
        subtitle="Teljes lista a legalacsonyabb aktivitású EVK-k 20%-ából."
        emptyText="Nincs még elég EVK adat a béke szigetei listához."
        items={items}
        mode="closest"
      />
    </PageShell>
  );
}
