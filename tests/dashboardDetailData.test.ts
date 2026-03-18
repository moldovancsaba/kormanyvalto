import test from "node:test";
import assert from "node:assert/strict";
import type { CityVoteStat } from "../src/lib/results";
import { buildDashboardTopMetrics } from "../src/lib/dashboardDetailData";

function createCityStat(city: string, county: string, href: string, yes: number, no: number): CityVoteStat {
  const total = yes + no;
  return {
    city,
    county,
    districtLabel: "1. EVK",
    href,
    yes,
    no,
    total,
    diff: yes - no,
    diffPercent: total > 0 ? ((yes - no) / total) * 100 : 0,
    leadBloc: yes === no ? "neutral" : yes > no ? "yes" : "no",
  };
}

const fixture: CityVoteStat[] = [
  createCityStat("Alpha", "Baranya vármegye", "/ogy2026/egyeni-valasztokeruletek/02/01", 60, 40),
  createCityStat("Beta", "Baranya vármegye", "/ogy2026/egyeni-valasztokeruletek/02/02", 51, 49),
  createCityStat("Gamma", "Bács-Kiskun vármegye", "/ogy2026/egyeni-valasztokeruletek/03/01", 20, 80),
  createCityStat("Delta", "Bács-Kiskun vármegye", "/ogy2026/egyeni-valasztokeruletek/03/02", 55, 45),
  createCityStat("Epsilon", "Békés vármegye", "/ogy2026/egyeni-valasztokeruletek/04/01", 30, 30),
];

test("dashboard metrics keep canonical county identity on city rankings", () => {
  const metrics = buildDashboardTopMetrics(fixture, 5);

  const allCityRankings = [
    ...metrics.closestBattlegrounds,
    ...metrics.strongestBastions,
    ...metrics.indicatorCities,
  ];

  for (const item of allCityRankings) {
    assert.match(item.href, /^\/ogy2026\/egyeni-valasztokeruletek\/\d{2}\/\d{2}$/);
    assert.equal(item.countyHref, `/ogy2026/egyeni-valasztokeruletek/${item.countyCode}`);
    assert.equal(item.href.split("/")[3], item.countyCode);
  }
});

test("dashboard metrics keep stable city and county ranking order", () => {
  const metrics = buildDashboardTopMetrics(fixture, 5);

  assert.deepEqual(
    metrics.closestBattlegrounds.map((item) => item.city),
    ["Epsilon", "Beta", "Delta", "Alpha", "Gamma"]
  );
  assert.deepEqual(
    metrics.strongestBastions.map((item) => item.city),
    ["Gamma", "Alpha", "Delta", "Beta", "Epsilon"]
  );
  assert.deepEqual(
    metrics.indicatorCities.map((item) => item.city),
    ["Epsilon", "Beta", "Delta", "Alpha", "Gamma"]
  );
  assert.deepEqual(
    metrics.balancedCounties.map((item) => item.countyCode),
    ["04", "02", "03"]
  );
  assert.equal(metrics.balancedCounties[0]?.href, "/ogy2026/egyeni-valasztokeruletek/04");
  assert.equal(metrics.balancedCounties[1]?.leadBloc, "yes");
  assert.equal(metrics.balancedCounties[2]?.leadBloc, "no");
});
