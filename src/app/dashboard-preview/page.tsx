import type { Metadata } from "next";
import { PageShell } from "../../components/PageChrome";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { CountyRankingCard } from "../../components/dashboard/CountyRankingCard";
import { LeadOverviewCard } from "../../components/dashboard/LeadOverviewCard";
import { ListVotePreviewCard } from "../../components/dashboard/ListVotePreviewCard";
import { PieCard } from "../../components/dashboard/PieCard";
import { ReportingCoverageCard } from "../../components/dashboard/ReportingCoverageCard";
import { type DashboardPreviewMetrics, getDashboardPreviewMetrics } from "../../lib/dashboardPreviewData";
import { getMatrixStatus } from "../../lib/matrixStatus";
import { getSectionNavItems } from "../../lib/navigation";
import { formatNumber } from "../../lib/numberFormat";
import { createEmptyParliamentEstimate, getParliamentEstimate } from "../../lib/results";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard Preview",
  description: "Kísérleti előnézeti oldal új dashboard grafikonok teszteléséhez.",
  path: "/dashboard-preview",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardPreviewPage() {
  let metrics: DashboardPreviewMetrics = {
    leadOverview: {
      totalWeightedVotes: 0,
      weightedYes: 0,
      weightedNo: 0,
      yesPercent: 0,
      noPercent: 0,
      leadBloc: "neutral" as const,
      matrixText: "Nincs még elég adat az országos állapot meghatározásához.",
      marginVotes: 0,
      marginPercent: 0,
    },
    reportingCoverage: {
      activeDistricts: 0,
      totalDistricts: 0,
      activeCounties: 0,
      totalCounties: 0,
      hasNationalVotes: false,
    },
    totalRegisteredPlayers: 0,
    weightedTripleVotes: 0,
    weightedRegularVotes: 0,
    topClosestCities: [],
    topStrongestCities: [],
    topActiveCounties: [],
    topBalancedCounties: [],
    topWarZones: [],
    topPeaceIslands: [],
    topYesCities: [],
    topNoCities: [],
    topUncertainCities: [],
    topIndicatorCities: [],
  };
  let listVotePreview = {
    listBasisYes: 0,
    listBasisNo: 0,
    listYesSeats: 0,
    listNoSeats: 0,
    unresolvedListSeats: 93,
    yesPercent: 50,
    noPercent: 50,
    marginVotes: 0,
    marginPercent: 0,
    matrixText: "Nincs még elég adat a listás állás meghatározásához.",
  };
  try {
    const [nextMetrics, listEstimate] = await Promise.all([getDashboardPreviewMetrics(), getParliamentEstimate("projection")]);
    metrics = nextMetrics;
    const listTotal = listEstimate.listBasisYes + listEstimate.listBasisNo;
    const yesPercent = listTotal > 0 ? (listEstimate.listBasisYes / listTotal) * 100 : 50;
    const noPercent = listTotal > 0 ? (listEstimate.listBasisNo / listTotal) * 100 : 50;
    const marginVotes = Math.abs(listEstimate.listBasisYes - listEstimate.listBasisNo);
    const marginPercent = listTotal > 0 ? (marginVotes / listTotal) * 100 : 0;
    listVotePreview = {
      listBasisYes: listEstimate.listBasisYes,
      listBasisNo: listEstimate.listBasisNo,
      listYesSeats: listEstimate.listYesSeats,
      listNoSeats: listEstimate.listNoSeats,
      unresolvedListSeats: listEstimate.unresolvedListSeats,
      yesPercent,
      noPercent,
      marginVotes,
      marginPercent,
      matrixText: getMatrixStatus(
        listEstimate.listBasisYes,
        listEstimate.listBasisNo,
        listEstimate.totalYesSeats,
        listEstimate.totalNoSeats
      ).text,
    };
  } catch {
    // Keep zero-value fallback metrics.
    const fallbackEstimate = createEmptyParliamentEstimate("projection");
    listVotePreview = {
      listBasisYes: fallbackEstimate.listBasisYes,
      listBasisNo: fallbackEstimate.listBasisNo,
      listYesSeats: fallbackEstimate.listYesSeats,
      listNoSeats: fallbackEstimate.listNoSeats,
      unresolvedListSeats: fallbackEstimate.unresolvedListSeats,
      yesPercent: 50,
      noPercent: 50,
      marginVotes: 0,
      marginPercent: 0,
      matrixText: "Nincs még elég adat a listás állás meghatározásához.",
    };
  }

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Dashboard Preview</p>
        <h1>Előnézet</h1>
        <p className="dashboard-intro">Csak a még nem publikált modulok és kísérleti panelek.</p>
      </header>

      <div className="dashboard-grid">
        <ListVotePreviewCard initialData={listVotePreview} />
        <LeadOverviewCard
          statusText={metrics.leadOverview.matrixText}
          marginVotes={metrics.leadOverview.marginVotes}
          marginPercent={metrics.leadOverview.marginPercent}
          yesCount={metrics.leadOverview.weightedYes}
          noCount={metrics.leadOverview.weightedNo}
          yesPercent={metrics.leadOverview.yesPercent}
          noPercent={metrics.leadOverview.noPercent}
        />
        <ReportingCoverageCard metric={metrics.reportingCoverage} />
        <CountyRankingCard
          title="Aktív vármegyék (preview)"
          subtitle="A legtöbb összesített szavazatot kapó vármegyék."
          emptyText="Nincs még vármegyei aktivitási adat."
          items={metrics.topActiveCounties}
          mode="activity"
        />
        <KpiCard
          variant="preview"
          label="Összes regisztrált játékos (preview)"
          value={formatNumber(metrics.totalRegisteredPlayers)}
          detail="A 3x VOTE módot használó belépett játékosok"
        />
        <PieCard
          variant="preview"
          title="3x-os szavazatok vs sima szavazatok (preview)"
          subtitle="Súlyozott összesítés a belépett és anonim játékmód között."
          leftLabel="3x-os"
          leftValue={metrics.weightedTripleVotes}
          rightLabel="sima"
          rightValue={metrics.weightedRegularVotes}
          leftTone="no"
          rightTone="yes"
        />
      </div>
    </PageShell>
  );
}
