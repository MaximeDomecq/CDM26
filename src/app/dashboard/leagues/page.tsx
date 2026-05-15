import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, invite_code, created_by)")
    .eq("user_id", user!.id);

  type LeagueRow = { id: string; name: string; invite_code: string; created_by: string };
  const leagues = (memberships ?? [])
    .map((m) => {
      const l = m.leagues;
      if (!l) return null;
      const row = Array.isArray(l) ? l[0] : l;
      return row as LeagueRow | undefined;
    })
    .filter((l): l is LeagueRow => Boolean(l));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes ligues</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/leagues/join"
            className="px-4 py-2 rounded-lg border border-brand-600 text-brand-600 text-sm font-semibold hover:bg-brand-50 transition"
          >
            Rejoindre
          </Link>
          <Link
            href="/dashboard/leagues/create"
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
          >
            Créer une ligue
          </Link>
        </div>
      </div>

      {leagues.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🏆</div>
          <p>Vous n&apos;avez pas encore de ligue.</p>
          <p className="text-sm mt-1">Créez-en une ou rejoignez celle d&apos;un ami !</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {leagues.map((league) => (
          <Link
            key={league!.id}
            href={`/dashboard/leagues/${league!.id}`}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg group-hover:text-brand-600 transition">
                  {league!.name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Code : <span className="font-mono font-bold text-gray-600">{league!.invite_code}</span>
                  {league!.created_by === user!.id && (
                    <span className="ml-2 text-brand-500">· Admin</span>
                  )}
                </p>
              </div>
              <span className="text-gray-300 group-hover:text-brand-400 transition text-xl">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
