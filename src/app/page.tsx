import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="mb-6 text-6xl">⚽</div>
      <h1 className="text-4xl font-bold mb-2 text-brand-700">CDM 2026</h1>
      <p className="text-lg text-gray-500 mb-8">
        Pronostiquez tous les matchs de la Coupe du Monde avec vos amis et votre famille.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
        >
          Se connecter
        </Link>
        <Link
          href="/auth/register"
          className="px-6 py-3 rounded-xl border border-brand-600 text-brand-600 font-semibold hover:bg-brand-50 transition"
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}
