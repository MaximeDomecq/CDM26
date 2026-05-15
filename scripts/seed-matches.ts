/**
 * Run with: npx tsx scripts/seed-matches.ts
 * Seeds all 48 World Cup 2026 group stage matches into Supabase.
 * Requires .env.local to be configured.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const matches = [
  // Group A
  { home_team: "Mexique", away_team: "Équateur", kickoff_at: "2026-06-11T23:00:00Z", phase: "Groupe A", api_id: 10001 },
  { home_team: "États-Unis", away_team: "Panama", kickoff_at: "2026-06-12T02:00:00Z", phase: "Groupe A", api_id: 10002 },
  { home_team: "États-Unis", away_team: "Mexique", kickoff_at: "2026-06-19T02:00:00Z", phase: "Groupe A", api_id: 10003 },
  { home_team: "Panama", away_team: "Équateur", kickoff_at: "2026-06-19T23:00:00Z", phase: "Groupe A", api_id: 10004 },
  { home_team: "Panama", away_team: "Mexique", kickoff_at: "2026-06-25T22:00:00Z", phase: "Groupe A", api_id: 10005 },
  { home_team: "Équateur", away_team: "États-Unis", kickoff_at: "2026-06-25T22:00:00Z", phase: "Groupe A", api_id: 10006 },
  // Group B
  { home_team: "Argentine", away_team: "Pérou", kickoff_at: "2026-06-12T20:00:00Z", phase: "Groupe B", api_id: 10007 },
  { home_team: "Canada", away_team: "Chili", kickoff_at: "2026-06-12T23:00:00Z", phase: "Groupe B", api_id: 10008 },
  { home_team: "Argentine", away_team: "Canada", kickoff_at: "2026-06-20T02:00:00Z", phase: "Groupe B", api_id: 10009 },
  { home_team: "Chili", away_team: "Pérou", kickoff_at: "2026-06-20T02:00:00Z", phase: "Groupe B", api_id: 10010 },
  { home_team: "Argentine", away_team: "Chili", kickoff_at: "2026-06-26T22:00:00Z", phase: "Groupe B", api_id: 10011 },
  { home_team: "Pérou", away_team: "Canada", kickoff_at: "2026-06-26T22:00:00Z", phase: "Groupe B", api_id: 10012 },
  // Group C
  { home_team: "Mexique", away_team: "Sénégal", kickoff_at: "2026-06-13T02:00:00Z", phase: "Groupe C", api_id: 10013 },
  { home_team: "Pays-Bas", away_team: "Côte d'Ivoire", kickoff_at: "2026-06-13T20:00:00Z", phase: "Groupe C", api_id: 10014 },
  { home_team: "Pays-Bas", away_team: "Mexique", kickoff_at: "2026-06-20T23:00:00Z", phase: "Groupe C", api_id: 10015 },
  { home_team: "Côte d'Ivoire", away_team: "Sénégal", kickoff_at: "2026-06-21T02:00:00Z", phase: "Groupe C", api_id: 10016 },
  { home_team: "Côte d'Ivoire", away_team: "Mexique", kickoff_at: "2026-06-27T22:00:00Z", phase: "Groupe C", api_id: 10017 },
  { home_team: "Sénégal", away_team: "Pays-Bas", kickoff_at: "2026-06-27T22:00:00Z", phase: "Groupe C", api_id: 10018 },
  // Group D
  { home_team: "Brésil", away_team: "Allemagne", kickoff_at: "2026-06-14T02:00:00Z", phase: "Groupe D", api_id: 10019 },
  { home_team: "Japon", away_team: "Croatie", kickoff_at: "2026-06-13T23:00:00Z", phase: "Groupe D", api_id: 10020 },
  { home_team: "Brésil", away_team: "Japon", kickoff_at: "2026-06-21T20:00:00Z", phase: "Groupe D", api_id: 10021 },
  { home_team: "Croatie", away_team: "Allemagne", kickoff_at: "2026-06-21T23:00:00Z", phase: "Groupe D", api_id: 10022 },
  { home_team: "Brésil", away_team: "Croatie", kickoff_at: "2026-06-28T22:00:00Z", phase: "Groupe D", api_id: 10023 },
  { home_team: "Allemagne", away_team: "Japon", kickoff_at: "2026-06-28T22:00:00Z", phase: "Groupe D", api_id: 10024 },
  // Group E
  { home_team: "Espagne", away_team: "Maroc", kickoff_at: "2026-06-14T20:00:00Z", phase: "Groupe E", api_id: 10025 },
  { home_team: "Belgique", away_team: "Serbie", kickoff_at: "2026-06-15T02:00:00Z", phase: "Groupe E", api_id: 10026 },
  { home_team: "Espagne", away_team: "Belgique", kickoff_at: "2026-06-22T02:00:00Z", phase: "Groupe E", api_id: 10027 },
  { home_team: "Maroc", away_team: "Serbie", kickoff_at: "2026-06-22T20:00:00Z", phase: "Groupe E", api_id: 10028 },
  { home_team: "Espagne", away_team: "Serbie", kickoff_at: "2026-06-29T22:00:00Z", phase: "Groupe E", api_id: 10029 },
  { home_team: "Maroc", away_team: "Belgique", kickoff_at: "2026-06-29T22:00:00Z", phase: "Groupe E", api_id: 10030 },
  // Group F
  { home_team: "France", away_team: "Arabie Saoudite", kickoff_at: "2026-06-15T20:00:00Z", phase: "Groupe F", api_id: 10031 },
  { home_team: "Danemark", away_team: "Tunisie", kickoff_at: "2026-06-15T23:00:00Z", phase: "Groupe F", api_id: 10032 },
  { home_team: "France", away_team: "Danemark", kickoff_at: "2026-06-22T23:00:00Z", phase: "Groupe F", api_id: 10033 },
  { home_team: "Tunisie", away_team: "Arabie Saoudite", kickoff_at: "2026-06-23T02:00:00Z", phase: "Groupe F", api_id: 10034 },
  { home_team: "France", away_team: "Tunisie", kickoff_at: "2026-06-30T22:00:00Z", phase: "Groupe F", api_id: 10035 },
  { home_team: "Arabie Saoudite", away_team: "Danemark", kickoff_at: "2026-06-30T22:00:00Z", phase: "Groupe F", api_id: 10036 },
  // Group G
  { home_team: "Portugal", away_team: "Cameroun", kickoff_at: "2026-06-16T02:00:00Z", phase: "Groupe G", api_id: 10037 },
  { home_team: "Angola", away_team: "Indonésie", kickoff_at: "2026-06-16T20:00:00Z", phase: "Groupe G", api_id: 10038 },
  { home_team: "Portugal", away_team: "Angola", kickoff_at: "2026-06-23T20:00:00Z", phase: "Groupe G", api_id: 10039 },
  { home_team: "Indonésie", away_team: "Cameroun", kickoff_at: "2026-06-23T23:00:00Z", phase: "Groupe G", api_id: 10040 },
  { home_team: "Portugal", away_team: "Indonésie", kickoff_at: "2026-07-01T22:00:00Z", phase: "Groupe G", api_id: 10041 },
  { home_team: "Cameroun", away_team: "Angola", kickoff_at: "2026-07-01T22:00:00Z", phase: "Groupe G", api_id: 10042 },
  // Group H
  { home_team: "Angleterre", away_team: "Nigéria", kickoff_at: "2026-06-17T02:00:00Z", phase: "Groupe H", api_id: 10043 },
  { home_team: "Australie", away_team: "Irak", kickoff_at: "2026-06-17T20:00:00Z", phase: "Groupe H", api_id: 10044 },
  { home_team: "Angleterre", away_team: "Australie", kickoff_at: "2026-06-24T02:00:00Z", phase: "Groupe H", api_id: 10045 },
  { home_team: "Irak", away_team: "Nigéria", kickoff_at: "2026-06-24T20:00:00Z", phase: "Groupe H", api_id: 10046 },
  { home_team: "Angleterre", away_team: "Irak", kickoff_at: "2026-07-02T22:00:00Z", phase: "Groupe H", api_id: 10047 },
  { home_team: "Nigéria", away_team: "Australie", kickoff_at: "2026-07-02T22:00:00Z", phase: "Groupe H", api_id: 10048 },
  // Group I
  { home_team: "Italie", away_team: "Nouvelle-Zélande", kickoff_at: "2026-06-17T23:00:00Z", phase: "Groupe I", api_id: 10049 },
  { home_team: "Colombie", away_team: "Slovaquie", kickoff_at: "2026-06-18T02:00:00Z", phase: "Groupe I", api_id: 10050 },
  { home_team: "Italie", away_team: "Colombie", kickoff_at: "2026-06-24T23:00:00Z", phase: "Groupe I", api_id: 10051 },
  { home_team: "Slovaquie", away_team: "Nouvelle-Zélande", kickoff_at: "2026-06-25T02:00:00Z", phase: "Groupe I", api_id: 10052 },
  { home_team: "Italie", away_team: "Slovaquie", kickoff_at: "2026-07-03T22:00:00Z", phase: "Groupe I", api_id: 10053 },
  { home_team: "Nouvelle-Zélande", away_team: "Colombie", kickoff_at: "2026-07-03T22:00:00Z", phase: "Groupe I", api_id: 10054 },
  // Group J
  { home_team: "Uruguay", away_team: "Afrique du Sud", kickoff_at: "2026-06-18T20:00:00Z", phase: "Groupe J", api_id: 10055 },
  { home_team: "Chine", away_team: "Thaïlande", kickoff_at: "2026-06-18T23:00:00Z", phase: "Groupe J", api_id: 10056 },
  { home_team: "Uruguay", away_team: "Chine", kickoff_at: "2026-06-25T20:00:00Z", phase: "Groupe J", api_id: 10057 },
  { home_team: "Thaïlande", away_team: "Afrique du Sud", kickoff_at: "2026-06-26T02:00:00Z", phase: "Groupe J", api_id: 10058 },
  { home_team: "Uruguay", away_team: "Thaïlande", kickoff_at: "2026-07-04T22:00:00Z", phase: "Groupe J", api_id: 10059 },
  { home_team: "Afrique du Sud", away_team: "Chine", kickoff_at: "2026-07-04T22:00:00Z", phase: "Groupe J", api_id: 10060 },
  // Group K
  { home_team: "Corée du Sud", away_team: "Venezuela", kickoff_at: "2026-06-19T20:00:00Z", phase: "Groupe K", api_id: 10061 },
  { home_team: "Ghana", away_team: "Iran", kickoff_at: "2026-06-20T20:00:00Z", phase: "Groupe K", api_id: 10062 },
  { home_team: "Corée du Sud", away_team: "Ghana", kickoff_at: "2026-06-26T20:00:00Z", phase: "Groupe K", api_id: 10063 },
  { home_team: "Iran", away_team: "Venezuela", kickoff_at: "2026-06-27T02:00:00Z", phase: "Groupe K", api_id: 10064 },
  { home_team: "Corée du Sud", away_team: "Iran", kickoff_at: "2026-07-05T22:00:00Z", phase: "Groupe K", api_id: 10065 },
  { home_team: "Venezuela", away_team: "Ghana", kickoff_at: "2026-07-05T22:00:00Z", phase: "Groupe K", api_id: 10066 },
  // Group L
  { home_team: "Suisse", away_team: "Cameroun", kickoff_at: "2026-06-19T23:00:00Z", phase: "Groupe L", api_id: 10067 },
  { home_team: "Nigéria", away_team: "Mexique", kickoff_at: "2026-06-20T23:00:00Z", phase: "Groupe L", api_id: 10068 },
  { home_team: "Suisse", away_team: "Nigéria", kickoff_at: "2026-06-27T20:00:00Z", phase: "Groupe L", api_id: 10069 },
  { home_team: "Mexique", away_team: "Cameroun", kickoff_at: "2026-06-28T02:00:00Z", phase: "Groupe L", api_id: 10070 },
  { home_team: "Suisse", away_team: "Mexique", kickoff_at: "2026-07-06T22:00:00Z", phase: "Groupe L", api_id: 10071 },
  { home_team: "Cameroun", away_team: "Nigéria", kickoff_at: "2026-07-06T22:00:00Z", phase: "Groupe L", api_id: 10072 },
];

async function seed() {
  console.log(`Seeding ${matches.length} matches...`);
  const { data, error } = await supabase
    .from("matches")
    .upsert(matches, { onConflict: "api_id" });

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("Done! Matches seeded successfully.");
}

seed();
