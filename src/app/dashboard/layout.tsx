import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    .select("favorite_team, favorite_team_flag")
    .eq("id", user.id)
    .single();

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
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            >
              {profile?.favorite_team_flag && (
                <span className="text-base">{profile.favorite_team_flag}</span>
              )}
              <span className="max-w-[80px] truncate text-xs text-gold-300 font-semibold hidden md:block">{displayName}</span>
            </Link>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button className="px-2 py-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition-all text-xs flex-shrink-0">
                ⏏
              </button>
            </form>
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
