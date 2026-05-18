import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  "Cape Verde": "Cap-Vert",
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
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .trim();
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
      homeTeam: { name: string };
      awayTeam: { name: string };
      score: { fullTime: { home: number | null; away: number | null } };
    }[]
  };

  let updated = 0;
  let skipped = 0;

  for (const m of matches) {
    // Only update finished matches with real scores
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

    const { error } = await supabase
      .from("matches")
      .update({ home_score: home, away_score: away })
      .eq("home_team", homeFr)
      .eq("away_team", awayFr)
      .is("home_score", null); // only update if not already set (avoid redundant writes)

    if (!error) updated++;
  }

  // Sync player goal tallies from scorers endpoint
  let playersUpdated = 0;
  try {
    const scorersRes = await fetch(
      "https://api.football-data.org/v4/competitions/WC/scorers?limit=200",
      { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
    );
    if (scorersRes.ok) {
      const { scorers } = await scorersRes.json() as {
        scorers: { player: { name: string }; goals: number }[];
      };
      const { data: dbPlayers } = await supabase.from("players").select("id, name");
      for (const dbPlayer of dbPlayers ?? []) {
        const normalizedDb = normalizeName(dbPlayer.name);
        const apiScorer = scorers.find((s) => {
          const normalizedApi = normalizeName(s.player.name);
          return normalizedApi.includes(normalizedDb) || normalizedDb.includes(normalizedApi);
        });
        if (apiScorer !== undefined) {
          const { error } = await supabase
            .from("players")
            .update({ goals: apiScorer.goals })
            .eq("id", dbPlayer.id);
          if (!error) playersUpdated++;
        }
      }
    }
  } catch {
    // non-fatal: scorers sync failure doesn't block match sync response
  }

  return NextResponse.json({ ok: true, updated, skipped, total: matches.length, playersUpdated });
}
