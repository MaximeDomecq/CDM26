import { createClient } from "@/lib/supabase/server";
import GroupStandings from "@/components/GroupStandings";

export const revalidate = 60;

export default async function GroupesPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, phase, home_score, away_score, kickoff_at")
    .like("phase", "Groupe %")
    .order("kickoff_at");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Groupes & Classements</h1>
        <p className="text-gray-500 text-sm mt-1">
          Phase de groupes · 11 juin – 27 juin 2026 · 12 groupes de 4 équipes
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-200 inline-block" />
            Top 2 qualifiés automatiquement
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-200 inline-block" />
            8 meilleurs 3es qualifiés
          </span>
        </div>
      </div>

      <GroupStandings matches={matches ?? []} />
    </div>
  );
}
