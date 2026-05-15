import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.display_name ?? "Champion";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Bonjour, {displayName} 👋</h1>
      <p className="text-gray-500 mb-8">Coupe du Monde 2026 — 11 juin au 19 juillet</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/matches"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">📅</div>
          <h2 className="font-semibold text-lg group-hover:text-brand-600 transition">Matchs & pronostics</h2>
          <p className="text-sm text-gray-500 mt-1">Pronostiquez tous les matchs de la compétition.</p>
        </Link>
        <Link
          href="/dashboard/leagues"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">🏆</div>
          <h2 className="font-semibold text-lg group-hover:text-brand-600 transition">Mes ligues</h2>
          <p className="text-sm text-gray-500 mt-1">Créez ou rejoignez une ligue avec vos proches.</p>
        </Link>
      </div>
    </div>
  );
}
