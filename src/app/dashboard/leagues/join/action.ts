"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function joinLeagueAction(
  formData: FormData
): Promise<{ error: string } | never> {
  const code = ((formData.get("code") as string) ?? "").trim().toUpperCase();
  if (!code) return { error: "Entrez un code." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  // Service client bypasses RLS so we can look up leagues by invite_code
  // even when the user isn't yet a member
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: league } = await service
    .from("leagues")
    .select("id")
    .eq("invite_code", code)
    .single();

  if (!league) return { error: "Code invalide. Vérifiez le code et réessayez." };

  // Already a member? Just redirect
  const { data: existing } = await service
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    await service
      .from("league_members")
      .insert({ league_id: league.id, user_id: user.id });
  }

  redirect(`/dashboard/leagues/${league.id}`);
}
