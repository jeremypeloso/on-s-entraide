import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import MaCommune from "@/components/MaCommune";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-200 shadow-sm font-display">
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-6 py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="onsentraide.fr" className="h-14 w-auto" />
        </Link>

        <MaCommune />

        <div className="flex-1" />

        {/* Actions à droite */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/pro"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full border-2 border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white transition"
          >
            💼 Espace pro
          </Link>
          <Link
            href="/publier"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-coral to-coral-dark text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-coral/25 hover:scale-105 transition"
          >
            <span className="text-base leading-none">＋</span>
            <span className="hidden sm:inline">Publier une annonce</span>
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
