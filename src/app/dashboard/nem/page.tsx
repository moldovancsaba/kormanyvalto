import type { Metadata } from "next";
import { PageShell } from "../../../components/PageChrome";
import CityBlocGridClient from "../../../components/CityBlocGridClient";
import { getSectionNavItems } from "../../../lib/navigation";
import { getCityStatsByBloc, type CityVoteStat } from "../../../lib/results";
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
  let items: CityVoteStat[] = [];
  let hasMore = false;
  try {
    const data = await getCityStatsByBloc("no", 0, 10);
    items = data.items;
    hasMore = data.hasMore;
  } catch {
    items = [];
    hasMore = false;
  }

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
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
