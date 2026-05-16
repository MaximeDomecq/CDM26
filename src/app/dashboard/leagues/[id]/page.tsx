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
    .select("id, home_team, away_team, home_score, away_score")
    .not("home_score", "is", null);

  const finishedMatchIds = (matches ?? []).map((m) => m.id);

  const { data: allPredictions } = await supabase
    .from("predictions")
    .select("user_id, match_id, home_score, away_score")
    .in("user_id", (members ?? []).map((m) => m.user_id))
    .in("match_id", finishedMatchIds.length > 0 ? finishedMatchIds : ["none"]);

  const matchMap = new Map((matches ?? []).map((m) => [m.id, m]));

  const exactPredictors = new Map<string, string[]>();
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
    }
  }

  const leaderboard = (members ?? []).map((member) => {
    const memberPreds = (allPredictions ?? []).filter((p) => p.user_id === member.user_id);
    const points = memberPreds.reduce((sum, pred) => {
      const match = matchMap.get(pred.match_id);
      if (!match) return sum;
      const uniqueExact =
        (exactPredictors.get(pred.match_id) ?? []).length === 1 &&
        (exactPredictors.get(pred.match_id) ?? []).includes(pred.user_id);
      return sum + calculatePoints(
        { home_score: pred.home_score, away_score: pred.away_score },
        { home_score: match.home_score!, away_score: match.away_score! },
        uniqueExact
      );
    }, 0);

    return {
      userId: member.user_id,
      displayName:
        (Array.isArray(member.profiles)
          ? (member.profiles[0] as { display_name: string } | undefined)?.display_name
          : (member.profiles as { display_name: string } | null)?.display_name) ?? "Joueur",
      points,
      predictionsCount: memberPreds.length,
    };
  });

  leaderboard.sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{league.name}</h1>
        {league.created_by === user!.id && (
          <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 px-2 py-1 rounded-full font-semibold mt-1">Admin</span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Code d&apos;invitation :
        </p>
        <code className="font-mono font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm tracking-widest">
          {league.invite_code}
        </code>
        <span className="text-sm text-gray-400 dark:text-gray-600">— Partagez avec vos amis !</span>
      </div>

      {/* Leaderboard */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Classement</h2>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Joueur</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Pronos</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {leaderboard.map((entry, i) => (
              <tr
                key={entry.userId}
                className={
                  entry.userId === user!.id
                    ? "bg-brand-50 dark:bg-brand-950/30"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                }
              >
                <td className="px-4 py-3.5 text-center">
                  <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="font-bold text-gray-400 dark:text-gray-600 text-sm">{i + 1}</span>}</span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                  {entry.displayName}
                  {entry.userId === user!.id && (
                    <span className="ml-2 text-xs text-brand-500 dark:text-brand-400 font-medium">(vous)</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center text-gray-500 dark:text-gray-400 text-sm">
                  {entry.predictionsCount}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-black text-brand-600 dark:text-brand-400 text-base">{entry.points}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-600 ml-1">pts</span>
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
                  Aucun membre pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Scoring rules */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card">
        <div className="bg-wc-header px-5 py-3">
          <h3 className="text-white font-black text-sm">Comment sont calculés les points ?</h3>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-5">
          {/* Match points */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Par match</h4>
            <div className="space-y-2">
              {[
                { pts: "5 pts", label: "Score exact", sub: "+1 bonus si seul de la ligue", color: "emerald" },
                { pts: "3 pts", label: "Bonne différence de buts", sub: "Ex: 2-0 pronostiqué, 3-1 réel", color: "blue" },
                { pts: "2 pts", label: "Bon résultat (victoire/nul)", sub: "Bonne équipe ou match nul", color: "sky" },
                { pts: "1 pt",  label: "Total de buts correct", sub: "Même nombre de buts total", color: "amber" },
                { pts: "0 pt",  label: "Mauvais pronostic", sub: "", color: "gray" },
              ].map(({ pts, label, sub, color }) => (
                <div key={pts} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 font-black text-xs px-2 py-0.5 rounded-full min-w-[44px] text-center
                    ${color === "emerald" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
                      color === "blue"    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" :
                      color === "sky"     ? "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400" :
                      color === "amber"   ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" :
                                           "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500"
                    }`}>
                    {pts}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{label}</div>
                    {sub && <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tournament bonuses */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Bonus de tournoi</h4>
            <div className="space-y-3">
              <div className="rounded-xl border border-gold-300 dark:border-gold-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>🏆</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Vainqueur de la Coupe du Monde</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Si ton équipe gagnante remporte le tournoi :{" "}
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+20 pts</span>
                </p>
              </div>
              <div className="rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/50 dark:bg-brand-950/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>⚽</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Meilleur buteur</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+2 pts</span> par but marqué par ton joueur
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+10 pts</span> s&apos;il remporte le Soulier d&apos;Or
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
