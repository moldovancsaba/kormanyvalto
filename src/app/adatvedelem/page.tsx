import type { Metadata } from "next";
import { PageIntro, PageShell } from "../../components/PageChrome";
import { getSectionNavItems } from "../../lib/navigation";
import { buildPageMetadata } from "../../lib/siteMetadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Adatvédelem",
  description: "Adatkezelési tájékoztató a kormanyvalto.com játékoldalhoz.",
  path: "/adatvedelem",
});

export default function PrivacyPolicyPage() {
  return (
    <PageShell pageClassName="legal-page" narrow navItems={getSectionNavItems()}>
      <PageIntro eyebrow="Jogi" title="Adatvédelmi tájékoztató" intro="Hogyan kezeljük a játék működéséhez szükséges technikai és belépési adatokat." />
      <div className="legal-copy">
        <section className="boost-card boost-card-warning" aria-label="Adatvédelmi figyelmeztetés">
          <header className="boost-warning-header">
            <span className="material-symbols-rounded boost-warning-icon" aria-hidden="true">
              warning
            </span>
            <h2>FIGYELEM</h2>
          </header>

          <p className="boost-privacy-strong">Nem gyűjtünk és nem tárolunk személyes adatokat.</p>
          <p className="boost-card-copy">
            A Google-belépést kizárólag arra használjuk, hogy megerősítsük: valódi felhasználó szavaz.
          </p>
          <p className="boost-card-copy">
            A rendszer nem menti el a Google-fiókod adatait, és azokat nem használjuk semmilyen más célra.
          </p>

          <hr className="boost-card-divider" />

          <header className="boost-subsection-header">
            <span className="material-symbols-rounded boost-subsection-icon" aria-hidden="true">
              flash_on
            </span>
            <h3>3x SZAVAZAT GOOGLE-BELÉPÉSSEL</h3>
          </header>

          <ul className="boost-benefits-list">
            <li>
              <span className="material-symbols-rounded boost-benefit-icon" aria-hidden="true">
                brightness_alert
              </span>
              <span className="boost-benefit-highlight">minden szavazatod 3x súllyal számít</span>
            </li>
            <li>
              <span className="material-symbols-rounded boost-benefit-icon" aria-hidden="true">
                siren
              </span>
              <span className="boost-benefit-highlight">a várakozási idő lassabban növekszik</span>
            </li>
          </ul>
        </section>

        <p>
          A kormanyvalto.com egy közösségi játékoldal. Nem hivatalos választási rendszer, nem közhiteles szavazás,
          és a megjelenő eredményeknek nincs jogi hatálya.
        </p>
        <h2>Mit kezelünk</h2>
        <p>
          A játék működéséhez eltároljuk a leadott szavazat típusát, időbélyegét, az érintett oldal vagy körzet
          azonosítóját, valamint a technikai munkamenethez szükséges sütiket.
        </p>
        <p>
          Ha a felhasználó Google belépéssel használja a 3x VOTE módot, akkor minimális belépési adatokat kezelünk a
          munkamenethez: azonosító, név, e-mail cím és opcionális profilkép. Ezt kizárólag a bejelentkezett állapot és
          a 3x szorzó biztosítására használjuk.
        </p>
        <h2>Mit nem teszünk</h2>
        <ul>
          <li>Nem kérjük el és nem tároljuk a Google jelszavadat.</li>
          <li>Nem tesszük közzé nyilvánosan a személyes adataidat.</li>
          <li>Nem értékesítjük az adataidat harmadik félnek.</li>
        </ul>
        <h2>Mire használjuk az adatokat</h2>
        <ul>
          <li>szavazatok összesítésére és megjelenítésére,</li>
          <li>3x VOTE mód biztosítására belépett felhasználóknak,</li>
          <li>visszaélések és túlterhelés csökkentésére.</li>
        </ul>
        <h2>Megőrzés</h2>
        <p>
          A szavazatok és kapcsolódó technikai adatok addig maradhatnak meg, amíg a játék működtetése, statisztika,
          vagy visszaélés-megelőzés ezt indokolja.
        </p>
        <p>
          Ha kérdésed van az oldal működéséről, a játék használatának folytatásával tudomásul veszed, hogy ez egy
          nyilvános, könnyed közösségi játékfelület.
        </p>
      </div>
    </PageShell>
  );
}
