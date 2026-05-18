"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "maxime@copratik.fr";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Unauthorized");
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export async function updateMatchScore(
  matchId: string,
  homeScore: number | null,
  awayScore: number | null
) {
  await assertAdmin();
  const supabase = serviceClient();
  await supabase
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore })
    .eq("id", matchId);
  revalidatePath("/dashboard", "layout");
}

export async function setTournamentWinner(teamName: string | null) {
  await assertAdmin();
  const supabase = serviceClient();
  await supabase
    .from("app_config")
    .upsert({ key: "tournament_winner", value: teamName }, { onConflict: "key" });
  revalidatePath("/dashboard", "layout");
}
