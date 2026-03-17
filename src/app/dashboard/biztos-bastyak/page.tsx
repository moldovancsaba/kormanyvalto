import type { Metadata } from "next";
import { PageShell } from "../../../components/PageChrome";
import { CityRankingCard } from "../../../components/dashboard/CityRankingCard";
import { getSectionNavItems } from "../../../lib/navigation";
import { getStrongestBastionDetailItems } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Biztos bástyák",
  description: "A legnagyobb különbséggel vezető EVK-k teljes listája, a felső 20%-ból.",
  path: "/dashboard/biztos-bastyak",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardBiztosBastyakPage() {
  const items = await getStrongestBastionDetailItems().catch(() => []);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <CityRankingCard
        title="Biztos bástyák"
        subtitle="Teljes lista a legnagyobb különbséggel vezető EVK-k 20%-ából."
        emptyText="Nincs még elég EVK adat a biztos bástyák listához."
        items={items}
        mode="strongest"
      />
    </PageShell>
  );
}
