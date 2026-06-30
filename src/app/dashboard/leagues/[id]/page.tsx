import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  calculatePoints, calculateTopScorerBonus, getTier,
  calculateKnockoutPoints, isKnockoutPhase,
  type KnockoutPrediction, type KnockoutResult,
} from "@/lib/scoring";
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

  // Members + display names + tournament picks + profile info
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(display_name, avatar_color, favorite_team, favorite_team_flag, predicted_winner, predicted_winner_flag, predicted_top_scorer_id)")
    .eq("league_id", id);

  const memberList = (members ?? []).map((m) => {
    const profile = Array.isArray(m.profiles)
      ? (m.profiles[0] as {
          display_name: string;
          avatar_color: string | null;
          favorite_team: string | null;
          favorite_team_flag: string | null;
          predicted_winner: string | null;
          predicted_winner_flag: string | null;
          predicted_top_scorer_id: string | null;
        } | undefined)
      : (m.profiles as {
          display_name: string;
          avatar_color: string | null;
          favorite_team: string | null;
          favorite_team_flag: string | null;
          predicted_winner: string | null;
          predicted_winner_flag: string | null;
          predicted_top_scorer_id: string | null;
        } | null);
    return {
      userId: m.user_id,
      displayName: profile?.display_name ?? "Joueur",
      avatarColor: profile?.avatar_color ?? "#0369a1",
      favoriteTeam: profile?.favorite_team ?? null,
      favoriteTeamFlag: profile?.favorite_team_flag ?? null,
      predictedWinner: profile?.predicted_winner ?? null,
      predictedWinnerFlag: profile?.predicted_winner_flag ?? null,
      topScorerId: profile?.predicted_top_scorer_id ?? null,
    };
  });

  const memberIds = memberList.map((m) => m.userId);
  const displayNameMap = new Map(memberList.map((m) => [m.userId, m.displayName]));

  const now = new Date();

  // Fetch all matches — include knockout fields
  const { data: allMatches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, phase, home_score, away_score, extra_time_home_score, extra_time_away_score, match_end_type, winner_team")
    .order("kickoff_at", { ascending: false });

  const lockedMatches = (allMatches ?? []).filter(
    (m) => new Date(m.kickoff_at) <= now || m.home_score !== null
  );

  const lockedMatchIds = lockedMatches.map((m) => m.id);

  // All predictions from league members — include knockout fields
  const allPredictions: Array<{
    user_id: string;
    match_id: string;
    home_score: number;
    away_score: number;
    qualifier_team: string | null;
    predicted_context: string | null;
    bonus_multiplier: number | null;
  }> = [];
  if (memberIds.length > 0 && lockedMatchIds.length > 0) {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: batch } = await supabase
        .from("predictions")
        .select("user_id, match_id, home_score, away_score, qualifier_team, predicted_context, bonus_multiplier")
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

  const finishedMatches = lockedMatches.filter((m) => m.home_score !== null);
  const finishedMatchIds = new Set(finishedMatches.map((m) => m.id));

  // Unique exact predictors per match
  // For knockout: "exact" depends on predicted_context (compare vs 90min or 120min score)
  const exactPredictors = new Map<string, string[]>();
  for (const pred of allPredictions) {
    if (!finishedMatchIds.has(pred.match_id)) continue;
    const match = matchMap.get(pred.match_id);
    if (!match || match.home_score === null) continue;

    const isKO = isKnockoutPhase(match.phase);
    let isExact = false;

    if (!isKO) {
      isExact = getTier(
        { home_score: pred.home_score, away_score: pred.away_score },
        { home_score: match.home_score, away_score: match.away_score }
      ) === "exact";
    } else if (pred.qualifier_team && pred.predicted_context && match.match_end_type && match.winner_team) {
      const koPred: KnockoutPrediction = {
        home_score: pred.home_score,
        away_score: pred.away_score,
        qualifier_team: pred.qualifier_team,
        predicted_context: pred.predicted_context as "90min" | "+",
      };
      const koResult: KnockoutResult = {
        home_score: match.home_score,
        away_score: match.away_score,
        extra_time_home_score: match.extra_time_home_score ?? null,
        extra_time_away_score: match.extra_time_away_score ?? null,
        match_end_type: match.match_end_type as "90min" | "aet" | "pens",
        winner_team: match.winner_team,
      };
      isExact = calculateKnockoutPoints(koPred, koResult, false).tier === "exact";
    }

    if (isExact) {
      const list = exactPredictors.get(pred.match_id) ?? [];
      list.push(pred.user_id);
      exactPredictors.set(pred.match_id, list);
    }
  }

  // Player goal tallies + tournament winner
  const [{ data: allPlayers }, { data: appConfig }] = await Promise.all([
    supabase.from("players").select("id, name, team_flag, goals, won_golden_boot"),
    supabase.from("app_config").select("key, value"),
  ]);
  const playerMap = new Map(
    (allPlayers ?? []).map((p) => [p.id, p as { id: string; name: string; team_flag: string; goals: number; won_golden_boot: boolean }])
  );
  const tournamentWinner = appConfig?.find((c) => c.key === "tournament_winner")?.value ?? null;

  // Leaderboard
  const leaderboard = memberList.map((member) => {
    const preds = allPredictions.filter(
      (p) => p.user_id === member.userId && finishedMatchIds.has(p.match_id)
    );
    let matchPoints = 0;
    let exactCount = 0;
    let goalDiffCount = 0;
    let correctWinnerCount = 0;
    let totalGoalsCount = 0;
    let wrongCount = 0;
    let correctCount = 0;

    for (const pred of preds) {
      const match = matchMap.get(pred.match_id);
      if (!match || match.home_score === null) continue;

      const exactList = exactPredictors.get(pred.match_id) ?? [];
      const uniqueExact = exactList.length === 1 && exactList[0] === pred.user_id;
      const isKO = isKnockoutPhase(match.phase);

      if (!isKO) {
        // Phase de groupes
        const multiplier = pred.bonus_multiplier ?? 1;
        const pts = calculatePoints(
          { home_score: pred.home_score, away_score: pred.away_score },
          { home_score: match.home_score, away_score: match.away_score },
          uniqueExact
        ) * multiplier;
        matchPoints += pts;
        const tier = getTier(
          { home_score: pred.home_score, away_score: pred.away_score },
          { home_score: match.home_score, away_score: match.away_score }
        );
        if (tier === "exact") exactCount++;
        else if (tier === "goal_diff") goalDiffCount++;
        else if (tier === "correct_winner") correctWinnerCount++;
        else if (tier === "total_goals") totalGoalsCount++;
        else wrongCount++;
        if (tier !== "wrong") correctCount++;
      } else if (pred.qualifier_team && pred.predicted_context && match.match_end_type && match.winner_team) {
        // Phase éliminatoire
        const koPred: KnockoutPrediction = {
          home_score: pred.home_score,
          away_score: pred.away_score,
          qualifier_team: pred.qualifier_team,
          predicted_context: pred.predicted_context as "90min" | "+",
        };
        const koResult: KnockoutResult = {
          home_score: match.home_score,
          away_score: match.away_score,
          extra_time_home_score: match.extra_time_home_score ?? null,
          extra_time_away_score: match.extra_time_away_score ?? null,
          match_end_type: match.match_end_type as "90min" | "aet" | "pens",
          winner_team: match.winner_team,
        };
        const breakdown = calculateKnockoutPoints(koPred, koResult, uniqueExact);
        matchPoints += breakdown.total * (pred.bonus_multiplier ?? 1);
        if (breakdown.tier === "exact") exactCount++;
        else if (breakdown.tier === "goal_diff") goalDiffCount++;
        else if (breakdown.tier === "total_goals") totalGoalsCount++;
        else wrongCount++;
        if (breakdown.total > 0) correctCount++;
      }
    }

    const player = member.topScorerId ? playerMap.get(member.topScorerId) : null;
    const topScorerBonus = player ? calculateTopScorerBonus(player.goals, player.won_golden_boot) : 0;
    const topScorerName = player?.name ?? null;
    const topScorerFlag = player?.team_flag ?? null;
    const winnerBonus = tournamentWinner && member.predictedWinner === tournamentWinner ? 20 : 0;
    const points = matchPoints + topScorerBonus + winnerBonus;

    return {
      ...member,
      points, matchPoints, topScorerBonus, winnerBonus,
      topScorerName, topScorerFlag,
      predictionsCount: preds.length,
      exactCount, goalDiffCount, correctWinnerCount, totalGoalsCount, wrongCount, correctCount,
    };
  });

  leaderboard.sort((a, b) =>
    b.points - a.points ||
    b.exactCount - a.exactCount ||
    b.goalDiffCount - a.goalDiffCount ||
    b.correctWinnerCount - a.correctWinnerCount ||
    b.totalGoalsCount - a.totalGoalsCount
  );

  // Match breakdown
  const breakdown: MatchBreakdownItem[] = lockedMatches.map((match) => {
    const isFinished = match.home_score !== null;
    const exactList = exactPredictors.get(match.id) ?? [];
    const isKO = isKnockoutPhase(match.phase);

    const entries = memberList.map((member) => {
      const pred = allPredictions.find(
        (p) => p.user_id === member.userId && p.match_id === match.id
      );
      let points: number | null = null;
      let tier = null;
      let knockdownBreakdown: { qualifierPts: number; contextPts: number; scorePts: number } | null = null;
      const uniqueExact = exactList.length === 1 && exactList[0] === member.userId;

      const multiplier = pred?.bonus_multiplier ?? 1;

      if (pred && isFinished) {
        if (!isKO) {
          points = calculatePoints(
            { home_score: pred.home_score, away_score: pred.away_score },
            { home_score: match.home_score!, away_score: match.away_score! },
            uniqueExact
          ) * multiplier;
          tier = getTier(
            { home_score: pred.home_score, away_score: pred.away_score },
            { home_score: match.home_score!, away_score: match.away_score! }
          );
        } else if (pred.qualifier_team && pred.predicted_context && match.match_end_type && match.winner_team) {
          const koPred: KnockoutPrediction = {
            home_score: pred.home_score,
            away_score: pred.away_score,
            qualifier_team: pred.qualifier_team,
            predicted_context: pred.predicted_context as "90min" | "+",
          };
          const koResult: KnockoutResult = {
            home_score: match.home_score!,
            away_score: match.away_score!,
            extra_time_home_score: match.extra_time_home_score ?? null,
            extra_time_away_score: match.extra_time_away_score ?? null,
            match_end_type: match.match_end_type as "90min" | "aet" | "pens",
            winner_team: match.winner_team,
          };
          const bd = calculateKnockoutPoints(koPred, koResult, uniqueExact);
          points = bd.total * multiplier;
          tier = bd.tier;
          knockdownBreakdown = { qualifierPts: bd.qualifierPts, contextPts: bd.contextPts, scorePts: bd.scorePts };
        }
      }

      return {
        userId: member.userId,
        displayName: member.displayName,
        prediction: pred ? { home_score: pred.home_score, away_score: pred.away_score } : null,
        knockoutPrediction: isKO && pred ? {
          qualifier_team: pred.qualifier_team,
          predicted_context: pred.predicted_context,
        } : null,
        knockoutBreakdown: knockdownBreakdown,
        bonusMultiplier: pred?.bonus_multiplier ?? null,
        points,
        tier,
        isMe: member.userId === user!.id,
        isUniqueExact: isFinished && !!pred && uniqueExact,
      };
    });

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
      extraTimeHomeScore: match.extra_time_home_score ?? null,
      extraTimeAwayScore: match.extra_time_away_score ?? null,
      phase: match.phase,
      matchEndType: match.match_end_type ?? null,
      winnerTeam: match.winner_team ?? null,
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
