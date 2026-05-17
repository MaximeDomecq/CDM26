import { createClient } from "@/lib/supabase/server";
import MatchesTabWrapper from "@/components/MatchesTabWrapper";

export const revalidate = 0;

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: matches }, { data: predictions }, { data: profile }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user!.id),
    supabase.from("profiles").select("favorite_team, favorite_team_flag").eq("id", user!.id).single(),
  ]);

  return (
    <MatchesTabWrapper
      matches={matches ?? []}
      predictions={predictions ?? []}
      userId={user!.id}
      favoriteTeam={profile?.favorite_team ?? null}
      favoriteTeamFlag={profile?.favorite_team_flag ?? null}
      calendarMatches={matches ?? []}
    />
  );
}
