import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Called by a Vercel cron job every 5 minutes during the tournament
// Secured with a shared secret in the Authorization header
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.RESULTS_REFRESH_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  // football-data.org: competition 2000 = FIFA World Cup
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/2000/matches?status=FINISHED",
    { headers: { "X-Auth-Token": apiKey } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Football API error" }, { status: 502 });
  }

  const json = await res.json();
  const apiMatches: {
    id: number;
    utcDate: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
    score: { fullTime: { home: number | null; away: number | null } };
  }[] = json.matches ?? [];

  const supabase = await createClient();

  let updated = 0;
  for (const m of apiMatches) {
    const homeScore = m.score.fullTime.home;
    const awayScore = m.score.fullTime.away;
    if (homeScore === null || awayScore === null) continue;

    const { error } = await supabase
      .from("matches")
      .update({ home_score: homeScore, away_score: awayScore })
      .eq("api_id", m.id);

    if (!error) updated++;
  }

  return NextResponse.json({ updated });
}
