import { getCounties } from "../lib/constituencies";
import { getHungaryCountyMapData } from "../lib/hungaryCountyMap";

type CountyHeroMapStat = {
  maz: string;
  name: string;
  yes: number;
  no: number;
  leadBloc: "yes" | "no" | "neutral";
};

type CountyHeroMapProps = {
  items?: CountyHeroMapStat[];
  title?: string;
  subtitle?: string;
  overlayLabel?: string;
  className?: string;
  colorMode?: "county" | "result";
};

export function CountyHeroMap({
  items = [],
  title,
  subtitle,
  overlayLabel = "Szavazás 2026",
  className = "",
  colorMode = "county",
}: CountyHeroMapProps) {
  const byMaz = new Map(items.map((item) => [item.maz, item]));
  const countyMap = getHungaryCountyMapData();
  const countyPaths = new Map(countyMap.counties.map((item) => [item.countyCode, item]));

  return (
    <section className={`county-hero county-map-card ${className}`.trim()}>
      <div className="county-hero-surface">
        <div className="county-hero-overlay">
          <span className="county-hero-kicker">{overlayLabel}</span>
          {title ? <h2>{title}</h2> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="county-map-wrap county-hero-map-wrap">
          <svg viewBox={countyMap.viewBox} className="county-map-svg county-hero-map-svg" role="img" aria-label="Magyarország vármegyei térkép">
            {getCounties().map((county) => {
              const stat = byMaz.get(county.maz) ?? { maz: county.maz, name: county.mazNev, yes: 0, no: 0, leadBloc: "neutral" as const };
              const countyPath = countyPaths.get(county.maz);
              if (!countyPath) return null;

              return (
                <a key={county.maz} href={`/ogy2026/egyeni-valasztokeruletek/${county.maz}`}>
                  <path
                    d={countyPath.pathData}
                    className={`county-shape ${colorMode === "result" ? `county-shape-${stat.leadBloc}` : `county-shape-county county-shape-county-${county.maz}`}`}
                  >
                    <title>
                      {stat.name} · igen: {stat.yes} · nem: {stat.no}
                    </title>
                  </path>
                </a>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
