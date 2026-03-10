import type { Metadata } from "next";
import Script from "next/script";
import ConsentBanner from "../components/ConsentBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Váltani akarsz?",
  description: "Egyszerű kérdés és időbélyeg napló",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body>
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
