import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "../../lib/siteMetadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Adatvédelem",
  description: "Adatkezelési tájékoztató a kormanyvalto.com játékoldalhoz.",
  path: "/adatvedelem",
});

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page list-page list-page--narrow">
      <div className="hero-actions">
        <Link href="/" className="nav-link-button nav-link-button-small">
          Főoldal
        </Link>
      </div>
      <h1>Adatvédelmi tájékoztató</h1>
      <div className="legal-copy">
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
    </main>
  );
}
