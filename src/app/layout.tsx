import type { Metadata } from "next";
import Script from "next/script";
import ConsentBanner from "../components/ConsentBanner";
import SiteFooter from "../components/SiteFooter";
import { buildPageMetadata, SITE_URL } from "../lib/siteMetadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.webmanifest",
  ...buildPageMetadata({
    title: "Váltani akarsz?",
    description: "Országos",
    path: "/",
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <head>
        <Script id="gtm-head" strategy="beforeInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PM46B3TD');
          `}
        </Script>
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PM46B3TD"
            height="0"
            width="0"
            className="gtm-noscript-frame"
          />
        </noscript>
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500
            });
            gtag('config', 'G-07GLPXKWW9');
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-07GLPXKWW9"
          strategy="afterInteractive"
        />
        {children}
        <SiteFooter />
        <ConsentBanner />
      </body>
    </html>
  );
}
