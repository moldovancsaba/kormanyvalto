import Link from "next/link";
import { ReactNode } from "react";
import { CountyHeroMap } from "./CountyHeroMap";
import { constituencies, getCounties } from "../lib/constituencies";
import type { NavItem } from "../lib/navigation";
import { getLeadBlocFromCounts, getScopeVoteCounts } from "../lib/results";

type PageHeroProps = {
  showHero?: boolean;
};

type PageActionLinksProps = {
  items: NavItem[];
  small?: boolean;
};

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
};

type PageShellProps = {
  children: ReactNode;
  pageClassName?: string;
  narrow?: boolean;
  showHero?: boolean;
  navItems?: NavItem[];
};

export async function PageHero({ showHero = true }: PageHeroProps) {
  if (!showHero) return null;

  const counties = getCounties();
  const scopes = constituencies.map((c) => `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`);

  let countyStats: Array<{ maz: string; name: string; yes: number; no: number; leadBloc: "yes" | "no" | "neutral" }> = [];
  try {
    const counts = await getScopeVoteCounts(scopes);
    countyStats = counties.map((county) => {
      const countyConstituencies = constituencies.filter((c) => c.maz === county.maz);
      const yes = countyConstituencies.reduce((sum, c) => {
        const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
        return sum + (counts[scope]?.yes ?? 0);
      }, 0);
      const no = countyConstituencies.reduce((sum, c) => {
        const scope = `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`;
        return sum + (counts[scope]?.no ?? 0);
      }, 0);
      return {
        maz: county.maz,
        name: county.mazNev,
        yes,
        no,
        leadBloc: getLeadBlocFromCounts(yes, no),
      };
    });
  } catch {
    countyStats = counties.map((county) => ({
      maz: county.maz,
      name: county.mazNev,
      yes: 0,
      no: 0,
      leadBloc: "neutral" as const,
    }));
  }

  return (
    <div className="top-logo">
      <CountyHeroMap
        items={countyStats}
        colorMode="result"
        overlayLabel="2026 április 12"
        title="SZAVAZÁS"
        subtitle="Váltani akarsz? Vagy nem? Válassz."
      />
    </div>
  );
}

export function PageActionLinks({ items, small = true }: PageActionLinksProps) {
  if (items.length === 0) return null;

  return (
    <div className="hero-actions">
      {items.map((item) => {
        const className = `nav-link-button${small ? " nav-link-button-small" : ""}${item.secondary ? " nav-link-button-secondary" : ""}${item.danger ? " nav-link-button-danger" : ""}`;
        const content = (
          <>
            {item.icon ? (
              <span className="nav-link-button-icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span className="nav-link-button-label">{item.label}</span>
          </>
        );

        if (item.external) {
          return (
            <a key={`${item.href}:${item.label}`} href={item.href} className={className} target="_blank" rel="noreferrer">
              {content}
            </a>
          );
        }

        return (
          <Link key={`${item.href}:${item.label}`} href={item.href} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}

export function PageIntro({ eyebrow, title, intro }: PageIntroProps) {
  return (
    <header className="page-intro">
      {eyebrow ? <p className="page-intro-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {intro ? <p className="page-intro-copy">{intro}</p> : null}
    </header>
  );
}

export function PageShell({
  children,
  pageClassName = "",
  narrow = false,
  showHero = true,
  navItems = [],
}: PageShellProps) {
  const className = ["list-page", narrow ? "list-page--narrow" : "", pageClassName].filter(Boolean).join(" ");

  return (
    <main className={className}>
      <PageHero showHero={showHero} />
      <PageActionLinks items={navItems} />
      {children}
    </main>
  );
}
