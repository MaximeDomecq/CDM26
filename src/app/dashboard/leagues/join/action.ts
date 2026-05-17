"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function joinLeagueAction(
  formData: FormData
): Promise<{ error: string } | { leagueId: string }> {
  const code = ((formData.get("code") as string) ?? "").trim().toUpperCase();
  if (!code) return { error: "Entrez un code." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return { error: "Configuration serveur manquante." };

  const service = createServiceClient(url, key);

  const { data: league, error: leagueErr } = await service
    .from("leagues")
    .select("id")
    .eq("invite_code", code)
    .single();

  if (leagueErr || !league) return { error: "Code invalide. Vérifiez le code et réessayez." };

  // Already a member — just return the id
  const { data: existing } = await service
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    const { error: insertErr } = await service
      .from("league_members")
      .insert({ league_id: league.id, user_id: user.id });

    if (insertErr) return { error: `Erreur d'inscription : ${insertErr.message}` };
  }

  return { leagueId: league.id };
}
