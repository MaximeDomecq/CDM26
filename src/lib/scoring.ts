// ── Phase de groupes ────────────────────────────────────────────────────────

export interface Prediction {
  home_score: number;
  away_score: number;
}

export interface Result {
  home_score: number;
  away_score: number;
}

export type ScoreTier =
  | "exact"
  | "goal_diff"
  | "correct_winner"
  | "total_goals"
  | "wrong";

export function getTier(prediction: Prediction, result: Result): ScoreTier {
  const predDiff = prediction.home_score - prediction.away_score;
  const realDiff = result.home_score - result.away_score;
  const predTotal = prediction.home_score + prediction.away_score;
  const realTotal = result.home_score + result.away_score;

  if (
    prediction.home_score === result.home_score &&
    prediction.away_score === result.away_score
  ) {
    return "exact";
  }

  if (predDiff === realDiff) {
    return "goal_diff";
  }

  const predWinner = Math.sign(predDiff);
  const realWinner = Math.sign(realDiff);
  if (predWinner === realWinner) {
    return "correct_winner";
  }

  if (predTotal === realTotal) {
    return "total_goals";
  }

  return "wrong";
}

const TIER_POINTS: Record<ScoreTier, number> = {
  exact: 5,
  goal_diff: 3,
  correct_winner: 2,
  total_goals: 1,
  wrong: 0,
};

export function calculatePoints(
  prediction: Prediction,
  result: Result,
  isUniqueExact: boolean = false
): number {
  const tier = getTier(prediction, result);
  let points = TIER_POINTS[tier];
  if (tier === "exact" && isUniqueExact) {
    points += 1;
  }
  return points;
}

export function calculateTopScorerBonus(goals: number, wonGoldenBoot: boolean): number {
  return goals * 2 + (wonGoldenBoot ? 10 : 0);
}

// ── Phase éliminatoire (knockout) ────────────────────────────────────────────

export function isKnockoutPhase(phase: string): boolean {
  return !phase.startsWith("Groupe");
}

export interface KnockoutPrediction {
  home_score: number;          // score prédit à 90 min
  away_score: number;
  qualifier_team: string;      // équipe prédite pour se qualifier
  predicted_context: "90min" | "+"; // 90min = victoire en temps réglementaire, + = prol ou tab
}

export interface KnockoutResult {
  home_score: number;                    // fullTime
  away_score: number;
  extra_time_home_score: number | null;  // score cumulatif à 120 min (null si 90min)
  extra_time_away_score: number | null;
  match_end_type: "90min" | "aet" | "pens";
  winner_team: string;                   // équipe qualifiée
}

export type KnockoutTier = "exact" | "goal_diff" | "total_goals" | "wrong";

export interface KnockoutBreakdown {
  total: number;
  qualifierPts: number;  // 0 ou 2
  contextPts: number;    // 0 ou 1
  scorePts: number;      // 0, 1, 2, 3 ou 4 (3+1 si unique)
  tier: KnockoutTier;
}

export function calculateKnockoutPoints(
  prediction: KnockoutPrediction,
  result: KnockoutResult,
  isUniqueExact: boolean = false
): KnockoutBreakdown {
  // Contexte réel : '90min' si victoire en temps réglementaire, '+' sinon (prol ou tab)
  const resultContext: "90min" | "+" = result.match_end_type === "90min" ? "90min" : "+";

  const qualifierPts = prediction.qualifier_team === result.winner_team ? 2 : 0;
  const contextPts = prediction.predicted_context === resultContext ? 1 : 0;

  // Score à comparer selon le contexte prédit
  // Si '90min' → on compare au score de 90 min (fullTime)
  // Si '+' → on compare au score à 120 min (extraTime si dispo, sinon fullTime = même nul pour tab)
  const compHome =
    prediction.predicted_context === "90min"
      ? result.home_score
      : (result.extra_time_home_score ?? result.home_score);
  const compAway =
    prediction.predicted_context === "90min"
      ? result.away_score
      : (result.extra_time_away_score ?? result.away_score);

  const isExact = prediction.home_score === compHome && prediction.away_score === compAway;
  const isGoodDiff = prediction.home_score - prediction.away_score === compHome - compAway;
  const isGoodTotal = prediction.home_score + prediction.away_score === compHome + compAway;

  let tier: KnockoutTier = "wrong";
  let scorePts = 0;

  // Les points de score (exact / diff) ne sont attribués que si le qualifié ET le contexte sont corrects
  if (qualifierPts > 0 && contextPts > 0) {
    if (isExact) {
      tier = "exact";
      scorePts = 3 + (isUniqueExact ? 1 : 0);
    } else if (isGoodDiff) {
      tier = "goal_diff";
      scorePts = 2;
    }
  }

  // Consolation "bon nombre de buts" : uniquement si 0 pts sur tout (qualifié + contexte + score)
  if (qualifierPts === 0 && contextPts === 0 && scorePts === 0 && isGoodTotal) {
    tier = "total_goals";
    scorePts = 1;
  }

  return {
    total: qualifierPts + contextPts + scorePts,
    qualifierPts,
    contextPts,
    scorePts,
    tier,
  };
}
