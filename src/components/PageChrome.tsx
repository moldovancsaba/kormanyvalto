"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { HERO_IMAGE_ALT, HERO_IMAGE_SRC } from "../lib/assets";
import type { NavItem } from "../lib/navigation";

type PageHeroProps = {
  showHero?: boolean;
};

type PageActionLinksProps = {
  items: NavItem[];
  small?: boolean;
};

type PageShellProps = {
  children: ReactNode;
  pageClassName?: string;
  narrow?: boolean;
  showHero?: boolean;
  navItems?: NavItem[];
};

export function PageHero({ showHero = true }: PageHeroProps) {
  if (!showHero) return null;

  return (
    <div className="top-logo">
      <Image src={HERO_IMAGE_SRC} alt={HERO_IMAGE_ALT} width={1536} height={1024} priority />
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
