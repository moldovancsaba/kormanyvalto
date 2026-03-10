import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
