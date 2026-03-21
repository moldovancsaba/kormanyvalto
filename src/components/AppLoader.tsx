export default function AppLoader() {
  return (
    <main className="app-loading-shell" aria-busy="true" aria-live="polite">
      <section className="app-loading-card" aria-label="Oldal betöltése">
        <p className="app-loading-eyebrow">Betöltés</p>
        <div className="app-loader-bars" aria-hidden="true">
          <div className="app-loader-bar app-loader-bar-1" />
          <div className="app-loader-bar app-loader-bar-2" />
          <div className="app-loader-bar app-loader-bar-3" />
          <div className="app-loader-bar app-loader-bar-4" />
          <div className="app-loader-bar app-loader-bar-5" />
          <div className="app-loader-bar app-loader-bar-6" />
        </div>
        <p className="app-loading-title">Az oldal tartalma töltődik</p>
        <p className="app-loading-copy">Közben előkészítjük a szavazási és infóközpont adatokat.</p>
      </section>
    </main>
  );
}
