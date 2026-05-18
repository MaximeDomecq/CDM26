import { createClient } from "@/lib/supabase/server";
import ProfileSettings from "./ProfileSettings";

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, favorite_team, favorite_team_flag, predicted_winner, predicted_winner_flag, predicted_top_scorer_id")
    .eq("id", user!.id)
    .single();

  let topScorerName: string | null = null;
  let topScorerFlag: string | null = null;
  const topScorerId = (profile as { predicted_top_scorer_id?: string | null } | null)?.predicted_top_scorer_id;
  if (topScorerId) {
    const { data: player } = await supabase.from("players").select("name, team_flag").eq("id", topScorerId).single();
    if (player) { topScorerName = player.name; topScorerFlag = player.team_flag; }
  }

  return (
    <ProfileSettings
      displayName={profile?.display_name ?? user!.email ?? "Joueur"}
      favoriteTeam={(profile as { favorite_team?: string | null } | null)?.favorite_team ?? null}
      favoriteTeamFlag={(profile as { favorite_team_flag?: string | null } | null)?.favorite_team_flag ?? null}
      predictedWinner={(profile as { predicted_winner?: string | null } | null)?.predicted_winner ?? null}
      predictedWinnerFlag={(profile as { predicted_winner_flag?: string | null } | null)?.predicted_winner_flag ?? null}
      topScorerName={topScorerName}
      topScorerFlag={topScorerFlag}
    />
  );
}
