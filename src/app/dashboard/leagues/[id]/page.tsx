import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { calculatePoints, calculateTopScorerBonus, getTier } from "@/lib/scoring";
import type { MatchBreakdownItem } from "@/components/LeagueMatchBreakdown";
import LeagueMatchBreakdown from "@/components/LeagueMatchBreakdown";
import LeagueChat from "@/components/LeagueChat";

export const revalidate = 0;

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

  // Members + display names + tournament picks
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(display_name, predicted_top_scorer_id, predicted_winner)")
    .eq("league_id", id);

  const memberList = (members ?? []).map((m) => {
    const profile = Array.isArray(m.profiles)
      ? (m.profiles[0] as { display_name: string; predicted_top_scorer_id: string | null; predicted_winner: string | null } | undefined)
      : (m.profiles as { display_name: string; predicted_top_scorer_id: string | null; predicted_winner: string | null } | null);
    return {
      userId: m.user_id,
      displayName: profile?.display_name ?? "Joueur",
      topScorerId: profile?.predicted_top_scorer_id ?? null,
      predictedWinner: profile?.predicted_winner ?? null,
    };
  });

  const memberIds = memberList.map((m) => m.userId);
  const displayNameMap = new Map(memberList.map((m) => [m.userId, m.displayName]));

  const now = new Date();

  // Fetch all matches once, filter locally:
  // locked = kickoff has passed OR a score has already been set (simulation / real result)
  const { data: allMatches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, phase, home_score, away_score")
    .order("kickoff_at", { ascending: false });

  const lockedMatches = (allMatches ?? []).filter(
    (m) => new Date(m.kickoff_at) <= now || m.home_score !== null
  );

  const lockedMatchIds = lockedMatches.map((m) => m.id);

  // All predictions from league members for locked matches
  const { data: allPredictions } = await supabase
    .from("predictions")
    .select("user_id, match_id, home_score, away_score")
    .in("user_id", memberIds.length > 0 ? memberIds : ["none"])
    .in("match_id", lockedMatchIds.length > 0 ? lockedMatchIds : ["none"]);

  const matchMap = new Map(lockedMatches.map((m) => [m.id, m]));

  // Finished matches only (for leaderboard points)
  const finishedMatches = lockedMatches.filter((m) => m.home_score !== null);
  const finishedMatchIds = new Set(finishedMatches.map((m) => m.id));

  // Unique exact predictors per match (for bonus point)
  const exactPredictors = new Map<string, string[]>();
  for (const pred of allPredictions ?? []) {
    if (!finishedMatchIds.has(pred.match_id)) continue;
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

  // Player goal tallies + tournament winner — fetched in parallel
  const [{ data: allPlayers }, { data: appConfig }] = await Promise.all([
    supabase.from("players").select("id, goals, won_golden_boot"),
    supabase.from("app_config").select("key, value"),
  ]);
  const playerMap = new Map(
    (allPlayers ?? []).map((p) => [p.id, p as { id: string; goals: number; won_golden_boot: boolean }])
  );
  const tournamentWinner = appConfig?.find((c) => c.key === "tournament_winner")?.value ?? null;

  // Leaderboard — match points + top scorer bonus + predicted winner bonus
  const leaderboard = memberList.map((member) => {
    const preds = (allPredictions ?? []).filter(
      (p) => p.user_id === member.userId && finishedMatchIds.has(p.match_id)
    );
    const matchPoints = preds.reduce((sum, pred) => {
      const match = matchMap.get(pred.match_id);
      if (!match) return sum;
      const exactList = exactPredictors.get(pred.match_id) ?? [];
      const uniqueExact = exactList.length === 1 && exactList[0] === pred.user_id;
      return sum + calculatePoints(
        { home_score: pred.home_score, away_score: pred.away_score },
        { home_score: match.home_score!, away_score: match.away_score! },
        uniqueExact
      );
    }, 0);
    const player = member.topScorerId ? playerMap.get(member.topScorerId) : null;
    const topScorerBonus = player ? calculateTopScorerBonus(player.goals, player.won_golden_boot) : 0;
    const winnerBonus = tournamentWinner && member.predictedWinner === tournamentWinner ? 20 : 0;
    const points = matchPoints + topScorerBonus + winnerBonus;
    return { ...member, points, matchPoints, topScorerBonus, winnerBonus, predictionsCount: preds.length };
  });
  leaderboard.sort((a, b) => b.points - a.points);

  // Match breakdown — all locked matches, each member's prediction + points
  const breakdown: MatchBreakdownItem[] = lockedMatches.map((match) => {
    const isFinished = match.home_score !== null;
    const exactList = exactPredictors.get(match.id) ?? [];

    const entries = memberList.map((member) => {
      const pred = (allPredictions ?? []).find(
        (p) => p.user_id === member.userId && p.match_id === match.id
      );
      let points: number | null = null;
      let tier = null;
      const uniqueExact = exactList.length === 1 && exactList[0] === member.userId;
      if (pred && isFinished) {
        points = calculatePoints(
          { home_score: pred.home_score, away_score: pred.away_score },
          { home_score: match.home_score!, away_score: match.away_score! },
          uniqueExact
        );
        tier = getTier(
          { home_score: pred.home_score, away_score: pred.away_score },
          { home_score: match.home_score!, away_score: match.away_score! }
        );
      }
      return {
        userId: member.userId,
        displayName: member.displayName,
        prediction: pred ? { home_score: pred.home_score, away_score: pred.away_score } : null,
        points,
        tier,
        isMe: member.userId === user!.id,
        isUniqueExact: isFinished && !!pred && uniqueExact,
      };
    });

    // Sort: me first, then by points desc
    entries.sort((a, b) => {
      if (a.isMe) return -1;
      if (b.isMe) return 1;
      if (a.points !== null && b.points !== null) return b.points - a.points;
      return 0;
    });

    return {
      matchId: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      kickoffAt: match.kickoff_at,
      homeScore: match.home_score,
      awayScore: match.away_score,
      phase: match.phase,
      entries,
    };
  });

  const currentDisplayName = displayNameMap.get(user!.id) ?? "Moi";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{league.name}</h1>
          {league.created_by === user!.id && (
            <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 px-2 py-1 rounded-full font-semibold mt-1">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-gray-500 dark:text-gray-400">Code d&apos;invitation :</p>
          <code className="font-mono font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm tracking-widest">
            {league.invite_code}
          </code>
          <span className="text-sm text-gray-400 dark:text-gray-600">— Partagez avec vos amis !</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Classement</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card">
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
                    <span className="text-lg">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (
                        <span className="font-bold text-gray-400 dark:text-gray-600 text-sm">{i + 1}</span>
                      )}
                    </span>
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
                    {entry.topScorerBonus > 0 && (
                      <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold">
                        ⚽ +{entry.topScorerBonus}
                      </div>
                    )}
                    {entry.winnerBonus > 0 && (
                      <div className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold">
                        🏆 +{entry.winnerBonus}
                      </div>
                    )}
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
      </div>

      {/* Match breakdown */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
          Pronostics & résultats — matchs joués
        </h2>
        <LeagueMatchBreakdown breakdown={breakdown} />
      </div>

      {/* Chat */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Discussion</h2>
        <LeagueChat
          leagueId={id}
          currentUserId={user!.id}
          currentDisplayName={currentDisplayName}
        />
      </div>

      {/* Scoring rules */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card">
        <div className="bg-wc-header px-5 py-3">
          <h3 className="text-white font-black text-sm">Comment sont calculés les points ?</h3>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Par match</h4>
            <div className="space-y-2">
              {[
                { pts: "5 pts", label: "Score exact", sub: "", color: "emerald" },
                { pts: "+1",   label: "Bonus score unique", sub: "Si tu es le seul de la ligue à avoir le bon score", color: "emerald" },
                { pts: "3 pts", label: "Bonne différence de buts", sub: "Ex : prono 2-0, résultat 3-1", color: "blue" },
                { pts: "2 pts", label: "Bon résultat", sub: "Victoire ou match nul correct", color: "sky" },
                { pts: "1 pt",  label: "Bon nombre de buts", sub: "Le total de buts des deux équipes est correct", color: "amber" },
                { pts: "0 pt",  label: "Mauvais pronostic", sub: "", color: "gray" },
              ].map(({ pts, label, sub, color }) => (
                <div key={pts} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 font-black text-xs px-2 py-0.5 rounded-full min-w-[44px] text-center
                    ${color === "emerald" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
                      color === "blue"    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" :
                      color === "sky"     ? "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400" :
                      color === "amber"   ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" :
                                           "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500"
                    }`}>{pts}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{label}</div>
                    {sub && <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Bonus de tournoi</h4>
            <div className="space-y-3">
              <div className="rounded-xl border border-gold-300 dark:border-gold-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                <div className="flex items-center gap-2 mb-1"><span>🏆</span><span className="font-bold text-sm text-gray-900 dark:text-white">Vainqueur de la Coupe</span></div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Si ton équipe gagne : <span className="font-black text-emerald-600 dark:text-emerald-400">+20 pts</span></p>
              </div>
              <div className="rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/50 dark:bg-brand-950/20 p-3">
                <div className="flex items-center gap-2 mb-1"><span>⚽</span><span className="font-bold text-sm text-gray-900 dark:text-white">Meilleur buteur</span></div>
                <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-black text-emerald-600 dark:text-emerald-400">+2 pts</span> par but · <span className="font-black text-emerald-600 dark:text-emerald-400">+10 pts</span> Soulier d&apos;Or</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
