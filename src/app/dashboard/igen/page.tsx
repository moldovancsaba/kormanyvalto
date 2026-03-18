import type { Metadata } from "next";
import { PageIntro, PageShell } from "../../../components/PageChrome";
import CityBlocGridClient from "../../../components/CityBlocGridClient";
import { getCityRankingDetailItemsByBloc, type CityRankingDetailItem } from "../../../lib/dashboardDetailData";
import { getSectionNavItems } from "../../../lib/navigation";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Az igen városok",
  description: "Igen vezetésű városok teljes listája görgetéses betöltéssel.",
  path: "/dashboard/igen",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardIgenCitiesPage() {
  let items: CityRankingDetailItem[] = [];
  let hasMore = false;
  try {
    const data = await getCityRankingDetailItemsByBloc("yes", 0, 10);
    items = data.items;
    hasMore = data.hasMore;
  } catch {
    items = [];
    hasMore = false;
  }

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <PageIntro eyebrow="Grafikon" title="Az igen városok" intro="Az igen vezetésű városok teljes listája görgetéses betöltéssel." />
      <CityBlocGridClient
        bloc="yes"
        title="Az igen városok"
        subtitle="Teljes lista: görgetéskor 10-es blokkokban töltődik."
        initialItems={items}
        initialHasMore={hasMore}
      />
    </PageShell>
  );
}
