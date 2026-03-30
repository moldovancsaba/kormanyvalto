import { getMongoClient, getMongoDbName } from "./mongodb";
import { constituencies, findConstituency, getSeatLabel } from "./constituencies";
import { VoteMode } from "./voteEngine";

export type VoteType = "yes" | "no";

export type VoteHistoryItem = {
  type: VoteType;
  timestamp: string;
  scope: string;
  sourceLabel: string;
  sourceCounty?: string;
  sourceCity?: string;
  sourceCountyHref?: string;
  sourceCityHref?: string;
  sourceCountyTone?: ParliamentBloc;
  sourceCityTone?: ParliamentBloc;
  weight: number;
  mode: VoteMode;
};

export type ResultsResponse = {
  yesCount: number;
  noCount: number;
  history: VoteHistoryItem[];
  cooldownSec?: number;
};

export type ScopeVoteCount = {
  yes: number;
  no: number;
  total: number;
  yesPercent: number;
};

export type CityVoteStat = {
  city: string;
  county: string;
  districtLabel: string;
  href: string;
  yes: number;
  no: number;
  total: number;
  diff: number;
  diffPercent: number;
  leadBloc: ParliamentBloc;
};

export type DashboardSummary = {
  totalWeightedVotes: number;
  totalVoteEvents: number;
  totalRegisteredPlayers: number;
  weightedYes: number;
  weightedNo: number;
  weightedTripleVotes: number;
  weightedRegularVotes: number;
  tripleVoteEvents: number;
  regularVoteEvents: number;
};

export type ParliamentBloc = "yes" | "no" | "neutral";

export type ParliamentSeatSource = "district" | "list";

export type ParliamentEstimateMode = "strict" | "projection";

export type ParliamentSeat = {
  id: string;
  bloc: ParliamentBloc;
  source: ParliamentSeatSource;
  href?: string;
  label: string;
  detail: string;
  county?: string;
  city?: string;
  yes: number;
  no: number;
  total: number;
  margin: number;
};

export type ParliamentEstimate = {
  mode: ParliamentEstimateMode;
  seats: ParliamentSeat[];
  districtYesSeats: number;
  districtNoSeats: number;
  unresolvedDistrictSeats: number;
  listYesSeats: number;
  listNoSeats: number;
  unresolvedListSeats: number;
  mainListYesVotes: number;
  mainListNoVotes: number;
  fragmentYesVotes: number;
  fragmentNoVotes: number;
  listBasisYes: number;
  listBasisNo: number;
  qualifiedYes: boolean;
  qualifiedNo: boolean;
  totalYesSeats: number;
  totalNoSeats: number;
  majorityTarget: number;
};

type VoteDoc = {
  scope?: string;
  type: VoteType;
  timestamp: string;
  weight?: number;
  mode?: VoteMode;
};

export const TIE_THRESHOLD_RATIO = 0.03;

export function getLeadBlocFromCounts(yes: number, no: number, tieThresholdRatio = TIE_THRESHOLD_RATIO): ParliamentBloc {
  const total = yes + no;
  if (total <= 0) return "neutral";
  const diffRatio = Math.abs(yes - no) / total;
  if (diffRatio < tieThresholdRatio) return "neutral";
  return yes > no ? "yes" : "no";
}

function getProjectedFinalBloc(yes: number, no: number): Exclude<ParliamentBloc, "neutral"> {
  if (yes === no) return "no";
  return yes > no ? "yes" : "no";
}

async function getVotesCollection() {
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  return db.collection<VoteDoc>("votes");
}

async function getVoteSessionsCollection() {
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  return db.collection<{ actorId?: string }>("vote_sessions");
}

function getVoteWeight(vote: VoteDoc) {
  return typeof vote.weight === "number" && vote.weight > 0 ? vote.weight : 1;
}

function buildDistrictScope(maz: string, evk: string) {
  return `ogy2026/egyeni-valasztokeruletek/${maz}/${evk}`;
}

function allocateDhondtSeats(
  seatCount: number,
  bases: Array<{ bloc: Exclude<ParliamentBloc, "neutral">; votes: number; qualified: boolean }>
) {
  const eligible = bases.filter((item) => item.qualified && item.votes > 0);
  if (eligible.length === 0) {
    return {
      yes: 0,
      no: 0,
      unresolved: seatCount,
    };
  }

  const quotients = eligible.flatMap((item) =>
    Array.from({ length: seatCount }, (_, index) => ({
      bloc: item.bloc,
      quotient: item.votes / (index + 1),
      votes: item.votes,
      divisor: index + 1,
    }))
  );

  quotients.sort((left, right) => {
    if (right.quotient !== left.quotient) return right.quotient - left.quotient;
    if (right.votes !== left.votes) return right.votes - left.votes;
    if (left.divisor !== right.divisor) return left.divisor - right.divisor;
    return left.bloc.localeCompare(right.bloc);
  });

  let yes = 0;
  let no = 0;

  for (const item of quotients.slice(0, seatCount)) {
    if (item.bloc === "yes") {
      yes += 1;
    } else {
      no += 1;
    }
  }

  return {
    yes,
    no,
    unresolved: Math.max(0, seatCount - yes - no),
  };
}

export function createEmptyParliamentEstimate(mode: ParliamentEstimateMode = "strict"): ParliamentEstimate {
  return {
    mode,
    seats: [],
    districtYesSeats: 0,
    districtNoSeats: 0,
    unresolvedDistrictSeats: 106,
    listYesSeats: 0,
    listNoSeats: 0,
    unresolvedListSeats: 93,
    mainListYesVotes: 0,
    mainListNoVotes: 0,
    fragmentYesVotes: 0,
    fragmentNoVotes: 0,
    listBasisYes: 0,
    listBasisNo: 0,
    qualifiedYes: false,
    qualifiedNo: false,
    totalYesSeats: 0,
    totalNoSeats: 0,
    majorityTarget: 100,
  };
}

function buildSeatOrder(seats: ParliamentSeat[]) {
  const sortByStrength = (left: ParliamentSeat, right: ParliamentSeat) =>
    right.margin - left.margin || right.total - left.total || left.label.localeCompare(right.label, "hu");
  const sortByWeakness = (left: ParliamentSeat, right: ParliamentSeat) =>
    left.margin - right.margin || left.total - right.total || left.label.localeCompare(right.label, "hu");

  const yesDistrict = seats.filter((seat) => seat.bloc === "yes" && seat.source === "district").sort(sortByStrength);
  const yesList = seats.filter((seat) => seat.bloc === "yes" && seat.source === "list").sort(sortByStrength);
  const neutralDistrict = seats
    .filter((seat) => seat.bloc === "neutral" && seat.source === "district")
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label, "hu"));
  const neutralList = seats.filter((seat) => seat.bloc === "neutral" && seat.source === "list").sort(sortByStrength);
  const noList = seats.filter((seat) => seat.bloc === "no" && seat.source === "list").sort(sortByWeakness);
  const noDistrict = seats.filter((seat) => seat.bloc === "no" && seat.source === "district").sort(sortByWeakness);

  return [...yesDistrict, ...yesList, ...neutralDistrict, ...neutralList, ...noList, ...noDistrict];
}

export async function getResults(
  scope = "main",
  includeAllScopesForMain = false
): Promise<ResultsResponse> {
  const filter =
    scope === "main" && includeAllScopesForMain
      ? {}
      : scope === "main"
        ? { $or: [{ scope: "main" }, { scope: { $exists: false } }] }
        : { scope };

  const votes = await (await getVotesCollection())
    .find(filter, { projection: { _id: 1, type: 1, timestamp: 1, scope: 1, weight: 1, mode: 1 } })
    .sort({ timestamp: -1 })
    .toArray();

  let yesCount = 0;
  let noCount = 0;

  for (const vote of votes) {
    const weight = getVoteWeight(vote);
    if (vote.type === "yes") {
      yesCount += weight;
    } else {
      noCount += weight;
    }
  }

  const addTally = (map: Map<string, { yes: number; no: number }>, key: string, type: VoteType, weight: number) => {
    const current = map.get(key) || { yes: 0, no: 0 };
    if (type === "yes") current.yes += weight;
    else current.no += weight;
    map.set(key, current);
  };

  const historyItems = votes.slice(0, 30).map((vote) => {
    const normalizedScope = vote.scope ?? "main";
    return {
      vote,
      voteId: String((vote as { _id?: unknown })._id ?? `${normalizedScope}:${vote.timestamp}:${vote.type}`),
      normalizedScope,
      meta: getScopeMeta(normalizedScope),
    };
  });

  const historyCountyMaz = [...new Set(historyItems.map((item) => item.meta.maz).filter((value): value is string => Boolean(value)))];
  const historyDistrictScopes = [
    ...new Set(
      historyItems
        .filter((item) => item.meta.maz && item.meta.evk)
        .map((item) => `ogy2026/egyeni-valasztokeruletek/${item.meta.maz}/${item.meta.evk}`)
    ),
  ];
  const countyContextScopes = constituencies
    .filter((item) => historyCountyMaz.includes(item.maz))
    .map((item) => `ogy2026/egyeni-valasztokeruletek/${item.maz}/${item.evk}`);
  const countyDirectScopes = historyCountyMaz.map((maz) => `ogy2026/egyeni-valasztokeruletek/${maz}`);
  const needsMainContext = historyItems.some((item) => item.normalizedScope === "main");

  const contextFilterParts: object[] = [];
  if (historyDistrictScopes.length > 0) {
    contextFilterParts.push({ scope: { $in: historyDistrictScopes } });
  }
  if (countyContextScopes.length > 0) {
    contextFilterParts.push({ scope: { $in: countyContextScopes } });
  }
  if (countyDirectScopes.length > 0) {
    contextFilterParts.push({ scope: { $in: countyDirectScopes } });
  }
  if (needsMainContext) {
    contextFilterParts.push({ $or: [{ scope: "main" }, { scope: { $exists: false } }] });
  }

  const contextVotes =
    contextFilterParts.length > 0
      ? await (await getVotesCollection())
          .find(
            contextFilterParts.length === 1 ? contextFilterParts[0] : { $or: contextFilterParts },
            { projection: { _id: 1, type: 1, timestamp: 1, scope: 1, weight: 1, mode: 1 } }
          )
          .sort({ timestamp: 1 })
          .toArray()
      : [];

  const historySnapshotByVoteId = new Map<string, {
    scopeYes: number;
    scopeNo: number;
    countyYes?: number;
    countyNo?: number;
    districtYes?: number;
    districtNo?: number;
  }>();

  const historicalScopeTally = new Map<string, { yes: number; no: number }>();
  const historicalCountyTally = new Map<string, { yes: number; no: number }>();
  const historicalDistrictTally = new Map<string, { yes: number; no: number }>();
  const targetVoteIds = new Set(historyItems.map((item) => item.voteId));

  for (const vote of contextVotes) {
    const normalizedScope = vote.scope ?? "main";
    const meta = getScopeMeta(normalizedScope);
    const weight = getVoteWeight(vote);
    const voteId = String((vote as { _id?: unknown })._id ?? `${normalizedScope}:${vote.timestamp}:${vote.type}`);

    addTally(historicalScopeTally, normalizedScope, vote.type, weight);

    if (meta.maz && meta.evk) {
      addTally(historicalDistrictTally, normalizedScope, vote.type, weight);
      addTally(historicalCountyTally, meta.maz, vote.type, weight);
    } else if (meta.maz) {
      addTally(historicalCountyTally, meta.maz, vote.type, weight);
    }

    if (targetVoteIds.has(voteId)) {
      historySnapshotByVoteId.set(voteId, {
        scopeYes: historicalScopeTally.get(normalizedScope)?.yes ?? 0,
        scopeNo: historicalScopeTally.get(normalizedScope)?.no ?? 0,
        countyYes: meta.maz ? historicalCountyTally.get(meta.maz)?.yes ?? 0 : undefined,
        countyNo: meta.maz ? historicalCountyTally.get(meta.maz)?.no ?? 0 : undefined,
        districtYes: meta.maz && meta.evk ? historicalDistrictTally.get(normalizedScope)?.yes ?? 0 : undefined,
        districtNo: meta.maz && meta.evk ? historicalDistrictTally.get(normalizedScope)?.no ?? 0 : undefined,
      });
    }
  }

  const history = historyItems.map(({ vote, voteId, normalizedScope, meta }) => {
    const snapshot = historySnapshotByVoteId.get(voteId) ?? { scopeYes: 0, scopeNo: 0 };
    return {
      type: vote.type,
      timestamp: vote.timestamp,
      scope: normalizedScope,
      sourceLabel: meta.sourceLabel,
      sourceCounty: meta.sourceCounty,
      sourceCity: meta.sourceCity,
      sourceCountyHref: meta.sourceCountyHref,
      sourceCityHref: meta.sourceCityHref,
      sourceCountyTone: meta.maz
        ? getLeadBlocFromCounts(snapshot.countyYes ?? snapshot.scopeYes, snapshot.countyNo ?? snapshot.scopeNo)
        : getLeadBlocFromCounts(snapshot.scopeYes, snapshot.scopeNo),
      sourceCityTone:
        meta.maz && meta.evk && typeof snapshot.districtYes === "number" && typeof snapshot.districtNo === "number"
          ? getLeadBlocFromCounts(snapshot.districtYes, snapshot.districtNo)
          : undefined,
      weight: getVoteWeight(vote),
      mode: (vote.mode === "google" ? "google" : vote.mode === "vip" ? "vip" : "anonymous") as VoteMode,
    };
  });

  return { yesCount, noCount, history };
}

function getScopeLabel(scope: string) {
  if (scope === "main") {
    return "Országos";
  }

  const districtMatch = scope.match(/^ogy2026\/egyeni-valasztokeruletek\/(\d{2})\/(\d{2})$/);
  if (districtMatch) {
    const [, maz, evk] = districtMatch;
    const constituency = findConstituency(maz, evk);
    return constituency ? `${constituency.mazNev}, ${getSeatLabel(constituency.szekhely)}` : "Országos";
  }

  const countyMatch = scope.match(/^ogy2026\/egyeni-valasztokeruletek\/(\d{2})$/);
  if (countyMatch) {
    const [, maz] = countyMatch;
    return constituencies.find((item) => item.maz === maz)?.mazNev || "Országos";
  }

  return "Országos";
}

function getScopeMeta(scope: string) {
  if (scope === "main") {
    return {
      sourceLabel: "Országos",
      sourceCounty: "Országos",
      sourceCity: undefined,
      sourceCountyHref: "/",
      sourceCityHref: undefined,
      maz: undefined as string | undefined,
      evk: undefined as string | undefined,
    };
  }

  const districtMatch = scope.match(/^ogy2026\/egyeni-valasztokeruletek\/(\d{2})\/(\d{2})$/);
  if (districtMatch) {
    const [, maz, evk] = districtMatch;
    const constituency = findConstituency(maz, evk);
    if (!constituency) {
      return {
        sourceLabel: "Országos",
        sourceCounty: "Országos",
        sourceCity: undefined,
        sourceCountyHref: "/",
        sourceCityHref: undefined,
        maz: undefined as string | undefined,
        evk: undefined as string | undefined,
      };
    }
    const city = getSeatLabel(constituency.szekhely);
    return {
      sourceLabel: `${constituency.mazNev}, ${city}`,
      sourceCounty: constituency.mazNev,
      sourceCity: city,
      sourceCountyHref: `/ogy2026/egyeni-valasztokeruletek/${maz}`,
      sourceCityHref: `/ogy2026/egyeni-valasztokeruletek/${maz}/${evk}`,
      maz,
      evk,
    };
  }

  const countyMatch = scope.match(/^ogy2026\/egyeni-valasztokeruletek\/(\d{2})$/);
  if (countyMatch) {
    const [, maz] = countyMatch;
    const county = constituencies.find((item) => item.maz === maz)?.mazNev || "Országos";
    return {
      sourceLabel: county,
      sourceCounty: county,
      sourceCity: undefined,
      sourceCountyHref: `/ogy2026/egyeni-valasztokeruletek/${maz}`,
      sourceCityHref: undefined,
      maz,
      evk: undefined as string | undefined,
    };
  }

  return {
    sourceLabel: getScopeLabel(scope),
    sourceCounty: "Országos",
    sourceCity: undefined,
    sourceCountyHref: "/",
    sourceCityHref: undefined,
    maz: undefined as string | undefined,
    evk: undefined as string | undefined,
  };
}

export async function addVote({
  type,
  scope = "main",
  weight,
  mode,
}: {
  type: VoteType;
  scope?: string;
  weight: number;
  mode: VoteMode;
}): Promise<ResultsResponse> {
  await (await getVotesCollection()).insertOne({
    scope,
    type,
    weight,
    mode,
    timestamp: new Date().toISOString(),
  });

  return getResults(scope, false);
}

export async function getScopeVoteCounts(scopes: string[]): Promise<Record<string, ScopeVoteCount>> {
  if (scopes.length === 0) return {};

  const rows = await (await getVotesCollection())
    .aggregate<{ _id: { scope: string; type: VoteType }; count: number }>([
      { $match: { scope: { $in: scopes } } },
      {
        $group: {
          _id: { scope: "$scope", type: "$type" },
          count: { $sum: { $ifNull: ["$weight", 1] } },
        },
      },
    ])
    .toArray();

  const out: Record<string, ScopeVoteCount> = {};
  for (const scope of scopes) {
    out[scope] = { yes: 0, no: 0, total: 0, yesPercent: 50 };
  }

  for (const row of rows) {
    const scope = row._id.scope;
    if (!out[scope]) continue;
    if (row._id.type === "yes") out[scope].yes = row.count;
    if (row._id.type === "no") out[scope].no = row.count;
  }

  for (const scope of scopes) {
    const item = out[scope];
    item.total = item.yes + item.no;
    item.yesPercent = item.total === 0 ? 50 : (item.yes / item.total) * 100;
  }

  return out;
}

export async function getDashboardCityStats(): Promise<CityVoteStat[]> {
  const constituencyScopes = constituencies.map((c) => ({
    scope: `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`,
    city: getSeatLabel(c.szekhely),
    county: c.mazNev,
    districtLabel: `${c.evk}. EVK`,
    href: `/ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`,
  }));

  const scopeMap = new Map(
    constituencyScopes.map((item) => [
      item.scope,
      {
        city: item.city,
        county: item.county,
        districtLabel: item.districtLabel,
        href: item.href,
      },
    ])
  );

  const rows = await (await getVotesCollection())
    .aggregate<{ _id: { scope: string; type: VoteType }; count: number }>([
      { $match: { scope: { $in: constituencyScopes.map((item) => item.scope) } } },
      {
        $group: {
          _id: { scope: "$scope", type: "$type" },
          count: { $sum: { $ifNull: ["$weight", 1] } },
        },
      },
    ])
    .toArray();

  const cityMap = new Map<string, CityVoteStat>();

  for (const row of rows) {
    const meta = scopeMap.get(row._id.scope);
    if (!meta) continue;

    const key = row._id.scope;
    const existing = cityMap.get(key) || {
      city: meta.city,
      county: meta.county,
      districtLabel: meta.districtLabel,
      href: meta.href,
      yes: 0,
      no: 0,
      total: 0,
      diff: 0,
      diffPercent: 0,
      leadBloc: "neutral" as ParliamentBloc,
    };

    if (row._id.type === "yes") {
      existing.yes += row.count;
    } else {
      existing.no += row.count;
    }

    existing.total = existing.yes + existing.no;
    existing.diff = existing.yes - existing.no;
    existing.diffPercent = existing.total > 0 ? (existing.diff / existing.total) * 100 : 0;
    existing.leadBloc = getLeadBlocFromCounts(existing.yes, existing.no);
    cityMap.set(key, existing);
  }

  return [...cityMap.values()].sort(
    (a, b) =>
      b.total - a.total ||
      a.city.localeCompare(b.city, "hu") ||
      a.districtLabel.localeCompare(b.districtLabel, "hu")
  );
}

export async function getCityStatsByBloc(
  bloc: "yes" | "no",
  offset = 0,
  limit = 10
): Promise<{ items: CityVoteStat[]; total: number; hasMore: boolean }> {
  const all = await getDashboardCityStats();
  const filtered = all.filter((item) => item.total > 0 && item.leadBloc === bloc);
  const sorted = [...filtered].sort((left, right) => {
    if (bloc === "yes") {
      return right.diff - left.diff || right.total - left.total || left.city.localeCompare(right.city, "hu");
    }
    return left.diff - right.diff || right.total - left.total || left.city.localeCompare(right.city, "hu");
  });

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, Math.min(50, limit));
  const items = sorted.slice(safeOffset, safeOffset + safeLimit);
  const total = sorted.length;
  const hasMore = safeOffset + items.length < total;
  return { items, total, hasMore };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const rows = await (await getVotesCollection())
    .aggregate<{
      _id: { mode: VoteMode; type: VoteType };
      totalWeight: number;
      voteEvents: number;
    }>([
      {
        $group: {
          _id: {
            mode: { $ifNull: ["$mode", "anonymous"] },
            type: "$type",
          },
          totalWeight: { $sum: { $ifNull: ["$weight", 1] } },
          voteEvents: { $sum: 1 },
        },
      },
    ])
    .toArray();

  let weightedYes = 0;
  let weightedNo = 0;
  let weightedTripleVotes = 0;
  let weightedRegularVotes = 0;
  let tripleVoteEvents = 0;
  let regularVoteEvents = 0;

  for (const row of rows) {
    if (row._id.type === "yes") {
      weightedYes += row.totalWeight;
    } else {
      weightedNo += row.totalWeight;
    }

    if (row._id.mode === "google") {
      weightedTripleVotes += row.totalWeight;
      tripleVoteEvents += row.voteEvents;
    } else {
      weightedRegularVotes += row.totalWeight;
      regularVoteEvents += row.voteEvents;
    }
  }

  const registeredActors = await (await getVoteSessionsCollection()).distinct("actorId", {
    actorId: { $regex: /^user:/ },
  });

  return {
    totalWeightedVotes: weightedYes + weightedNo,
    totalVoteEvents: tripleVoteEvents + regularVoteEvents,
    totalRegisteredPlayers: registeredActors.length,
    weightedYes,
    weightedNo,
    weightedTripleVotes,
    weightedRegularVotes,
    tripleVoteEvents,
    regularVoteEvents,
  };
}

export async function getParliamentEstimate(mode: ParliamentEstimateMode = "strict"): Promise<ParliamentEstimate> {
  const districtScopes = constituencies.map((item) => buildDistrictScope(item.maz, item.evk));
  const [districtCounts, mainResults] = await Promise.all([getScopeVoteCounts(districtScopes), getResults("main", false)]);

  const seats: ParliamentSeat[] = [];
  let districtYesSeats = 0;
  let districtNoSeats = 0;
  let unresolvedDistrictSeats = 0;
  let fragmentYesVotes = 0;
  let fragmentNoVotes = 0;
  const mainListYesVotes = mainResults.yesCount;
  const mainListNoVotes = mainResults.noCount;
  const mainListTotal = mainListYesVotes + mainListNoVotes;

  for (const constituency of constituencies) {
    const scope = buildDistrictScope(constituency.maz, constituency.evk);
    const stat = districtCounts[scope] ?? { yes: 0, no: 0, total: 0, yesPercent: 50 };
    const seatLabel = getSeatLabel(constituency.szekhely);
    const label = `${constituency.evkNev} - ${seatLabel}`;
    const href = `/ogy2026/egyeni-valasztokeruletek/${constituency.maz}/${constituency.evk}`;
    const margin = Math.abs(stat.yes - stat.no);
    const resolvedBloc = mode === "projection" ? getProjectedFinalBloc(stat.yes, stat.no) : getLeadBlocFromCounts(stat.yes, stat.no);
    const tieDetailSuffix =
      stat.total > 0 && resolvedBloc === "neutral" ? " - 3% alatti különbség (döntetlen zóna)" : "";

    if (resolvedBloc === "yes") {
      districtYesSeats += 1;
      fragmentYesVotes += Math.max(0, stat.yes - (stat.no + 1));
      fragmentNoVotes += stat.no;
      seats.push({
        id: `${scope}:district`,
        bloc: "yes",
        source: "district",
        href,
        label,
        detail: `${constituency.mazNev}, ${seatLabel}${tieDetailSuffix}`,
        county: constituency.mazNev,
        city: seatLabel,
        yes: stat.yes,
        no: stat.no,
        total: stat.total,
        margin,
      });
      continue;
    }

    if (resolvedBloc === "no") {
      districtNoSeats += 1;
      fragmentNoVotes += Math.max(0, stat.no - (stat.yes + 1));
      fragmentYesVotes += stat.yes;
      seats.push({
        id: `${scope}:district`,
        bloc: "no",
        source: "district",
        href,
        label,
        detail: `${constituency.mazNev}, ${seatLabel}${tieDetailSuffix}`,
        county: constituency.mazNev,
        city: seatLabel,
        yes: stat.yes,
        no: stat.no,
        total: stat.total,
        margin,
      });
      continue;
    }

    unresolvedDistrictSeats += 1;
    seats.push({
      id: `${scope}:district`,
      bloc: "neutral",
      source: "district",
      href,
      label,
      detail:
        stat.total > 0
          ? `${constituency.mazNev}, ${seatLabel} - döntetlen`
          : `${constituency.mazNev}, ${seatLabel} - még nincs adat`,
      county: constituency.mazNev,
      city: seatLabel,
      yes: stat.yes,
      no: stat.no,
      total: stat.total,
      margin,
    });
  }

  const qualifiedYes = mainListTotal > 0 && mainListYesVotes / mainListTotal >= 0.05;
  const qualifiedNo = mainListTotal > 0 && mainListNoVotes / mainListTotal >= 0.05;
  const listBasisYes = mainListYesVotes + fragmentYesVotes;
  const listBasisNo = mainListNoVotes + fragmentNoVotes;

  const listAllocation = allocateDhondtSeats(93, [
    { bloc: "yes", votes: listBasisYes, qualified: qualifiedYes },
    { bloc: "no", votes: listBasisNo, qualified: qualifiedNo },
  ]);

  for (let index = 0; index < listAllocation.yes; index += 1) {
    seats.push({
      id: `list:yes:${index + 1}`,
      bloc: "yes",
      source: "list",
      label: `Igen lista ${index + 1}. mandátum`,
      detail: "Országos listás mandátum a listás és töredékszavazatok alapján",
      yes: listBasisYes,
      no: listBasisNo,
      total: listBasisYes + listBasisNo,
      margin: Math.abs(listBasisYes - listBasisNo),
    });
  }

  for (let index = 0; index < listAllocation.no; index += 1) {
    seats.push({
      id: `list:no:${index + 1}`,
      bloc: "no",
      source: "list",
      label: `Nem lista ${index + 1}. mandátum`,
      detail: "Országos listás mandátum a listás és töredékszavazatok alapján",
      yes: listBasisYes,
      no: listBasisNo,
      total: listBasisYes + listBasisNo,
      margin: Math.abs(listBasisYes - listBasisNo),
    });
  }

  for (let index = 0; index < listAllocation.unresolved; index += 1) {
    seats.push({
      id: `list:neutral:${index + 1}`,
      bloc: "neutral",
      source: "list",
      label: `Nyitott listás mandátum ${index + 1}.`,
      detail:
        mainListTotal === 0
          ? "Nincs még listás szavazat a 93 országos mandátum becsléséhez."
          : "A listás küszöb vagy az adathiány miatt még nem osztható ki.",
      yes: listBasisYes,
      no: listBasisNo,
      total: listBasisYes + listBasisNo,
      margin: Math.abs(listBasisYes - listBasisNo),
    });
  }

  return {
    mode,
    seats: buildSeatOrder(seats),
    districtYesSeats,
    districtNoSeats,
    unresolvedDistrictSeats,
    listYesSeats: listAllocation.yes,
    listNoSeats: listAllocation.no,
    unresolvedListSeats: listAllocation.unresolved,
    mainListYesVotes,
    mainListNoVotes,
    fragmentYesVotes,
    fragmentNoVotes,
    listBasisYes,
    listBasisNo,
    qualifiedYes,
    qualifiedNo,
    totalYesSeats: districtYesSeats + listAllocation.yes,
    totalNoSeats: districtNoSeats + listAllocation.no,
    majorityTarget: 100,
  };
}
