import type { Metadata } from "next";
import Script from "next/script";
import ConsentBanner from "../components/ConsentBanner";
import "./globals.css";

const SOCIAL_IMAGE_URL = "/social-share-2026.png?v=2026-03-13-1";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kormanyvalto.com"),
  title: "Váltani akarsz?",
  description: "Egyszerű kérdés és időbélyeg napló",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Váltani akarsz?",
    description: "Egyszerű kérdés és időbélyeg napló",
    type: "website",
    url: "https://www.kormanyvalto.com",
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1536,
        height: 1024,
        alt: "Szavazás 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Váltani akarsz?",
    description: "Egyszerű kérdés és időbélyeg napló",
    images: [SOCIAL_IMAGE_URL],
  },
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
            style={{ display: "none", visibility: "hidden" }}
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
        <ConsentBanner />
      </body>
    </html>
  );
}
