import type { Metadata } from "next";
import { PageShell } from "../../components/PageChrome";
import { getSectionNavItems } from "../../lib/navigation";
import { buildPageMetadata } from "../../lib/siteMetadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Felhasználási feltételek",
  description: "Felhasználási feltételek a kormanyvalto.com játékoldalhoz.",
  path: "/felhasznalasi-feltetelek",
});

export default function TermsPage() {
  return (
    <PageShell pageClassName="legal-page" narrow navItems={getSectionNavItems()}>
      <h1>Felhasználási feltételek</h1>
      <div className="legal-copy">
        <p>
          A kormanyvalto.com egy játék és közösségi interakciós felület. Az oldalon leadott szavazatok nem minősülnek
          hivatalos választási cselekménynek, nem kötelező erejűek, és semmilyen jogi vagy közigazgatási következményt
          nem váltanak ki.
        </p>
        <h2>A szolgáltatás jellege</h2>
        <ul>
          <li>Ez egy játék.</li>
          <li>Az eredmények tájékoztató és szórakoztató célt szolgálnak.</li>
          <li>Az oldal célja a játék, megosztás és közösségi aktivitás ösztönzése.</li>
        </ul>
        <h2>Felhasználói magatartás</h2>
        <p>A szolgáltatás használatával elfogadod, hogy nem próbálod meg az oldalt visszaélésszerűen terhelni.</p>
        <p>
          A működtető jogosult technikai korlátozásokat, szűréseket, valamint szükség esetén szavazatok vagy
          munkamenetek törlését alkalmazni, ha visszaélés vagy automatizált használat gyanúja merül fel.
        </p>
        <h2>Belépés és 3x VOTE</h2>
        <p>
          A Google belépés csak arra szolgál, hogy a felhasználó elérje a 3x VOTE játékmódot. A bejelentkezés nem jelent
          hivatalos azonosítást vagy választói jogosultság-ellenőrzést.
        </p>
        <h2>Felelősség</h2>
        <p>
          Az oldal az aktuális állapotában kerül biztosításra. A működtető nem vállal felelősséget semmilyen döntésért,
          amelyet valaki az itt megjelenő játékos eredményekre alapoz.
        </p>
        <p>Játssz, oszd meg, lájkold, de kezeld úgy, aminek készült: közösségi játéknak.</p>
      </div>
    </PageShell>
  );
}
