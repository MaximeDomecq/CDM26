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
