import type { Metadata } from "next";
import { Baloo_2, Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollTop from "@/components/ScrollTop";
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

export const metadata: Metadata = {
  title: "Onsentraide.fr — L'entraide de quartier, en mieux",
  description:
    "Objets, services, transport, garde, alimentaire, alertes : toute l'entraide de votre commune au même endroit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${baloo.variable} ${jakarta.variable}`}>
      <body className="font-body">
        <Header />
        {children}
        <Footer />
        <ScrollTop />
      </body>
    </html>
  );
}
