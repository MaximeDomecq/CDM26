import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// All times UTC. BST = UTC+1, Paris/CEST = UTC+2.
// Source: Sky Sports confirmed schedule (verified June 2026).
const matches = [
  // ── GROUPE A ── Mexique · Afrique du Sud · Corée du Sud · Tchéquie ──
  { home_team: "Mexique",        away_team: "Afrique du Sud", kickoff_at: "2026-06-11T19:00:00Z", phase: "Groupe A" },
  { home_team: "Corée du Sud",   away_team: "Tchéquie",       kickoff_at: "2026-06-12T02:00:00Z", phase: "Groupe A" },
  { home_team: "Tchéquie",       away_team: "Afrique du Sud", kickoff_at: "2026-06-18T16:00:00Z", phase: "Groupe A" },
  { home_team: "Mexique",        away_team: "Corée du Sud",   kickoff_at: "2026-06-19T01:00:00Z", phase: "Groupe A" },
  { home_team: "Afrique du Sud", away_team: "Corée du Sud",   kickoff_at: "2026-06-25T01:00:00Z", phase: "Groupe A" },
  { home_team: "Tchéquie",       away_team: "Mexique",        kickoff_at: "2026-06-25T01:00:00Z", phase: "Groupe A" },

  // ── GROUPE B ── Canada · Bosnie-Herzégovine · Qatar · Suisse ──
  { home_team: "Canada",              away_team: "Bosnie-Herzégovine", kickoff_at: "2026-06-12T19:00:00Z", phase: "Groupe B" },
  { home_team: "Qatar",               away_team: "Suisse",             kickoff_at: "2026-06-13T19:00:00Z", phase: "Groupe B" },
  { home_team: "Suisse",              away_team: "Bosnie-Herzégovine", kickoff_at: "2026-06-18T19:00:00Z", phase: "Groupe B" },
  { home_team: "Canada",              away_team: "Qatar",              kickoff_at: "2026-06-18T22:00:00Z", phase: "Groupe B" },
  { home_team: "Suisse",              away_team: "Canada",             kickoff_at: "2026-06-24T19:00:00Z", phase: "Groupe B" },
  { home_team: "Bosnie-Herzégovine",  away_team: "Qatar",              kickoff_at: "2026-06-24T19:00:00Z", phase: "Groupe B" },

  // ── GROUPE C ── Écosse · Brésil · Maroc · Haïti ──
  { home_team: "Haïti",   away_team: "Écosse", kickoff_at: "2026-06-14T01:00:00Z", phase: "Groupe C" },
  { home_team: "Brésil",  away_team: "Maroc",  kickoff_at: "2026-06-13T22:00:00Z", phase: "Groupe C" },
  { home_team: "Écosse",  away_team: "Maroc",  kickoff_at: "2026-06-19T22:00:00Z", phase: "Groupe C" },
  { home_team: "Brésil",  away_team: "Haïti",  kickoff_at: "2026-06-20T00:30:00Z", phase: "Groupe C" },
  { home_team: "Maroc",   away_team: "Haïti",  kickoff_at: "2026-06-24T22:00:00Z", phase: "Groupe C" },
  { home_team: "Écosse",  away_team: "Brésil", kickoff_at: "2026-06-24T22:00:00Z", phase: "Groupe C" },

  // ── GROUPE D ── États-Unis · Paraguay · Australie · Turquie ──
  { home_team: "États-Unis", away_team: "Paraguay",  kickoff_at: "2026-06-13T01:00:00Z", phase: "Groupe D" },
  { home_team: "Australie",  away_team: "Turquie",   kickoff_at: "2026-06-14T04:00:00Z", phase: "Groupe D" },
  { home_team: "États-Unis", away_team: "Australie", kickoff_at: "2026-06-19T19:00:00Z", phase: "Groupe D" },
  { home_team: "Turquie",    away_team: "Paraguay",  kickoff_at: "2026-06-20T03:00:00Z", phase: "Groupe D" },
  { home_team: "Turquie",    away_team: "États-Unis", kickoff_at: "2026-06-26T02:00:00Z", phase: "Groupe D" },
  { home_team: "Paraguay",   away_team: "Australie", kickoff_at: "2026-06-26T02:00:00Z", phase: "Groupe D" },

  // ── GROUPE E ── Équateur · Allemagne · Curaçao · Côte d'Ivoire ──
  { home_team: "Côte d'Ivoire", away_team: "Équateur",      kickoff_at: "2026-06-14T23:00:00Z", phase: "Groupe E" },
  { home_team: "Allemagne",     away_team: "Curaçao",        kickoff_at: "2026-06-14T17:00:00Z", phase: "Groupe E" },
  { home_team: "Allemagne",     away_team: "Côte d'Ivoire",  kickoff_at: "2026-06-20T20:00:00Z", phase: "Groupe E" },
  { home_team: "Équateur",      away_team: "Curaçao",        kickoff_at: "2026-06-21T00:00:00Z", phase: "Groupe E" },
  { home_team: "Curaçao",       away_team: "Côte d'Ivoire",  kickoff_at: "2026-06-25T20:00:00Z", phase: "Groupe E" },
  { home_team: "Équateur",      away_team: "Allemagne",      kickoff_at: "2026-06-25T20:00:00Z", phase: "Groupe E" },

  // ── GROUPE F ── Japon · Suède · Tunisie · Pays-Bas ──
  { home_team: "Pays-Bas", away_team: "Japon",   kickoff_at: "2026-06-14T20:00:00Z", phase: "Groupe F" },
  { home_team: "Suède",    away_team: "Tunisie", kickoff_at: "2026-06-15T02:00:00Z", phase: "Groupe F" },
  { home_team: "Pays-Bas", away_team: "Suède",   kickoff_at: "2026-06-20T17:00:00Z", phase: "Groupe F" },
  { home_team: "Tunisie",  away_team: "Japon",   kickoff_at: "2026-06-21T04:00:00Z", phase: "Groupe F" },
  { home_team: "Tunisie",  away_team: "Pays-Bas", kickoff_at: "2026-06-25T23:00:00Z", phase: "Groupe F" },
  { home_team: "Japon",    away_team: "Suède",   kickoff_at: "2026-06-25T23:00:00Z", phase: "Groupe F" },

  // ── GROUPE G ── Belgique · Égypte · Iran · Nouvelle-Zélande ──
  { home_team: "Belgique",          away_team: "Égypte",           kickoff_at: "2026-06-15T19:00:00Z", phase: "Groupe G" },
  { home_team: "Iran",              away_team: "Nouvelle-Zélande", kickoff_at: "2026-06-16T01:00:00Z", phase: "Groupe G" },
  { home_team: "Belgique",          away_team: "Iran",             kickoff_at: "2026-06-21T19:00:00Z", phase: "Groupe G" },
  { home_team: "Nouvelle-Zélande",  away_team: "Égypte",           kickoff_at: "2026-06-22T01:00:00Z", phase: "Groupe G" },
  { home_team: "Nouvelle-Zélande",  away_team: "Belgique",         kickoff_at: "2026-06-27T03:00:00Z", phase: "Groupe G" },
  { home_team: "Égypte",            away_team: "Iran",             kickoff_at: "2026-06-27T03:00:00Z", phase: "Groupe G" },

  // ── GROUPE H ── Espagne · Cap-Vert · Arabie Saoudite · Uruguay ──
  { home_team: "Espagne",        away_team: "Cap-Vert",       kickoff_at: "2026-06-15T16:00:00Z", phase: "Groupe H" },
  { home_team: "Arabie Saoudite", away_team: "Uruguay",       kickoff_at: "2026-06-15T22:00:00Z", phase: "Groupe H" },
  { home_team: "Espagne",        away_team: "Arabie Saoudite", kickoff_at: "2026-06-21T16:00:00Z", phase: "Groupe H" },
  { home_team: "Uruguay",        away_team: "Cap-Vert",       kickoff_at: "2026-06-21T22:00:00Z", phase: "Groupe H" },
  { home_team: "Cap-Vert",       away_team: "Arabie Saoudite", kickoff_at: "2026-06-27T00:00:00Z", phase: "Groupe H" },
  { home_team: "Uruguay",        away_team: "Espagne",        kickoff_at: "2026-06-27T00:00:00Z", phase: "Groupe H" },

  // ── GROUPE I ── France · Sénégal · Irak · Norvège ──
  { home_team: "France",   away_team: "Sénégal", kickoff_at: "2026-06-16T19:00:00Z", phase: "Groupe I" },
  { home_team: "Irak",     away_team: "Norvège", kickoff_at: "2026-06-16T22:00:00Z", phase: "Groupe I" },
  { home_team: "France",   away_team: "Irak",    kickoff_at: "2026-06-22T21:00:00Z", phase: "Groupe I" },
  { home_team: "Norvège",  away_team: "Sénégal", kickoff_at: "2026-06-23T00:00:00Z", phase: "Groupe I" },
  { home_team: "Norvège",  away_team: "France",  kickoff_at: "2026-06-26T19:00:00Z", phase: "Groupe I" },
  { home_team: "Sénégal",  away_team: "Irak",    kickoff_at: "2026-06-26T19:00:00Z", phase: "Groupe I" },

  // ── GROUPE J ── Argentine · Algérie · Autriche · Jordanie ──
  { home_team: "Argentine", away_team: "Algérie",  kickoff_at: "2026-06-17T01:00:00Z", phase: "Groupe J" },
  { home_team: "Autriche",  away_team: "Jordanie", kickoff_at: "2026-06-17T04:00:00Z", phase: "Groupe J" },
  { home_team: "Argentine", away_team: "Autriche", kickoff_at: "2026-06-22T17:00:00Z", phase: "Groupe J" },
  { home_team: "Jordanie",  away_team: "Algérie",  kickoff_at: "2026-06-23T03:00:00Z", phase: "Groupe J" },
  { home_team: "Algérie",   away_team: "Autriche", kickoff_at: "2026-06-28T02:00:00Z", phase: "Groupe J" },
  { home_team: "Jordanie",  away_team: "Argentine", kickoff_at: "2026-06-28T02:00:00Z", phase: "Groupe J" },

  // ── GROUPE K ── Portugal · RD Congo · Ouzbékistan · Colombie ──
  { home_team: "Portugal",    away_team: "RD Congo",    kickoff_at: "2026-06-17T17:00:00Z", phase: "Groupe K" },
  { home_team: "Ouzbékistan", away_team: "Colombie",    kickoff_at: "2026-06-18T02:00:00Z", phase: "Groupe K" },
  { home_team: "Portugal",    away_team: "Ouzbékistan", kickoff_at: "2026-06-23T17:00:00Z", phase: "Groupe K" },
  { home_team: "Colombie",    away_team: "RD Congo",    kickoff_at: "2026-06-24T02:00:00Z", phase: "Groupe K" },
  { home_team: "Colombie",    away_team: "Portugal",    kickoff_at: "2026-06-27T23:30:00Z", phase: "Groupe K" },
  { home_team: "RD Congo",    away_team: "Ouzbékistan", kickoff_at: "2026-06-27T23:30:00Z", phase: "Groupe K" },

  // ── GROUPE L ── Angleterre · Croatie · Ghana · Panama ──
  { home_team: "Angleterre", away_team: "Croatie", kickoff_at: "2026-06-17T20:00:00Z", phase: "Groupe L" },
  { home_team: "Ghana",      away_team: "Panama",  kickoff_at: "2026-06-17T23:00:00Z", phase: "Groupe L" },
  { home_team: "Angleterre", away_team: "Ghana",   kickoff_at: "2026-06-23T20:00:00Z", phase: "Groupe L" },
  { home_team: "Panama",     away_team: "Croatie", kickoff_at: "2026-06-23T23:00:00Z", phase: "Groupe L" },
  { home_team: "Panama",     away_team: "Angleterre", kickoff_at: "2026-06-27T21:00:00Z", phase: "Groupe L" },
  { home_team: "Croatie",    away_team: "Ghana",   kickoff_at: "2026-06-27T21:00:00Z", phase: "Groupe L" },
];

async function seed() {
  console.log("Deleting existing matches...");
  const { error: delErr } = await supabase
    .from("matches")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delErr) {
    console.error("Error deleting:", delErr.message);
    process.exit(1);
  }

  console.log(`Seeding ${matches.length} matches...`);
  const { error } = await supabase.from("matches").insert(matches);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log(`Done! ${matches.length} group stage matches seeded across 12 groups.`);
}

seed();
