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
          <p className="boost-card-title">3x VOTE és adatvédelem</p>
          <p className="boost-privacy-strong">Az anonim szavazás alapból működik. A Google-belépés csak a 3x VOTE bónusz módhoz kell.</p>
          <div className="boost-fact-grid" aria-label="Adatvédelmi tudnivalók">
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Mit kapsz</p>
              <p className="boost-fact-value">Minden szavazatod 3x súllyal számít, és a várakozás lassabban nő.</p>
            </article>
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Mit használunk</p>
              <p className="boost-fact-value">Csak a belépési igazolást arra, hogy valódi felhasználó szavaz.</p>
            </article>
            <article className="boost-fact-card boost-fact-card-warning">
              <p className="boost-fact-label">Mit nem tárolunk</p>
              <p className="boost-fact-value">A Google-fiókod adatait nem használjuk külön célra, marketinghez vagy nyilvános megjelenítésre.</p>
            </article>
          </div>
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
