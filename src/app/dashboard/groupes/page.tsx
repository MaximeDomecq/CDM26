import { createClient } from "@/lib/supabase/server";
import GroupsAndBracket from "@/components/GroupsAndBracket";

export const revalidate = 0;

export default async function GroupesPage() {
  const supabase = await createClient();

  const [{ data: groupMatches }, { data: knockoutMatches }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, home_team, away_team, phase, home_score, away_score, kickoff_at")
      .like("phase", "Groupe %")
      .order("kickoff_at"),
    supabase
      .from("matches")
      .select("id, home_team, away_team, kickoff_at, phase, home_score, away_score")
      .not("phase", "like", "Groupe %")
      .order("kickoff_at"),
  ]);

  const withResult = (groupMatches ?? []).filter((m) => m.home_score !== null);
  const total = groupMatches?.length ?? 72;
  const pctComplete = total > 0 ? Math.round((withResult.length / total) * 100) : 0;

  return (
    <GroupsAndBracket
      groupMatches={groupMatches ?? []}
      knockoutMatches={knockoutMatches ?? []}
      pctComplete={pctComplete}
    />
  );
}
