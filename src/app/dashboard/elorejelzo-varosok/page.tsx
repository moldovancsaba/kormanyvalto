import type { Metadata } from "next";
import { PageShell } from "../../../components/PageChrome";
import { CityRankingCard } from "../../../components/dashboard/CityRankingCard";
import { getSectionNavItems } from "../../../lib/navigation";
import { getIndicatorCityDetailItems, getNationalYesPercent } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Előrejelző városok",
  description: "Az országos arányt 20 százalékponton belül követő EVK-k teljes listája.",
  path: "/dashboard/elorejelzo-varosok",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardElorejelzoVarosokPage() {
  const [items, nationalYesPercent] = await Promise.all([
    getIndicatorCityDetailItems().catch(() => []),
    getNationalYesPercent().catch(() => 50),
  ]);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <CityRankingCard
        title="Előrejelző városok"
        subtitle="Teljes lista az országos arányhoz 20 százalékponton belül álló EVK-król."
        emptyText="Nincs még elég adat az előrejelző városok listához."
        items={items}
        mode="indicator"
        nationalYesPercent={nationalYesPercent}
      />
    </PageShell>
  );
}
