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
  diff: number;
  yes: number;
  no: number;
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

export type CountyIdentity = Pick<CountyBalanceDetailItem, "countyName" | "countyCode" | "href">;

export type DashboardTopMetrics = {
  votedCities: CityVoteStat[];
  nationalYesPercent: number;
  warZone: CityVoteStat[];
  peaceIslands: CityVoteStat[];
  yesCities: CityVoteStat[];
  noCities: CityVoteStat[];
  nobodyKnows: CityVoteStat[];
  closestBattlegrounds: CityRankingDetailItem[];
  strongestBastions: CityRankingDetailItem[];
  indicatorCities: CityRankingDetailItem[];
  balancedCounties: CountyBalanceDetailItem[];
};

type CountyAggregate = {
  countyCode: string;
  countyName: string;
  href: string;
  yes: number;
  no: number;
  totalVotes: number;
  yesPercent: number;
  marginPercent: number;
  leadBloc: "yes" | "no" | "neutral";
};

function isDevelopment() {
  return process.env.NODE_ENV !== "production";
}

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

function assertCountyIdentityConsistency(item: { county: string; countyCode: string; countyHref: string; href: string }) {
  if (!isDevelopment()) return;

  const expectedCountyHref = getCountyHrefFromConstituencyHref(item.href);
  if (item.countyHref !== expectedCountyHref) {
    throw new Error(`County href mismatch for ${item.href}: got ${item.countyHref}, expected ${expectedCountyHref}`);
  }

  const expectedCountyCode = getCountyCodeFromConstituencyHref(item.href);
  if (item.countyCode !== expectedCountyCode) {
    throw new Error(`County code mismatch for ${item.href}: got ${item.countyCode}, expected ${expectedCountyCode}`);
  }
}

function assertUniqueCountyAggregates(items: CountyAggregate[]) {
  if (!isDevelopment()) return;

  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.countyCode)) {
      throw new Error(`Duplicate county aggregate detected for ${item.countyCode}`);
    }
    seen.add(item.countyCode);
  }
}

function enrichCityItems(votedCities: CityVoteStat[]) {
  const countyAggregates = buildCountyAggregateMap(votedCities);

  return votedCities.map((item) => {
    const countyCode = getCountyCodeFromConstituencyHref(item.href);
    const countyAggregate = countyAggregates.get(countyCode) ?? { yes: 0, no: 0, totalVotes: 0, countyName: item.county };
    const enriched: CityRankingDetailItem = {
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

    assertCountyIdentityConsistency(enriched);
    return enriched;
  });
}

function buildCountyAggregateItems(votedCities: CityVoteStat[]): CountyAggregate[] {
  const items = Array.from(buildCountyAggregateMap(votedCities)).map(([countyCode, data]) => {
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
  });

  assertUniqueCountyAggregates(items);
  return items;
}

async function getVotedCities() {
  const stats = await getDashboardCityStats();
  return stats.filter((item) => item.total > 0);
}

export function getNationalYesPercentFromCities(votedCities: Pick<CityVoteStat, "yes" | "no">[]): number {
  const nationalYes = votedCities.reduce((sum, item) => sum + item.yes, 0);
  const nationalNo = votedCities.reduce((sum, item) => sum + item.no, 0);
  const nationalTotal = nationalYes + nationalNo;
  return nationalTotal > 0 ? (nationalYes / nationalTotal) * 100 : 50;
}

export async function getNationalYesPercent(): Promise<number> {
  return getNationalYesPercentFromCities(await getVotedCities());
}

export function buildDashboardTopMetrics(votedCities: CityVoteStat[], limit = 5): DashboardTopMetrics {
  // `/dashboard` and `/dashboard-preview` should consume the same county-enriched
  // ranking contracts so card ordering, links, tones, and silhouette identity do
  // not drift independently between the two surfaces.
  const enrichedCities = enrichCityItems(votedCities);
  const nationalYesPercent = getNationalYesPercentFromCities(votedCities);
  const balancedCountyItems = buildCountyAggregateItems(votedCities);

  const warZone = [...votedCities].sort((a, b) => b.total - a.total || a.city.localeCompare(b.city, "hu")).slice(0, limit);
  const peaceIslands = [...votedCities].sort((a, b) => a.total - b.total || a.city.localeCompare(b.city, "hu")).slice(0, limit);
  const yesCities = [...votedCities]
    .filter((item) => item.leadBloc === "yes")
    .sort((a, b) => b.diff - a.diff || b.total - a.total)
    .slice(0, limit);
  const noCities = [...votedCities]
    .filter((item) => item.leadBloc === "no")
    .sort((a, b) => a.diff - b.diff || b.total - a.total)
    .slice(0, limit);
  const nobodyKnows = [...votedCities]
    .sort((a, b) => Math.abs(a.diffPercent) - Math.abs(b.diffPercent) || b.total - a.total)
    .slice(0, limit);

  const closestBattlegrounds = [...enrichedCities]
    .sort((a, b) => Math.abs(a.marginPercent) - Math.abs(b.marginPercent) || b.totalVotes - a.totalVotes)
    .slice(0, limit);
  const strongestBastions = [...enrichedCities]
    .sort((a, b) => Math.abs(b.marginPercent) - Math.abs(a.marginPercent) || b.totalVotes - a.totalVotes)
    .slice(0, limit);
  const indicatorCities = [...enrichedCities]
    .map((item) => {
      const totalVotes = item.yes + item.no;
      const cityYesPercent = totalVotes > 0 ? (item.yes / totalVotes) * 100 : 50;
      return {
        ...item,
        indicatorDistance: Math.abs(cityYesPercent - nationalYesPercent),
      };
    })
    .sort((a, b) => (a.indicatorDistance ?? 0) - (b.indicatorDistance ?? 0) || b.totalVotes - a.totalVotes)
    .slice(0, limit);
  const balancedCounties = [...balancedCountyItems]
    .filter((item) => item.totalVotes > 0)
    .sort((left, right) => Math.abs(left.marginPercent) - Math.abs(right.marginPercent) || right.totalVotes - left.totalVotes)
    .slice(0, limit);

  return {
    votedCities,
    nationalYesPercent,
    warZone,
    peaceIslands,
    yesCities,
    noCities,
    nobodyKnows,
    closestBattlegrounds,
    strongestBastions,
    indicatorCities,
    balancedCounties,
  };
}

export async function getDashboardTopMetrics(limit = 5): Promise<DashboardTopMetrics> {
  return buildDashboardTopMetrics(await getVotedCities(), limit);
}

export async function getClosestBattlegroundDetailItems(): Promise<CityRankingDetailItem[]> {
  const votedCities = await getVotedCities();
  const limit = Math.max(1, Math.ceil(votedCities.length * 0.2));
  return (await getDashboardTopMetrics(limit)).closestBattlegrounds;
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
  return (await getDashboardTopMetrics(limit)).strongestBastions;
}

export async function getIndicatorCityDetailItems(): Promise<CityRankingDetailItem[]> {
  const votedCities = await getVotedCities();
  const limit = Math.max(1, Math.ceil(votedCities.length * 0.2));
  return (await getDashboardTopMetrics(limit)).indicatorCities.filter((item) => (item.indicatorDistance ?? 100) < 20);
}

export async function getBalancedCountyDetailItems(): Promise<CountyBalanceDetailItem[]> {
  const votedCities = await getVotedCities();
  const items = buildCountyAggregateItems(votedCities)
    .filter((item) => item.totalVotes > 0)
    .sort((left, right) => Math.abs(left.marginPercent) - Math.abs(right.marginPercent) || right.totalVotes - left.totalVotes);
  return items;
}

export async function getCityRankingDetailItemsByBloc(
  bloc: "yes" | "no",
  offset = 0,
  limit = 10
): Promise<{ items: CityRankingDetailItem[]; total: number; hasMore: boolean }> {
  const votedCities = enrichCityItems(await getVotedCities()).filter((item) => item.leadBloc === bloc);
  const sorted = [...votedCities].sort((left, right) => {
    if (bloc === "yes") {
      return right.diff - left.diff || right.totalVotes - left.totalVotes || left.city.localeCompare(right.city, "hu");
    }
    return left.diff - right.diff || right.totalVotes - left.totalVotes || left.city.localeCompare(right.city, "hu");
  });

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, Math.min(50, limit));
  const items = sorted.slice(safeOffset, safeOffset + safeLimit);
  const total = sorted.length;
  const hasMore = safeOffset + items.length < total;
  return { items, total, hasMore };
}
