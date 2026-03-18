import type { Metadata } from "next";
import { PageShell } from "../../../components/PageChrome";
import { CityRankingCard } from "../../../components/dashboard/CityRankingCard";
import { getSectionNavItems } from "../../../lib/navigation";
import { getWarZoneDetailItems } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Háborús övezetek",
  description: "A legmagasabb aktivitású EVK-k teljes listája, a felső 20%-ból.",
  path: "/dashboard/haborus-ovezetek",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardHaborusOvezetekPage() {
  const items = await getWarZoneDetailItems().catch(() => []);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <CityRankingCard
        title="Háborús övezetek"
        subtitle="Teljes lista a legmagasabb aktivitású EVK-k 20%-ából."
        emptyText="Nincs még elég EVK adat a háborús övezetek listához."
        items={items}
        mode="activity-high"
      />
    </PageShell>
  );
}
