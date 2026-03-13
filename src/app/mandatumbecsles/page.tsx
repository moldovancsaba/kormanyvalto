import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ParliamentHemicycle from "../../components/ParliamentHemicycle";
import { getParliamentEstimate, type ParliamentEstimate } from "../../lib/results";
import { buildPageMetadata } from "../../lib/siteMetadata";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Váltani akarsz?",
  description: "Mandátumbecslés",
  path: "/mandatumbecsles",
});

function formatNumber(value: number) {
  return new Intl.NumberFormat("hu-HU").format(value);
}

export default async function ParliamentEstimatePage() {
  let estimate: ParliamentEstimate;
  try {
    estimate = await getParliamentEstimate();
  } catch {
    estimate = {
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

  return (
    <main className="dashboard-page list-page">
      <div className="top-logo">
        <Image src="/images/hero_vote.png" alt="Szavazás 2026 hero" width={1536} height={1024} priority />
      </div>

      <div className="hero-actions">
        <Link href="/" className="nav-link-button nav-link-button-small">
          Főoldal
        </Link>
        <Link href="/ogy2026/egyeni-valasztokeruletek" className="nav-link-button nav-link-button-small">
          OGY 2026 körzetek listája
        </Link>
        <Link href="/dashboard" className="nav-link-button nav-link-button-small">
          Grafikon
        </Link>
      </div>

      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">Mandátumbecslés</p>
        <h1>199 fős parlamenti patkó</h1>
        <p className="dashboard-intro">
          Az egyéni mandátumok az EVK-vezetésből jönnek, a listás mandátumok az országos listás szavazatból és a
          töredékszavazatokból, d&apos;Hondt kiosztással.
        </p>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">106 egyéni mandátum</p>
          <p className="kpi-value">{formatNumber(estimate.districtYesSeats + estimate.districtNoSeats)}</p>
          <p className="kpi-detail">
            igen: {formatNumber(estimate.districtYesSeats)} | nem: {formatNumber(estimate.districtNoSeats)} | nyitott:{" "}
            {formatNumber(estimate.unresolvedDistrictSeats)}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">93 listás mandátum</p>
          <p className="kpi-value">{formatNumber(estimate.listYesSeats + estimate.listNoSeats)}</p>
          <p className="kpi-detail">
            igen: {formatNumber(estimate.listYesSeats)} | nem: {formatNumber(estimate.listNoSeats)} | nyitott:{" "}
            {formatNumber(estimate.unresolvedListSeats)}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Listás szavazás</p>
          <p className="kpi-value">{formatNumber(estimate.mainListYesVotes + estimate.mainListNoVotes)}</p>
          <p className="kpi-detail">
            igen: {formatNumber(estimate.mainListYesVotes)} | nem: {formatNumber(estimate.mainListNoVotes)}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Töredékszavazatok</p>
          <p className="kpi-value">{formatNumber(estimate.fragmentYesVotes + estimate.fragmentNoVotes)}</p>
          <p className="kpi-detail">
            igen: {formatNumber(estimate.fragmentYesVotes)} | nem: {formatNumber(estimate.fragmentNoVotes)}
          </p>
        </article>
      </section>

      <ParliamentHemicycle estimate={estimate} />

      <section className="pie-grid">
        <article className="pie-card">
          <header className="chart-card-head">
            <h2>Listás alap</h2>
            <p>Az országos listás szavazat és a töredékszavazat összege, amelyből a 93 mandátum kiosztása történik.</p>
          </header>
          <div className="mandate-breakdown">
            <article className="mandate-breakdown-row">
              <strong>igen listaalap</strong>
              <span>{formatNumber(estimate.listBasisYes)}</span>
            </article>
            <article className="mandate-breakdown-row">
              <strong>nem listaalap</strong>
              <span>{formatNumber(estimate.listBasisNo)}</span>
            </article>
            <article className="mandate-breakdown-row">
              <strong>igen küszöb</strong>
              <span>{estimate.qualifiedYes ? "átlépte" : "nem lépte át"}</span>
            </article>
            <article className="mandate-breakdown-row">
              <strong>nem küszöb</strong>
              <span>{estimate.qualifiedNo ? "átlépte" : "nem lépte át"}</span>
            </article>
          </div>
        </article>

        <article className="pie-card">
          <header className="chart-card-head">
            <h2>Módszertan</h2>
            <p>A magyar választási rendszer logikáját követő becslés, két listára egyszerűsítve.</p>
          </header>
          <div className="mandate-notes">
            <p>1. Az EVK mandátumot a vezető oldal kapja meg mind a 106 körzetben.</p>
            <p>2. A töredékszavazat a vesztes összes szavazata és a győztes fölös szavazata: győztes mínusz második plusz egy.</p>
            <p>3. A 93 listás mandátum d&apos;Hondt módszerrel oszlik ki az országos listás és töredékszavazatok alapján.</p>
            <p>4. Az 5%-os listás küszöb a főoldali országos listás szavazás arányából számolódik.</p>
            <p>
              <a
                href="https://www.valasztas.hu/ogy-alt-taj"
                target="_blank"
                rel="noreferrer"
                className="small-link-btn small-link-btn-secondary"
              >
                Hivatalos választási háttér
              </a>
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
