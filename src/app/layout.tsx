import type { Metadata } from "next";
import Script from "next/script";
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
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-07GLPXKWW9" />
        <Script id="gtag-init">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-07GLPXKWW9');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
