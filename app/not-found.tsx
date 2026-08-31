import CitySearch from "@/components/CitySearch";

export default function NotFound() {
  return (
    <main className="font-display min-h-[70vh] flex items-center justify-center px-6 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-lg w-full text-center">
        <p className="text-6xl mb-4">🧭</p>
        <h1 className="text-3xl font-extrabold mb-2">Cette page n&apos;existe pas</h1>
        <p className="text-neutral-500 font-body mb-8">
          Le lien est peut-être erroné, ou la page a été supprimée. Cherchez votre commune pour retrouver votre chemin.
        </p>
        <CitySearch />
        <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm font-bold">
          <a href="/" className="px-5 py-2.5 rounded-full bg-ink text-white hover:bg-ink/85 transition">← Accueil</a>
          <a href="/contact" className="px-5 py-2.5 rounded-full border-2 border-neutral-200 text-neutral-600 hover:border-ink transition">Signaler un problème</a>
        </div>
      </div>
    </main>
  );
}
