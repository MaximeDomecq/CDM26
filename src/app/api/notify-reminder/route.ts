import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push";
import { parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.RESULTS_REFRESH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);   todayEnd.setHours(23, 59, 59, 999);

  // First match of today
  const { data: todayMatches } = await service
    .from("matches")
    .select("home_team, away_team, kickoff_at")
    .gte("kickoff_at", todayStart.toISOString())
    .lte("kickoff_at", todayEnd.toISOString())
    .order("kickoff_at")
    .limit(1);

  if (!todayMatches || todayMatches.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "No matches today" });
  }

  const firstMatch = todayMatches[0];
  const kickoff = parseISO(firstMatch.kickoff_at);
  const diffMin = (kickoff.getTime() - now.getTime()) / 60000;

  // Only send if the first match is in the 55–65 min window (fires once per 5-min cron)
  if (diffMin < 55 || diffMin > 65) {
    return NextResponse.json({ ok: true, sent: false, reason: `First match in ${Math.round(diffMin)} min` });
  }

  await sendPushToAll({
    title: "⏰ Premier match dans 1h !",
    body: `${firstMatch.home_team} vs ${firstMatch.away_team} à ${format(kickoff, "HH:mm", { locale: fr })} — Vérifiez vos pronostics !`,
    url: "/dashboard/matches",
  });

  return NextResponse.json({ ok: true, sent: true });
}
