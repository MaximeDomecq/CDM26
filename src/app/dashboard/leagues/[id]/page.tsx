import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { calculatePoints, calculateTopScorerBonus, getTier } from "@/lib/scoring";
import type { MatchBreakdownItem } from "@/components/LeagueMatchBreakdown";
import LeagueTabs from "@/components/LeagueTabs";

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
  // Supabase enforces a server-side max_rows=1000 cap that client .limit() cannot override.
  // We paginate in batches of 1000 until all rows are retrieved.
  const allPredictions: Array<{ user_id: string; match_id: string; home_score: number; away_score: number }> = [];
  if (memberIds.length > 0 && lockedMatchIds.length > 0) {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: batch } = await supabase
        .from("predictions")
        .select("user_id, match_id, home_score, away_score")
        .in("user_id", memberIds)
        .in("match_id", lockedMatchIds)
        .order("id")
        .range(from, from + PAGE - 1);
      if (!batch || batch.length === 0) break;
      allPredictions.push(...batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }
  }

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
    let matchPoints = 0;
    let exactCount = 0;
    let correctCount = 0;
    for (const pred of preds) {
      const match = matchMap.get(pred.match_id);
      if (!match) continue;
      const exactList = exactPredictors.get(pred.match_id) ?? [];
      const uniqueExact = exactList.length === 1 && exactList[0] === pred.user_id;
      matchPoints += calculatePoints(
        { home_score: pred.home_score, away_score: pred.away_score },
        { home_score: match.home_score!, away_score: match.away_score! },
        uniqueExact
      );
      const tier = getTier(
        { home_score: pred.home_score, away_score: pred.away_score },
        { home_score: match.home_score!, away_score: match.away_score! }
      );
      if (tier === "exact") exactCount++;
      if (tier !== "wrong") correctCount++;
    }
    const player = member.topScorerId ? playerMap.get(member.topScorerId) : null;
    const topScorerBonus = player ? calculateTopScorerBonus(player.goals, player.won_golden_boot) : 0;
    const winnerBonus = tournamentWinner && member.predictedWinner === tournamentWinner ? 20 : 0;
    const points = matchPoints + topScorerBonus + winnerBonus;
    return { ...member, points, matchPoints, topScorerBonus, winnerBonus, predictionsCount: preds.length, exactCount, correctCount };
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

  const breakdownTermines = breakdown.filter((m) => m.homeScore !== null);
  const breakdownEnCours = breakdown.filter((m) => m.homeScore === null);

  return (
    <div className="max-w-3xl space-y-4">
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

      <LeagueTabs
        leaderboard={leaderboard}
        breakdownEnCours={breakdownEnCours}
        breakdownTermines={breakdownTermines}
        leagueId={id}
        currentUserId={user!.id}
        currentDisplayName={currentDisplayName}
      />
    </div>
  );
}
