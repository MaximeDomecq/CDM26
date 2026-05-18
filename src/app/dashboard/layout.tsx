import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileDropdown from "@/components/ProfileDropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const displayName = user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Joueur";

  await supabase.from("profiles").upsert(
    { id: user.id, display_name: displayName },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("favorite_team, favorite_team_flag, predicted_winner, predicted_winner_flag, predicted_top_scorer_id")
    .eq("id", user.id)
    .single();

  let topScorerName: string | null = null;
  let topScorerFlag: string | null = null;
  const topScorerId = (profile as { predicted_top_scorer_id?: string | null } | null)?.predicted_top_scorer_id;
  if (topScorerId) {
    const { data: player } = await supabase.from("players").select("name, team_flag").eq("id", topScorerId).single();
    if (player) { topScorerName = player.name; topScorerFlag = player.team_flag; }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="bg-wc-header sticky top-0 z-50 shadow-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gold-shine flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
              <span className="text-sm font-black text-wc-dark">26</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-black text-base leading-none tracking-tight">CDM 2026</div>
              <div className="text-gold-400 text-[10px] font-semibold uppercase tracking-widest leading-none mt-0.5">We Are 2026</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-0.5 text-sm font-medium overflow-x-auto">
            <NavLink href="/dashboard/matches">⚽ Matchs</NavLink>
            <NavLink href="/dashboard/groupes">📊 Compétition</NavLink>
            <NavLink href="/dashboard/leagues">🏆 Ligues</NavLink>
            <div className="w-px h-5 bg-white/20 mx-1 flex-shrink-0" />
            <ProfileDropdown
              displayName={displayName}
              favoriteTeamFlag={profile?.favorite_team_flag ?? null}
              favoriteTeam={profile?.favorite_team ?? null}
              predictedWinnerFlag={(profile as { predicted_winner_flag?: string | null } | null)?.predicted_winner_flag ?? null}
              predictedWinner={(profile as { predicted_winner?: string | null } | null)?.predicted_winner ?? null}
              topScorerName={topScorerName}
              topScorerFlag={topScorerFlag}
            />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>

      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-4 border-t border-gray-100 dark:border-gray-800">
        CDM 2026 — Pronostics entre amis
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs whitespace-nowrap"
    >
      {children}
    </Link>
  );
}
