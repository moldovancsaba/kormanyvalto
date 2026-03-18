import { constituencies, getCounties } from "./constituencies";
import { getBalancedCountyDetailItems, getDashboardTopMetrics } from "./dashboardDetailData";
import { getMatrixStatus } from "./matrixStatus";
import { getDashboardSummary, getLeadBlocFromCounts, getParliamentEstimate, getScopeVoteCounts } from "./results";

export type LeadOverviewMetric = {
  totalWeightedVotes: number;
  weightedYes: number;
  weightedNo: number;
  yesPercent: number;
  noPercent: number;
  leadBloc: "yes" | "no" | "neutral";
  matrixText: string;
  marginVotes: number;
  marginPercent: number;
};

export type ReportingCoverageMetric = {
  activeDistricts: number;
  totalDistricts: number;
  activeCounties: number;
  totalCounties: number;
  hasNationalVotes: boolean;
};

export type DashboardPreviewMetrics = {
  leadOverview: LeadOverviewMetric;
  reportingCoverage: ReportingCoverageMetric;
  totalRegisteredPlayers: number;
  weightedTripleVotes: number;
  weightedRegularVotes: number;
  topClosestCities: Array<{
    city: string;
    county: string;
    countyCode: string;
    countyHref: string;
    countyLeadBloc: "yes" | "no" | "neutral";
    districtLabel: string;
    href: string;
    totalVotes: number;
    marginPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topStrongestCities: Array<{
    city: string;
    county: string;
    countyCode: string;
    countyHref: string;
    countyLeadBloc: "yes" | "no" | "neutral";
    districtLabel: string;
    href: string;
    totalVotes: number;
    marginPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topActiveCounties: Array<{
    countyName: string;
    countyCode: string;
    href: string;
    totalVotes: number;
    marginPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topBalancedCounties: Array<{
    countyName: string;
    countyCode: string;
    href: string;
    totalVotes: number;
    marginPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topWarZones: Array<{
    city: string;
    county: string;
    districtLabel: string;
    href: string;
    totalVotes: number;
    diff: number;
    diffPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topPeaceIslands: Array<{
    city: string;
    county: string;
    districtLabel: string;
    href: string;
    totalVotes: number;
    diff: number;
    diffPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topYesCities: Array<{
    city: string;
    county: string;
    districtLabel: string;
    href: string;
    totalVotes: number;
    diff: number;
    diffPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topNoCities: Array<{
    city: string;
    county: string;
    districtLabel: string;
    href: string;
    totalVotes: number;
    diff: number;
    diffPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topUncertainCities: Array<{
    city: string;
    county: string;
    districtLabel: string;
    href: string;
    totalVotes: number;
    diff: number;
    diffPercent: number;
    leadBloc: "yes" | "no" | "neutral";
  }>;
  topIndicatorCities: Array<{
    city: string;
    county: string;
    countyCode: string;
    countyHref: string;
    countyLeadBloc: "yes" | "no" | "neutral";
    districtLabel: string;
    href: string;
    totalVotes: number;
    marginPercent: number;
    diff: number;
    diffPercent: number;
    leadBloc: "yes" | "no" | "neutral";
    indicatorDistance: number;
  }>;
};

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

export async function getDashboardPreviewMetrics(): Promise<DashboardPreviewMetrics> {
  const districtScopes = constituencies.map((constituency) => `ogy2026/egyeni-valasztokeruletek/${constituency.maz}/${constituency.evk}`);
  const [summary, districtCounts, projection, dashboardTopMetrics, balancedCountyItems] = await Promise.all([
    getDashboardSummary(),
    getScopeVoteCounts(districtScopes),
    getParliamentEstimate("projection"),
    getDashboardTopMetrics(),
    getBalancedCountyDetailItems(),
  ]);

  const totalWeightedVotes = summary.weightedYes + summary.weightedNo;
  const nationalYesPercent = totalWeightedVotes > 0 ? (summary.weightedYes / totalWeightedVotes) * 100 : 50;
  const marginVotes = Math.abs(summary.weightedYes - summary.weightedNo);
  const leadOverview: LeadOverviewMetric = {
    totalWeightedVotes,
    weightedYes: summary.weightedYes,
    weightedNo: summary.weightedNo,
    yesPercent: toPercent(summary.weightedYes, totalWeightedVotes),
    noPercent: toPercent(summary.weightedNo, totalWeightedVotes),
    leadBloc: getLeadBlocFromCounts(summary.weightedYes, summary.weightedNo),
    matrixText: getMatrixStatus(summary.weightedYes, summary.weightedNo, projection.totalYesSeats, projection.totalNoSeats).text,
    marginVotes,
    marginPercent: toPercent(marginVotes, totalWeightedVotes),
  };

  const activeDistrictScopes = new Set(
    districtScopes.filter((scope) => {
      const voteCount = districtCounts[scope];
      return Boolean(voteCount && voteCount.total > 0);
    })
  );

  const counties = getCounties();
  const activeCounties = counties.filter((county) =>
    constituencies.some((constituency) => {
      if (constituency.maz !== county.maz) return false;
      const scope = `ogy2026/egyeni-valasztokeruletek/${constituency.maz}/${constituency.evk}`;
      return activeDistrictScopes.has(scope);
    })
  ).length;

  const reportingCoverage: ReportingCoverageMetric = {
    activeDistricts: activeDistrictScopes.size,
    totalDistricts: districtScopes.length,
    activeCounties,
    totalCounties: counties.length,
    hasNationalVotes: summary.totalVoteEvents > 0,
  };

  // Preview keeps ownership of coverage/list-vote preview metrics, but ranking
  // sections should reuse the shared dashboard builder contracts so preview
  // cannot silently drift from production ordering or county identity logic.
  const countyAggregateList = counties.map((county) => {
    const countyConstituencies = constituencies.filter((constituency) => constituency.maz === county.maz);
    let yesVotes = 0;
    let noVotes = 0;
    for (const constituency of countyConstituencies) {
      const scope = `ogy2026/egyeni-valasztokeruletek/${constituency.maz}/${constituency.evk}`;
      const voteCount = districtCounts[scope];
      yesVotes += voteCount?.yes ?? 0;
      noVotes += voteCount?.no ?? 0;
    }
    const totalVotes = yesVotes + noVotes;
    const marginPercent = totalVotes > 0 ? ((yesVotes - noVotes) / totalVotes) * 100 : 0;
    return {
      countyName: county.mazNev,
      countyCode: county.maz,
      href: `/ogy2026/egyeni-valasztokeruletek/${county.maz}`,
      totalVotes,
      marginPercent,
      leadBloc: getLeadBlocFromCounts(yesVotes, noVotes),
    };
  });

  const topActiveCounties = [...countyAggregateList]
    .filter((item) => item.totalVotes > 0)
    .sort((left, right) => right.totalVotes - left.totalVotes || left.countyName.localeCompare(right.countyName, "hu"))
    .slice(0, 5);
  const topBalancedCounties = balancedCountyItems.slice(0, 5).map((item) => ({
    countyName: item.countyName,
    countyCode: item.countyCode,
    href: item.href,
    totalVotes: item.totalVotes,
    marginPercent: item.marginPercent,
    leadBloc: item.leadBloc,
  }));

  const topWarZones = dashboardTopMetrics.warZone
    .map((item) => ({
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      diff: item.diff,
      diffPercent: item.diffPercent,
      leadBloc: item.leadBloc,
    }));

  const topPeaceIslands = dashboardTopMetrics.peaceIslands
    .map((item) => ({
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      diff: item.diff,
      diffPercent: item.diffPercent,
      leadBloc: item.leadBloc,
    }));

  const topYesCities = dashboardTopMetrics.yesCities
    .map((item) => ({
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      diff: item.diff,
      diffPercent: item.diffPercent,
      leadBloc: item.leadBloc,
    }));

  const topNoCities = dashboardTopMetrics.noCities
    .map((item) => ({
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      diff: item.diff,
      diffPercent: item.diffPercent,
      leadBloc: item.leadBloc,
    }));

  const topUncertainCities = dashboardTopMetrics.nobodyKnows
    .map((item) => ({
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      diff: item.diff,
      diffPercent: item.diffPercent,
      leadBloc: item.leadBloc,
    }));

  const topClosestCities = dashboardTopMetrics.closestBattlegrounds.slice(0, 5);
  const topStrongestCities = dashboardTopMetrics.strongestBastions.slice(0, 5);
  const topIndicatorCities = dashboardTopMetrics.indicatorCities.slice(0, 5).map((item) => ({
    city: item.city,
    county: item.county,
    countyCode: item.countyCode,
    countyHref: item.countyHref,
    countyLeadBloc: item.countyLeadBloc,
    districtLabel: item.districtLabel,
    href: item.href,
    totalVotes: item.totalVotes,
    marginPercent: item.marginPercent,
    diff: item.diff,
    diffPercent: item.marginPercent,
    leadBloc: item.leadBloc,
    indicatorDistance: item.indicatorDistance ?? Math.abs((item.totalVotes > 0 ? (item.yes / (item.yes + item.no)) * 100 : 50) - dashboardTopMetrics.nationalYesPercent),
  }));

  return {
    leadOverview,
    reportingCoverage,
    totalRegisteredPlayers: summary.totalRegisteredPlayers,
    weightedTripleVotes: summary.weightedTripleVotes,
    weightedRegularVotes: summary.weightedRegularVotes,
    topClosestCities,
    topStrongestCities,
    topActiveCounties,
    topBalancedCounties,
    topWarZones,
    topPeaceIslands,
    topYesCities,
    topNoCities,
    topUncertainCities,
    topIndicatorCities,
  };
}
