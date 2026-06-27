import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// French team name → flag emoji (mirrors teams-list.ts)
const FLAG_MAP: Record<string, string> = {
  "Allemagne": "🇩🇪", "Angleterre": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Autriche": "🇦🇹", "Belgique": "🇧🇪",
  "Bosnie-Herzégovine": "🇧🇦", "Croatie": "🇭🇷", "Espagne": "🇪🇸", "France": "🇫🇷",
  "Norvège": "🇳🇴", "Pays-Bas": "🇳🇱", "Portugal": "🇵🇹", "Suède": "🇸🇪",
  "Suisse": "🇨🇭", "Tchéquie": "🇨🇿", "Turquie": "🇹🇷", "Écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Argentine": "🇦🇷", "Brésil": "🇧🇷", "Colombie": "🇨🇴", "Équateur": "🇪🇨",
  "Paraguay": "🇵🇾", "Uruguay": "🇺🇾",
  "Afrique du Sud": "🇿🇦", "Algérie": "🇩🇿", "Cap-Vert": "🇨🇻", "Côte d'Ivoire": "🇨🇮",
  "Égypte": "🇪🇬", "Ghana": "🇬🇭", "Maroc": "🇲🇦", "RD Congo": "🇨🇩",
  "Sénégal": "🇸🇳", "Tunisie": "🇹🇳",
  "Arabie Saoudite": "🇸🇦", "Australie": "🇦🇺", "Corée du Sud": "🇰🇷",
  "Iran": "🇮🇷", "Irak": "🇮🇶", "Japon": "🇯🇵", "Jordanie": "🇯🇴",
  "Qatar": "🇶🇦", "Ouzbékistan": "🇺🇿",
  "Canada": "🇨🇦", "Curaçao": "🇨🇼", "États-Unis": "🇺🇸",
  "Haïti": "🇭🇹", "Mexique": "🇲🇽", "Panama": "🇵🇦", "Nouvelle-Zélande": "🇳🇿",
};

// English name (football-data.org) → French name (our DB)
const TEAM_MAP: Record<string, string> = {
  "Mexico": "Mexique", "South Africa": "Afrique du Sud",
  "South Korea": "Corée du Sud", "Korea Republic": "Corée du Sud", "Republic of Korea": "Corée du Sud",
  "Czech Republic": "Tchéquie", "Czechia": "Tchéquie",
  "Bosnia and Herzegovina": "Bosnie-Herzégovine", "Bosnia-Herzegovina": "Bosnie-Herzégovine",
  "Netherlands": "Pays-Bas", "Germany": "Allemagne", "England": "Angleterre",
  "Austria": "Autriche", "Belgium": "Belgique", "Croatia": "Croatie",
  "Spain": "Espagne", "France": "France", "Norway": "Norvège",
  "Portugal": "Portugal", "Sweden": "Suède", "Switzerland": "Suisse",
  "Scotland": "Écosse", "Turkey": "Turquie", "Türkiye": "Turquie",
  "Argentina": "Argentine", "Brazil": "Brésil", "Colombia": "Colombie",
  "Ecuador": "Équateur", "Paraguay": "Paraguay", "Uruguay": "Uruguay",
  "Algeria": "Algérie", "Cape Verde": "Cap-Vert", "Cape Verde Islands": "Cap-Vert",
  "Ivory Coast": "Côte d'Ivoire", "Côte d'Ivoire": "Côte d'Ivoire",
  "Egypt": "Égypte", "Ghana": "Ghana", "Morocco": "Maroc",
  "DR Congo": "RD Congo", "Democratic Republic of Congo": "RD Congo", "Congo DR": "RD Congo",
  "Senegal": "Sénégal", "Tunisia": "Tunisie",
  "Saudi Arabia": "Arabie Saoudite", "Australia": "Australie",
  "Iran": "Iran", "Iraq": "Irak", "Japan": "Japon",
  "Jordan": "Jordanie", "Qatar": "Qatar", "Uzbekistan": "Ouzbékistan",
  "Canada": "Canada", "Curaçao": "Curaçao", "Curacao": "Curaçao",
  "USA": "États-Unis", "United States": "États-Unis",
  "Haiti": "Haïti", "Haïti": "Haïti", "Panama": "Panama",
  "New Zealand": "Nouvelle-Zélande",
};

function normalizeName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Called by Vercel cron — Vercel auto-sends VERCEL_CRON_SECRET as Bearer token
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET ?? process.env.RESULTS_REFRESH_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "FOOTBALL_API_KEY not set" }, { status: 500 });

  const supabase = createAdminClient();

  // ── Scores ─────────────────────────────────────────────────────────────────
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `API error ${res.status}`, detail: text }, { status: 502 });
  }

  const { matches } = await res.json() as {
    matches: {
      homeTeam: { name: string };
      awayTeam: { name: string };
      score: {
        winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
        fullTime: { home: number | null; away: number | null };
        extraTime: { home: number | null; away: number | null } | null;
        penalties: { home: number | null; away: number | null } | null;
      };
    }[]
  };

  let updated = 0;
  let skipped = 0;

  for (const m of matches) {
    const { home, away } = m.score.fullTime;
    if (home === null || away === null) continue;

    const homeFr = TEAM_MAP[m.homeTeam.name];
    const awayFr = TEAM_MAP[m.awayTeam.name];

    if (!homeFr || !awayFr) { skipped++; continue; }

    // Knockout: determine match_end_type, extra_time scores, winner_team
    let matchEndType: "90min" | "aet" | "pens" | null = null;
    let extraTimeHome: number | null = null;
    let extraTimeAway: number | null = null;
    let winnerTeam: string | null = null;

    if (m.score.penalties) {
      matchEndType = "pens";
      extraTimeHome = m.score.extraTime?.home ?? home;
      extraTimeAway = m.score.extraTime?.away ?? away;
    } else if (m.score.extraTime) {
      matchEndType = "aet";
      extraTimeHome = m.score.extraTime.home;
      extraTimeAway = m.score.extraTime.away;
    } else if (m.score.winner && m.score.winner !== "DRAW") {
      matchEndType = "90min";
    }

    if (m.score.winner === "HOME_TEAM") winnerTeam = homeFr;
    else if (m.score.winner === "AWAY_TEAM") winnerTeam = awayFr;

    const updatePayload: Record<string, unknown> = {
      home_score: home,
      away_score: away,
    };
    if (matchEndType) {
      updatePayload.match_end_type = matchEndType;
      updatePayload.winner_team = winnerTeam;
      updatePayload.extra_time_home_score = extraTimeHome;
      updatePayload.extra_time_away_score = extraTimeAway;
    }

    const { error } = await supabase
      .from("matches")
      .update(updatePayload)
      .eq("home_team", homeFr)
      .eq("away_team", awayFr);

    if (!error) updated++;
  }

  // ── Buteurs ────────────────────────────────────────────────────────────────
  let playersUpdated = 0;
  let newPlayersInserted = 0;
  let topScorerId: string | null = null;
  let topGoals = 0;

  try {
    const scorersRes = await fetch(
      "https://api.football-data.org/v4/competitions/WC/scorers?limit=200",
      { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
    );
    if (scorersRes.ok) {
      const { scorers } = await scorersRes.json() as {
        scorers: { player: { name: string }; team: { name: string }; goals: number }[]
      };
      const { data: dbPlayers } = await supabase.from("players").select("id, name");

      // Iterate API scorers (not DB players) so no scorer is ever missed
      for (const apiScorer of scorers) {
        if (!apiScorer.goals) continue;
        const normalizedApi = normalizeName(apiScorer.player.name);
        const dbMatch = (dbPlayers ?? []).find(p => {
          const normalizedDb = normalizeName(p.name);
          return normalizedApi.includes(normalizedDb) || normalizedDb.includes(normalizedApi);
        });

        let matchedId: string | null = null;

        if (dbMatch) {
          // Known player — update goal count
          const { error } = await supabase
            .from("players")
            .update({ goals: apiScorer.goals })
            .eq("id", dbMatch.id);
          if (!error) { playersUpdated++; matchedId = dbMatch.id; }
        } else {
          // Unknown scorer — auto-insert so they appear in the leaderboard
          const teamFr = TEAM_MAP[apiScorer.team.name];
          const teamFlag = teamFr ? FLAG_MAP[teamFr] : undefined;
          if (!teamFr || !teamFlag) continue;
          const { data: ins, error } = await supabase
            .from("players")
            .insert({ name: apiScorer.player.name, team: teamFr, team_flag: teamFlag, position: "Attaquant", goals: apiScorer.goals })
            .select("id")
            .single();
          if (!error && ins) { newPlayersInserted++; matchedId = ins.id; }
        }

        if (matchedId && apiScorer.goals > topGoals) {
          topGoals = apiScorer.goals;
          topScorerId = matchedId;
        }
      }

      // Auto-detect golden boot leader — mark current leader, clear others
      if (topScorerId && topGoals > 0) {
        await supabase.from("players").update({ won_golden_boot: false }).neq("id", topScorerId);
        await supabase.from("players").update({ won_golden_boot: true }).eq("id", topScorerId);
      }
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, updated, skipped, total: matches.length, playersUpdated, newPlayersInserted, topScorerId, topGoals });
}
