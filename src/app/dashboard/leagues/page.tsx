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
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mes ligues</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/leagues/join"
            className="px-4 py-2 rounded-xl border border-brand-500 dark:border-brand-600 text-brand-600 dark:text-brand-400 text-sm font-semibold hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
          >
            Rejoindre
          </Link>
          <Link
            href="/dashboard/leagues/create"
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all shadow-sm hover:shadow active:scale-95"
          >
            Créer une ligue
          </Link>
        </div>
      </div>

      {leagues.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <div className="text-5xl mb-3">🏆</div>
          <p className="font-semibold">Vous n&apos;avez pas encore de ligue.</p>
          <p className="text-sm mt-1">Créez-en une ou rejoignez celle d&apos;un ami !</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {leagues.map((league) => (
          <Link
            key={league!.id}
            href={`/dashboard/leagues/${league!.id}`}
            className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5 hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {league!.name}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                  Code :{" "}
                  <code className="font-mono font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {league!.invite_code}
                  </code>
                  {league!.created_by === user!.id && (
                    <span className="ml-2 text-brand-500 dark:text-brand-400">· Admin</span>
                  )}
                </p>
              </div>
              <span className="text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors text-xl">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
