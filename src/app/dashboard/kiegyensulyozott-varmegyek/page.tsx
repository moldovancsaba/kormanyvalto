import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../../../components/PageChrome";
import { getSectionNavItems } from "../../../lib/navigation";
import { formatAbsolutePercent } from "../../../lib/numberFormat";
import { getBalancedCountyDetailItems } from "../../../lib/dashboardDetailData";
import { buildPageMetadata, DASHBOARD_SOCIAL_IMAGE_URL } from "../../../lib/siteMetadata";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Kiegyensúlyozott vármegyék",
  description: "A legszorosabb vármegyei állások teljes listája.",
  path: "/dashboard/kiegyensulyozott-varmegyek",
  socialImagePath: DASHBOARD_SOCIAL_IMAGE_URL,
});

export default async function DashboardKiegyensulyozottVarmegyekPage() {
  const items = await getBalancedCountyDetailItems().catch(() => []);
  return (
    <PageShell pageClassName="dashboard-page" navItems={getSectionNavItems("/dashboard")}>
      <section className="chart-card chart-card-neutral">
        <header className="chart-card-head">
          <h1>Kiegyensúlyozott vármegyék</h1>
          <p>Ugyanabban a sorrendben, mint a dashboard blokk, vármegyei lista nézetben.</p>
        </header>
        {items.length === 0 ? (
          <p className="chart-empty">Nincs még kiegyensúlyozott vármegyei adat.</p>
        ) : (
          <section className="button-list" aria-label="Kiegyensúlyozott vármegyék listája">
            {items.map((item) => (
              <Link key={item.countyCode} href={item.href} className="route-button route-button--barometer">
                <svg viewBox="0 0 100 10" className="route-button-barometer-bg" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <rect x="0" y="0" width="100" height="10" className="route-button-bar-no" />
                  <rect x="0" y="0" width={item.yesPercent} height="10" className="route-button-bar-yes" />
                </svg>
                <span className="route-button-content">
                  <span className="route-button-title">{item.countyName}</span>
                  <span className="route-button-meta">
                    eltérés: {formatAbsolutePercent(item.marginPercent)} | igen: {item.yes} | nem: {item.no}
                  </span>
                </span>
              </Link>
            ))}
          </section>
        )}
      </section>
    </PageShell>
  );
}
