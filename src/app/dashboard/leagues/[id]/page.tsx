import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { calculatePoints, getTier } from "@/lib/scoring";

export const revalidate = 60;

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", id)
    .single();

  if (!league) notFound();

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(display_name)")
    .eq("league_id", id);

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_score, away_score")
    .not("home_score", "is", null);

  const finishedMatchIds = (matches ?? []).map((m) => m.id);

  const { data: allPredictions } = await supabase
    .from("predictions")
    .select("user_id, match_id, home_score, away_score")
    .in(
      "user_id",
      (members ?? []).map((m) => m.user_id)
    )
    .in("match_id", finishedMatchIds);

  const matchMap = new Map((matches ?? []).map((m) => [m.id, m]));

  // Compute rare bonus: for each match, which exact predictions are unique in this league
  const exactCountPerMatch = new Map<string, number>();
  const exactPredictors = new Map<string, string[]>(); // matchId -> [userId]
  for (const pred of allPredictions ?? []) {
    const match = matchMap.get(pred.match_id);
    if (!match) continue;
    const tier = getTier(
      { home_score: pred.home_score, away_score: pred.away_score },
      { home_score: match.home_score!, away_score: match.away_score! }
    );
    if (tier === "exact") {
      const list = exactPredictors.get(pred.match_id) ?? [];
      list.push(pred.user_id);
      exactPredictors.set(pred.match_id, list);
      exactCountPerMatch.set(pred.match_id, (exactCountPerMatch.get(pred.match_id) ?? 0) + 1);
    }
  }

  const leaderboard = (members ?? []).map((member) => {
    const memberPreds = (allPredictions ?? []).filter(
      (p) => p.user_id === member.user_id
    );
    const points = memberPreds.reduce((sum, pred) => {
      const match = matchMap.get(pred.match_id);
      if (!match) return sum;
      const isUnique =
        (exactCountPerMatch.get(pred.match_id) ?? 0) === 1 &&
        (exactPredictors.get(pred.match_id) ?? []).includes(pred.user_id);
      return (
        sum +
        calculatePoints(
          { home_score: pred.home_score, away_score: pred.away_score },
          { home_score: match.home_score!, away_score: match.away_score! },
          isUnique
        )
      );
    }, 0);

    return {
      userId: member.user_id,
      displayName:
        (Array.isArray(member.profiles)
          ? (member.profiles[0] as { display_name: string } | undefined)?.display_name
          : (member.profiles as { display_name: string } | null)?.display_name) ??
        "Joueur",
      points,
      predictionsCount: memberPreds.length,
    };
  });

  leaderboard.sort((a, b) => b.points - a.points);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{league.name}</h1>
        {league.created_by === user!.id && (
          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">Admin</span>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Code d&apos;invitation :{" "}
        <span className="font-mono font-bold text-gray-700 text-base">{league.invite_code}</span>
        <span className="text-gray-300 mx-2">·</span>
        Partagez ce code avec vos amis !
      </p>

      <h2 className="text-lg font-semibold mb-3">Classement</h2>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Joueur</th>
              <th className="px-4 py-3 text-center">Pronostics</th>
              <th className="px-4 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr
                key={entry.userId}
                className={
                  entry.userId === user!.id
                    ? "bg-brand-50 font-semibold"
                    : "border-t border-gray-50"
                }
              >
                <td className="px-4 py-3 text-gray-400 font-bold">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="px-4 py-3">
                  {entry.displayName}
                  {entry.userId === user!.id && (
                    <span className="ml-1 text-xs text-brand-500">(vous)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">
                  {entry.predictionsCount}
                </td>
                <td className="px-4 py-3 text-right font-bold text-brand-700">
                  {entry.points} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
