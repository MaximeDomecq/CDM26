import { createClient } from "@/lib/supabase/server";
import KnockoutBracket from "@/components/KnockoutBracket";

export const revalidate = 60;

export default async function TableauPage() {
  const supabase = await createClient();

  // Fetch knockout matches (phase not starting with "Groupe")
  const { data: knockoutMatches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, phase, home_score, away_score")
    .not("phase", "like", "Groupe %")
    .order("kickoff_at");

  // Check if group stage is complete enough to show qualifiers
  const { data: groupMatches } = await supabase
    .from("matches")
    .select("home_team, away_team, phase, home_score, away_score")
    .like("phase", "Groupe %");

  const groupMatchesWithResult = (groupMatches ?? []).filter(
    (m) => m.home_score !== null && m.away_score !== null
  );
  const totalGroupMatches = groupMatches?.length ?? 72;
  const pctComplete = totalGroupMatches > 0
    ? Math.round((groupMatchesWithResult.length / totalGroupMatches) * 100)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Tableau de la compétition</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          32 équipes qualifiées · Huitièmes · Quarts · Demi-finales · Finale
        </p>
      </div>

      <KnockoutBracket
        knockoutMatches={knockoutMatches ?? []}
        pctComplete={pctComplete}
      />
    </div>
  );
}
