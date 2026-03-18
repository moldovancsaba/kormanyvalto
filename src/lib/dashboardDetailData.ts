import { CityVoteStat, getDashboardCityStats, getLeadBlocFromCounts } from "./results";
import { getCountyCodeFromConstituencyHref, getCountyHrefFromConstituencyHref } from "./territoryPaths";

export type CityRankingDetailItem = {
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
  indicatorDistance?: number;
};

export type CountyBalanceDetailItem = {
  countyName: string;
  countyCode: string;
  href: string;
  totalVotes: number;
  yes: number;
  no: number;
  yesPercent: number;
  marginPercent: number;
  leadBloc: "yes" | "no" | "neutral";
};

function buildCountyAggregateMap(votedCities: CityVoteStat[]) {
  return votedCities.reduce((map, item) => {
    const countyCode = getCountyCodeFromConstituencyHref(item.href);
    const current = map.get(countyCode) ?? { yes: 0, no: 0, totalVotes: 0, countyName: item.county };
    current.yes += item.yes;
    current.no += item.no;
    current.totalVotes += item.total;
    map.set(countyCode, current);
    return map;
  }, new Map<string, { yes: number; no: number; totalVotes: number; countyName: string }>());
}

function enrichCityItems(votedCities: CityVoteStat[]) {
  const countyAggregates = buildCountyAggregateMap(votedCities);

  return votedCities.map((item) => {
    const countyCode = getCountyCodeFromConstituencyHref(item.href);
    const countyAggregate = countyAggregates.get(countyCode) ?? { yes: 0, no: 0, totalVotes: 0, countyName: item.county };
    return {
      countyCode,
      countyHref: getCountyHrefFromConstituencyHref(item.href),
      countyLeadBloc: getLeadBlocFromCounts(countyAggregate.yes, countyAggregate.no),
      city: item.city,
      county: item.county,
      districtLabel: item.districtLabel,
      href: item.href,
      totalVotes: item.total,
      marginPercent: item.diffPercent,
      leadBloc: item.leadBloc,
      diff: item.diff,
      yes: item.yes,
      no: item.no,
    };
  });
}

async function getVotedCities() {
  const stats = await getDashboardCityStats();
  return stats.filter((item) => item.total > 0);
}

export async function getNationalYesPercent(): Promise<number> {
  const votedCities = await getVotedCities();
  const nationalYes = votedCities.reduce((sum, item) => sum + item.yes, 0);
  const nationalNo = votedCities.reduce((sum, item) => sum + item.no, 0);
  const nationalTotal = nationalYes + nationalNo;
  return nationalTotal > 0 ? (nationalYes / nationalTotal) * 100 : 50;
}

export async function getClosestBattlegroundDetailItems(): Promise<CityRankingDetailItem[]> {
  const votedCities = await getVotedCities();
  const limit = Math.max(1, Math.ceil(votedCities.length * 0.2));
  return enrichCityItems(votedCities)
    .sort((a, b) => Math.abs(a.marginPercent) - Math.abs(b.marginPercent) || b.totalVotes - a.totalVotes)
    .slice(0, limit);
}

export async function getPeaceIslandDetailItems(): Promise<CityRankingDetailItem[]> {
  const votedCities = await getVotedCities();
  const limit = Math.max(1, Math.ceil(votedCities.length * 0.2));
  return enrichCityItems(votedCities)
    .sort((a, b) => a.totalVotes - b.totalVotes || a.city.localeCompare(b.city, "hu"))
    .slice(0, limit);
}

export async function getWarZoneDetailItems(): Promise<CityRankingDetailItem[]> {
  const votedCities = await getVotedCities();
  const limit = Math.max(1, Math.ceil(votedCities.length * 0.2));
  return enrichCityItems(votedCities)
    .sort((a, b) => b.totalVotes - a.totalVotes || a.city.localeCompare(b.city, "hu"))
    .slice(0, limit);
}

export async function getStrongestBastionDetailItems(): Promise<CityRankingDetailItem[]> {
  const votedCities = await getVotedCities();
  const limit = Math.max(1, Math.ceil(votedCities.length * 0.2));
  return enrichCityItems(votedCities)
    .sort((a, b) => Math.abs(b.marginPercent) - Math.abs(a.marginPercent) || b.totalVotes - a.totalVotes)
    .slice(0, limit);
}

export async function getIndicatorCityDetailItems(): Promise<CityRankingDetailItem[]> {
  const votedCities = await getVotedCities();
  const nationalYesPercent = await getNationalYesPercent();

  return enrichCityItems(votedCities)
    .map((item) => {
      const totalVotes = item.yes + item.no;
      const cityYesPercent = totalVotes > 0 ? (item.yes / totalVotes) * 100 : 50;
      return {
        ...item,
        indicatorDistance: Math.abs(cityYesPercent - nationalYesPercent),
      };
    })
    .filter((item) => (item.indicatorDistance ?? 100) < 20)
    .sort((a, b) => (a.indicatorDistance ?? 0) - (b.indicatorDistance ?? 0) || b.totalVotes - a.totalVotes);
}

export async function getBalancedCountyDetailItems(): Promise<CountyBalanceDetailItem[]> {
  const votedCities = await getVotedCities();
  return Array.from(buildCountyAggregateMap(votedCities)).map(([countyCode, data]) => {
    const totalVotes = data.yes + data.no;
    const marginPercent = totalVotes > 0 ? ((data.yes - data.no) / totalVotes) * 100 : 0;
    const yesPercent = totalVotes > 0 ? (data.yes / totalVotes) * 100 : 50;
    return {
      countyName: data.countyName,
      countyCode,
      href: `/ogy2026/egyeni-valasztokeruletek/${countyCode}`,
      totalVotes: data.totalVotes,
      yes: data.yes,
      no: data.no,
      yesPercent,
      marginPercent,
      leadBloc: getLeadBlocFromCounts(data.yes, data.no),
    };
  })
  .filter((item) => item.totalVotes > 0)
  .sort((left, right) => Math.abs(left.marginPercent) - Math.abs(right.marginPercent) || right.totalVotes - left.totalVotes);
}
