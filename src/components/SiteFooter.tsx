import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-links" aria-label="Jogi linkek">
        <Link href="/adatvedelem">Adatvédelem</Link>
        <Link href="/felhasznalasi-feltetelek">Felhasználási feltételek</Link>
      </nav>
      <p className="site-footer-copy">Ez egy közösségi játékoldal, nem hivatalos választási rendszer.</p>
    </footer>
  );
}
