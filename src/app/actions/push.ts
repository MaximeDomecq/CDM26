"use server";

import { createClient } from "@supabase/supabase-js";
import { sendPushToUsers } from "@/lib/push";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export async function notifyLeagueChatMessage(
  leagueId: string,
  senderUserId: string,
  senderName: string,
  message: string
) {
  try {
    const db = service();
    const [{ data: members }, { data: league }] = await Promise.all([
      db.from("league_members").select("user_id").eq("league_id", leagueId).neq("user_id", senderUserId),
      db.from("leagues").select("name").eq("id", leagueId).single(),
    ]);
    if (!members || members.length === 0) return;
    const userIds = members.map((m) => m.user_id as string);
    await sendPushToUsers(userIds, {
      title: `💬 ${league?.name ?? "Ligue"}`,
      body: `${senderName} : ${message.slice(0, 120)}`,
      url: `/dashboard/leagues/${leagueId}`,
    });
  } catch {
    // Never block the chat UX on notification errors
  }
}

export async function notifyLeagueJoin(
  leagueId: string,
  newMemberUserId: string
) {
  try {
    const db = service();
    const [{ data: members }, { data: league }, { data: profile }] = await Promise.all([
      db.from("league_members").select("user_id").eq("league_id", leagueId).neq("user_id", newMemberUserId),
      db.from("leagues").select("name").eq("id", leagueId).single(),
      db.from("profiles").select("display_name").eq("id", newMemberUserId).single(),
    ]);
    if (!members || members.length === 0) return;
    const userIds = members.map((m) => m.user_id as string);
    const joinerName = (profile as { display_name: string } | null)?.display_name ?? "Un joueur";
    await sendPushToUsers(userIds, {
      title: `🎉 ${league?.name ?? "Ligue"}`,
      body: `${joinerName} a rejoint la ligue !`,
      url: `/dashboard/leagues/${leagueId}`,
    });
  } catch {
    // Never block the join flow on notification errors
  }
}
