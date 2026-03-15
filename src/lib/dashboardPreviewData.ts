import { constituencies, getCounties } from "./constituencies";
import { getDashboardCityStats, getDashboardSummary, getLeadBlocFromCounts, getScopeVoteCounts } from "./results";

export type LeadOverviewMetric = {
  totalWeightedVotes: number;
  weightedYes: number;
  weightedNo: number;
  yesPercent: number;
  noPercent: number;
  leadBloc: "yes" | "no" | "neutral";
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
};

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

export async function getDashboardPreviewMetrics(): Promise<DashboardPreviewMetrics> {
  const districtScopes = constituencies.map((constituency) => `ogy2026/egyeni-valasztokeruletek/${constituency.maz}/${constituency.evk}`);
  const [summary, districtCounts, cityStats] = await Promise.all([getDashboardSummary(), getScopeVoteCounts(districtScopes), getDashboardCityStats()]);

  const totalWeightedVotes = summary.weightedYes + summary.weightedNo;
  const marginVotes = Math.abs(summary.weightedYes - summary.weightedNo);
  const leadOverview: LeadOverviewMetric = {
    totalWeightedVotes,
    weightedYes: summary.weightedYes,
    weightedNo: summary.weightedNo,
    yesPercent: toPercent(summary.weightedYes, totalWeightedVotes),
    noPercent: toPercent(summary.weightedNo, totalWeightedVotes),
    leadBloc: getLeadBlocFromCounts(summary.weightedYes, summary.weightedNo),
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

  const votedCities = cityStats.filter((item) => item.total > 0);
  const topClosestCities = [...votedCities]
    .sort((left, right) => Math.abs(left.diffPercent) - Math.abs(right.diffPercent) || right.total - left.total)
    .slice(0, 5)
    .map((item) => ({
      countyCode: item.href.split("/")[3] ?? "",
      countyHref: `/ogy2026/egyeni-valasztokeruletek/${item.href.split("/")[3] ?? ""}`,
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      marginPercent: item.diffPercent,
      leadBloc: item.leadBloc,
    }));

  const topStrongestCities = [...votedCities]
    .sort((left, right) => Math.abs(right.diffPercent) - Math.abs(left.diffPercent) || right.total - left.total)
    .slice(0, 5)
    .map((item) => ({
      countyCode: item.href.split("/")[3] ?? "",
      countyHref: `/ogy2026/egyeni-valasztokeruletek/${item.href.split("/")[3] ?? ""}`,
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      marginPercent: item.diffPercent,
      leadBloc: item.leadBloc,
    }));

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

  const topBalancedCounties = [...countyAggregateList]
    .filter((item) => item.totalVotes > 0)
    .sort((left, right) => Math.abs(left.marginPercent) - Math.abs(right.marginPercent) || right.totalVotes - left.totalVotes)
    .slice(0, 5);

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
  };
}
