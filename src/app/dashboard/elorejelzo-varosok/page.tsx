import type { Metadata } from "next";
import { PageIntro, PageShell } from "../../../components/PageChrome";
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
      <PageIntro eyebrow="Grafikon" title="Előrejelző városok" intro="Azok az EVK-k, ahol a helyi arány a legközelebb áll az országos arányhoz." />
      <CityRankingCard
        title="Előrejelző városok"
        subtitle="Teljes lista az országos arányhoz 20 százalékponton belül álló EVK-król."
        emptyText="Még nincs elég EVK adat ehhez a listához."
        items={items}
        mode="indicator"
        nationalYesPercent={nationalYesPercent}
      />
    </PageShell>
  );
}
