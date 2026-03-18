import type { Metadata } from "next";
import { PageIntro, PageShell } from "../../../components/PageChrome";
import CityBlocGridClient from "../../../components/CityBlocGridClient";
import { getCityRankingDetailItemsByBloc, type CityRankingDetailItem } from "../../../lib/dashboardDetailData";
import { getSectionNavItems } from "../../../lib/navigation";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "A nem városok",
  description: "Nem vezetésű városok teljes listája görgetéses betöltéssel.",
  path: "/dashboard/nem",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardNemCitiesPage() {
  let items: CityRankingDetailItem[] = [];
  let hasMore = false;
  try {
    const data = await getCityRankingDetailItemsByBloc("no", 0, 10);
    items = data.items;
    hasMore = data.hasMore;
  } catch {
    items = [];
    hasMore = false;
  }

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <PageIntro eyebrow="Grafikon" title="A nem városok" intro="A nem vezetésű városok teljes listája görgetéses betöltéssel." />
      <CityBlocGridClient
        bloc="no"
        title="A nem városok"
        subtitle="Teljes lista: görgetéskor 10-es blokkokban töltődik."
        initialItems={items}
        initialHasMore={hasMore}
      />
    </PageShell>
  );
}
