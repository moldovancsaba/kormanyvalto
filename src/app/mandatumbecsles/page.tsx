import type { Metadata } from "next";
import { PageIntro, PageShell } from "../../components/PageChrome";
import ParliamentHemicycle from "../../components/ParliamentHemicycle";
import {
  createEmptyParliamentEstimate,
  getParliamentEstimate,
  type ParliamentEstimate,
} from "../../lib/results";
import { getSectionNavItems } from "../../lib/navigation";
import { formatCompactChipNumber, formatNumber } from "../../lib/numberFormat";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../lib/siteMetadata";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Váltani akarsz?",
  description: "Mandátumbecslés",
  path: "/mandatumbecsles",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

type BreakdownCardProps = {
  title: string;
  estimate: ParliamentEstimate;
};

function BreakdownCard({ title, estimate }: BreakdownCardProps) {
  return (
    <article className="pie-card">
      <header className="chart-card-head">
        <h2>{title}</h2>
        <p>106 egyéni, 93 listás. A listás mandátumok az országos és a töredékszavazatokból számolódnak.</p>
      </header>
      <div className="mandate-breakdown">
        <article className="mandate-breakdown-row">
          <strong>106 egyéni</strong>
          <span>
            igen {formatNumber(estimate.districtYesSeats)} | nem {formatNumber(estimate.districtNoSeats)} | nyitott{" "}
            {formatNumber(estimate.unresolvedDistrictSeats)}
          </span>
        </article>
        <article className="mandate-breakdown-row">
          <strong>93 listás</strong>
          <span>
            igen {formatNumber(estimate.listYesSeats)} | nem {formatNumber(estimate.listNoSeats)} | nyitott{" "}
            {formatNumber(estimate.unresolvedListSeats)}
          </span>
        </article>
        <article className="mandate-breakdown-row">
          <strong>országos listás szavazat</strong>
          <span>
            igen {formatNumber(estimate.mainListYesVotes)} | nem {formatNumber(estimate.mainListNoVotes)}
          </span>
        </article>
        <article className="mandate-breakdown-row">
          <strong>töredékszavazat</strong>
          <span>
            igen {formatNumber(estimate.fragmentYesVotes)} | nem {formatNumber(estimate.fragmentNoVotes)}
          </span>
        </article>
      </div>
    </article>
  );
}

export default async function ParliamentEstimatePage() {
  let currentEstimate = createEmptyParliamentEstimate("strict");
  let projectedEstimate = createEmptyParliamentEstimate("projection");

  try {
    [projectedEstimate, currentEstimate] = await Promise.all([
      getParliamentEstimate("projection"),
      getParliamentEstimate("strict"),
    ]);
  } catch {
    currentEstimate = createEmptyParliamentEstimate("strict");
    projectedEstimate = createEmptyParliamentEstimate("projection");
  }

  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/mandatumbecsles")}>
      <PageIntro
        eyebrow="Mandátumbecslés"
        title="Parlamenti patkó"
        intro="Két nézet ugyanarra az adatra: az első azt mutatja, mi történne, ha most zárna le a játék, a második pedig a jelenlegi szigorú állást hagyja nyitottnak, ahol még döntetlen vagy adat nélküli körzet van."
      />

      <section className="kpi-grid">
        <article className="kpi-card">
          <header className="chart-card-head">
            <h2>Ha most vége lenne</h2>
            <p>A teljes 199 mandátum kiosztva a jelenlegi vezetés alapján.</p>
          </header>
          <div className="kpi-dual-stack">
            <article className="kpi-dual-chip kpi-dual-chip-yes">
              <strong className="chip-number-fit">{formatCompactChipNumber(projectedEstimate.totalYesSeats)}</strong>
              <span>igen</span>
            </article>
            <article className="kpi-dual-chip kpi-dual-chip-no">
              <strong className="chip-number-fit">{formatCompactChipNumber(projectedEstimate.totalNoSeats)}</strong>
              <span>nem</span>
            </article>
          </div>
          <p className="kpi-detail">Igen és nem mandátumok véglegesített aránya.</p>
        </article>
        <article className="kpi-card">
          <header className="chart-card-head">
            <h2>Jelenlegi hivatalos állás</h2>
            <p>A már eldőlt helyek mandátumaránya, nyitott helyek külön számolva.</p>
          </header>
          <div className="kpi-dual-stack">
            <article className="kpi-dual-chip kpi-dual-chip-yes">
              <strong className="chip-number-fit">{formatCompactChipNumber(currentEstimate.totalYesSeats)}</strong>
              <span>igen</span>
            </article>
            <article className="kpi-dual-chip kpi-dual-chip-no">
              <strong className="chip-number-fit">{formatCompactChipNumber(currentEstimate.totalNoSeats)}</strong>
              <span>nem</span>
            </article>
          </div>
          <p className="kpi-detail">
            Nyitott helyek: {formatNumber(currentEstimate.unresolvedDistrictSeats + currentEstimate.unresolvedListSeats)}
          </p>
        </article>
        <article className="kpi-card">
          <header className="chart-card-head">
            <h2>Listaalap most</h2>
            <p>Országos és töredékszavazatok összesítve a listás mandátumszámításhoz.</p>
          </header>
          <div className="kpi-value-chip kpi-value-chip-neutral">
            <p className="kpi-value chip-number-fit">{formatCompactChipNumber(projectedEstimate.listBasisYes + projectedEstimate.listBasisNo)}</p>
            <span className="kpi-value-hint">szavazat</span>
          </div>
          <p className="kpi-detail">
            országos és töredékszavazatok összesen a 93 listás mandátumhoz
          </p>
        </article>
      </section>

      <div className="patko-grid">
        <ParliamentHemicycle
          estimate={projectedEstimate}
          eyebrow="1. nézet"
          title="Ha most vége lenne"
          subtitle="A még döntetlen vagy adat nélküli EVK-kat a pillanatnyi országos vezetés irányába zárjuk le, hogy teljes 199 fős képet kapjunk."
        />
        <ParliamentHemicycle
          estimate={currentEstimate}
          eyebrow="2. nézet"
          title="Jelenlegi hivatalos állás"
          subtitle="Csak a ténylegesen vezetett EVK-k és a hivatalos logikával kiosztható listás mandátumok kerülnek be, a nyitott helyek szürkén maradnak."
        />
      </div>

      <section className="pie-grid">
        <BreakdownCard title="Ha most vége lenne - bontás" estimate={projectedEstimate} />
        <BreakdownCard title="Jelenlegi hivatalos állás - bontás" estimate={currentEstimate} />
      </section>

      <section className="pie-grid">
        <article className="pie-card">
          <header className="chart-card-head">
            <h2>Módszertan</h2>
            <p>Az NVI országgyűlési logikáját követő becslés, két oldalra egyszerűsítve.</p>
          </header>
          <div className="mandate-notes">
            <p>1. 106 egyéni mandátum: az EVK-ban vezető oldal kapja a helyet.</p>
            <p>2. Töredékszavazat: a vesztes összes szavazata és a győztes fölös szavazata, vagyis győztes mínusz második plusz egy.</p>
            <p>3. 93 listás mandátum: d&apos;Hondt kiosztás az országos listás és töredékszavazatok együtteséből.</p>
            <p>4. A 2. nézet nyitva hagyja a döntetlen / adat nélküli körzeteket, az 1. nézet lezárja őket a pillanatnyi országos vezetés szerint.</p>
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
    </PageShell>
  );
}
