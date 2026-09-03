import type { Metadata, Viewport } from "next";
import { Baloo_2, Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollTop from "@/components/ScrollTop";
import RefCapture from "@/components/RefCapture";
import NouveautesPopup from "@/components/NouveautesPopup";
import { Suspense } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const SITE_URL = "https://onseditout.fr";
const DESCRIPTION =
  "Annonces entre habitants, agenda des associations, pros vérifiés et informations de la mairie : tout ce qui se passe dans votre commune, au même endroit.";

export const viewport: Viewport = {
  themeColor: "#2B2440",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "On se dit tout — Tout ce qui se passe dans votre commune",
    template: "%s · On se dit tout",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "On se dit tout",
    title: "On se dit tout — Tout ce qui se passe dans votre commune",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "onseditout.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "On se dit tout — Tout ce qui se passe dans votre commune",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Onseditout" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${baloo.variable} ${jakarta.variable}`}>
      <body className="font-body">
        <Suspense fallback={null}><RefCapture /></Suspense>
        <NouveautesPopup />
        <Header />
        {children}
        <Footer />
        <ScrollTop />
      </body>
    </html>
  );
}
