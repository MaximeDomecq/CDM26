import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPanel from "./AdminPanel";

export const revalidate = 0;

const ADMIN_EMAIL = "maxime@copratik.fr";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const [{ data: matches }, { data: config }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, home_team, away_team, kickoff_at, phase, home_score, away_score")
      .order("kickoff_at", { ascending: true }),
    supabase.from("app_config").select("key, value"),
  ]);

  const tournamentWinner =
    config?.find((c) => c.key === "tournament_winner")?.value ?? null;

  return (
    <AdminPanel
      matches={matches ?? []}
      tournamentWinner={tournamentWinner}
    />
  );
}
