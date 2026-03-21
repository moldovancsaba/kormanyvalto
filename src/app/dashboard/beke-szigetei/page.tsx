import type { Metadata } from "next";
import { PageIntro, PageShell } from "../../../components/PageChrome";
import { CityRankingCard } from "../../../components/dashboard/CityRankingCard";
import { getSectionNavItems } from "../../../lib/navigation";
import { getPeaceIslandDetailItems } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Béke szigetei",
  description: "A legalacsonyabb aktivitású EVK-k teljes listája, a legalacsonyabb 20%-ból.",
  path: "/dashboard/beke-szigetei",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardBekeSzigeteiPage() {
  const items = await getPeaceIslandDetailItems().catch(() => []);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <PageIntro eyebrow="Infóközpont" title="Béke szigetei" intro="A legalacsonyabb aktivitású EVK-k teljes listája." />
      <CityRankingCard
        title="Béke szigetei"
        subtitle="Teljes lista a legalacsonyabb aktivitású EVK-k 20%-ából."
        emptyText="Még nincs elég EVK adat ehhez a listához."
        items={items}
        mode="activity-low"
      />
    </PageShell>
  );
}
