import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// French team name → flag emoji
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
  "Mexico": "Mexique",
  "South Africa": "Afrique du Sud",
  "South Korea": "Corée du Sud",
  "Korea Republic": "Corée du Sud",
  "Republic of Korea": "Corée du Sud",
  "Czech Republic": "Tchéquie",
  "Czechia": "Tchéquie",
  "Bosnia and Herzegovina": "Bosnie-Herzégovine",
  "Bosnia-Herzegovina": "Bosnie-Herzégovine",
  "Netherlands": "Pays-Bas",
  "Germany": "Allemagne",
  "England": "Angleterre",
  "Austria": "Autriche",
  "Belgium": "Belgique",
  "Croatia": "Croatie",
  "Spain": "Espagne",
  "France": "France",
  "Norway": "Norvège",
  "Portugal": "Portugal",
  "Sweden": "Suède",
  "Switzerland": "Suisse",
  "Scotland": "Écosse",
  "Turkey": "Turquie",
  "Türkiye": "Turquie",
  "Argentina": "Argentine",
  "Brazil": "Brésil",
  "Colombia": "Colombie",
  "Ecuador": "Équateur",
  "Paraguay": "Paraguay",
  "Uruguay": "Uruguay",
  "Algeria": "Algérie",
  "Cape Verde": "Cap-Vert", "Cape Verde Islands": "Cap-Vert",
  "Ivory Coast": "Côte d'Ivoire",
  "Côte d'Ivoire": "Côte d'Ivoire",
  "Egypt": "Égypte",
  "Ghana": "Ghana",
  "Morocco": "Maroc",
  "DR Congo": "RD Congo",
  "Democratic Republic of Congo": "RD Congo",
  "Congo DR": "RD Congo",
  "Senegal": "Sénégal",
  "Tunisia": "Tunisie",
  "Saudi Arabia": "Arabie Saoudite",
  "Australia": "Australie",
  "Iran": "Iran",
  "Iraq": "Irak",
  "Japan": "Japon",
  "Jordan": "Jordanie",
  "Qatar": "Qatar",
  "Uzbekistan": "Ouzbékistan",
  "Canada": "Canada",
  "Curaçao": "Curaçao",
  "USA": "États-Unis",
  "United States": "États-Unis",
  "Haiti": "Haïti",
  "Haïti": "Haïti",
  "Panama": "Panama",
  "New Zealand": "Nouvelle-Zélande",
};

function normalizeName(name: string): string {
  // Remove diacritics (combining marks U+0300–U+036F) after NFD decomposition
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export async function GET(req: NextRequest) {
  // Protect with secret so only cron-job.org can trigger it
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.RESULTS_REFRESH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FOOTBALL_API_KEY not set" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Fetch all WC 2026 matches (finished + in play)
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `API error ${res.status}`, detail: text }, { status: 502 });
  }

  const { matches } = await res.json() as {
    matches: {
      utcDate: string;
      status: string;
      stage: string;
      homeTeam: { name: string };
      awayTeam: { name: string };
      score: {
        winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
        duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | null;
        fullTime: { home: number | null; away: number | null };
        extraTime: { home: number | null; away: number | null } | null;
        penalties: { home: number | null; away: number | null } | null;
      };
    }[]
  };

  let updated = 0;
  let skipped = 0;

  for (const m of matches) {
    if (m.status !== "FINISHED") continue;
    const { home, away } = m.score.fullTime;
    if (home === null || away === null) continue;

    const homeFr = TEAM_MAP[m.homeTeam.name];
    const awayFr = TEAM_MAP[m.awayTeam.name];

    if (!homeFr || !awayFr) {
      console.warn(`Unknown team mapping: "${m.homeTeam.name}" or "${m.awayTeam.name}"`);
      skipped++;
      continue;
    }

    const isKO = m.stage !== "GROUP_STAGE";

    // For group stage: home_score = fullTime (= 90-min final)
    const fields: Record<string, unknown> = { home_score: home, away_score: away };

    if (isKO) {
      if (m.score.winner === "HOME_TEAM") fields.winner_team = homeFr;
      else if (m.score.winner === "AWAY_TEAM") fields.winner_team = awayFr;

      if (m.score.duration === "REGULAR") {
        fields.match_end_type = "90min";
      } else if (m.score.duration === "EXTRA_TIME") {
        fields.match_end_type = "aet";
        // home_score = fullTime = 120-min cumulative (already set above)
        // extra_time_home_score stores the ET contribution (for reference)
        fields.extra_time_home_score = m.score.extraTime?.home ?? null;
        fields.extra_time_away_score = m.score.extraTime?.away ?? null;
      } else if (m.score.duration === "PENALTY_SHOOTOUT") {
        fields.match_end_type = "pens";
        const penH = m.score.penalties?.home ?? 0;
        const penA = m.score.penalties?.away ?? 0;
        const etH = m.score.extraTime?.home ?? 0;
        const etA = m.score.extraTime?.away ?? 0;
        // home_score = 90-min (= 120-min play score, since pens don't extend play)
        fields.home_score = home - etH - penH;
        fields.away_score = away - etA - penA;
        // extra_time stores penalty goals for TAB display
        fields.extra_time_home_score = penH;
        fields.extra_time_away_score = penA;
      }
    }

    // Group matches: skip if already set. KO matches: always upsert (winner_team may be missing).
    const query = supabase.from("matches").update(fields).eq("home_team", homeFr).eq("away_team", awayFr);
    const { error } = await (isKO ? query : query.is("home_score", null));

    if (!error) updated++;
  }

  // Sync player goal tallies — auto-insert unknown scorers
  let playersUpdated = 0;
  let newPlayersInserted = 0;
  try {
    const scorersRes = await fetch(
      "https://api.football-data.org/v4/competitions/WC/scorers?limit=200",
      { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
    );
    if (scorersRes.ok) {
      const { scorers } = await scorersRes.json() as {
        scorers: { player: { name: string }; team: { name: string }; goals: number }[];
      };
      const { data: dbPlayers } = await supabase.from("players").select("id, name");
      for (const apiScorer of scorers) {
        if (!apiScorer.goals) continue;
        const normalizedApi = normalizeName(apiScorer.player.name);
        const dbMatch = (dbPlayers ?? []).find(p => {
          const normalizedDb = normalizeName(p.name);
          return normalizedApi.includes(normalizedDb) || normalizedDb.includes(normalizedApi);
        });
        if (dbMatch) {
          const { error } = await supabase
            .from("players")
            .update({ goals: apiScorer.goals })
            .eq("id", dbMatch.id);
          if (!error) playersUpdated++;
        } else {
          const teamFr = TEAM_MAP[apiScorer.team.name];
          const teamFlag = teamFr ? FLAG_MAP[teamFr] : undefined;
          if (!teamFr || !teamFlag) continue;
          const { error } = await supabase
            .from("players")
            .insert({ name: apiScorer.player.name, team: teamFr, team_flag: teamFlag, position: "Attaquant", goals: apiScorer.goals });
          if (!error) newPlayersInserted++;
        }
      }
    }
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true, updated, skipped, total: matches.length, playersUpdated, newPlayersInserted });
}
