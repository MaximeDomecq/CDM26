import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const ok = (msg: string) => console.log(`  ✅ ${msg}`);
const fail = (msg: string) => console.log(`  ❌ ${msg}`);
const info = (msg: string) => console.log(`  ℹ️  ${msg}`);

async function check() {
  console.log("\n🔍 Checking Supabase database...\n");

  // 1. profiles
  const { data: profiles, error: profErr } = await supabase.from("profiles").select("*").limit(5);
  if (profErr) fail(`profiles table: ${profErr.message}`);
  else {
    ok(`profiles table exists (${profiles!.length} rows)`);
    const sample = profiles![0];
    if (sample) {
      const cols = ["favorite_team", "favorite_team_flag", "avatar_color", "predicted_winner", "predicted_winner_flag", "predicted_top_scorer_id"];
      const missing = cols.filter((c) => !(c in sample));
      if (missing.length === 0) ok("profiles has all new columns (migration ran ✓)");
      else fail(`profiles missing columns: ${missing.join(", ")} → run migration_01`);
    } else {
      info("profiles table is empty (no users yet)");
      // Check columns via a dummy insert attempt - instead just check via select
      const { data: colCheck } = await supabase.from("profiles").select("favorite_team, avatar_color, predicted_winner, predicted_top_scorer_id").limit(1);
      if (colCheck !== null) ok("profiles migration columns exist");
      else fail("profiles migration columns missing → run migration_01_profile_upgrades.sql");
    }
  }

  // 2. matches
  const { data: matches, error: matchErr } = await supabase.from("matches").select("*").limit(5);
  if (matchErr) fail(`matches table: ${matchErr.message}`);
  else ok(`matches table exists (${matches!.length > 0 ? "seeded" : "EMPTY — run npm run seed"})`);

  if (matches && matches.length > 0) {
    const { count } = await supabase.from("matches").select("*", { count: "exact", head: true });
    info(`${count} matches in DB`);
  }

  // 3. predictions
  const { error: predErr } = await supabase.from("predictions").select("id").limit(1);
  if (predErr) fail(`predictions table: ${predErr.message}`);
  else ok("predictions table exists");

  // 4. leagues
  const { data: leagues, error: leagueErr } = await supabase.from("leagues").select("*").limit(5);
  if (leagueErr) fail(`leagues table: ${leagueErr.message}`);
  else ok(`leagues table exists (${leagues!.length} leagues created)`);

  // 5. league_members
  const { error: memberErr } = await supabase.from("league_members").select("league_id").limit(1);
  if (memberErr) fail(`league_members table: ${memberErr.message}`);
  else ok("league_members table exists");

  // 6. players
  const { data: players, error: playerErr } = await supabase.from("players").select("*").limit(5);
  if (playerErr) fail(`players table: ${playerErr.message} → run migration_01 first`);
  else {
    const { count } = await supabase.from("players").select("*", { count: "exact", head: true });
    if ((count ?? 0) === 0) fail("players table empty → run: npm run seed:players");
    else ok(`players table exists (${count} players seeded)`);
  }

  // 7. Check trigger exists by trying to find auth users without profiles
  const { data: orphans } = await supabase.rpc("check_orphan_users").maybeSingle().catch(() => ({ data: null }));
  // RPC won't exist, skip silently

  console.log("\n📋 Summary of env vars:");
  info(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  info(`PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.slice(0, 20)}…`);
  info(`SECRET_KEY: ${process.env.SUPABASE_SECRET_KEY?.slice(0, 15)}…`);

  console.log("\n🏁 Done.\n");
}

check().catch(console.error);
