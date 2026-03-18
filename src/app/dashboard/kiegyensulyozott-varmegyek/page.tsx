import type { Metadata } from "next";
import { PageShell } from "../../../components/PageChrome";
import { CountyRankingCard } from "../../../components/dashboard/CountyRankingCard";
import { getSectionNavItems } from "../../../lib/navigation";
import { getBalancedCountyDetailItems } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Kiegyensúlyozott vármegyék",
  description: "A legszorosabb vármegyei állások teljes listája.",
  path: "/dashboard/kiegyensulyozott-varmegyek",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardKiegyensulyozottVarmegyekPage() {
  const items = await getBalancedCountyDetailItems().catch(() => []);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <CountyRankingCard
        title="Kiegyensúlyozott vármegyék"
        subtitle="Teljes lista ugyanabban a sorrendben, mint a dashboard blokk."
        emptyText="Nincs még kiegyensúlyozott vármegyei adat."
        items={items}
        mode="balance"
      />
    </PageShell>
  );
}
