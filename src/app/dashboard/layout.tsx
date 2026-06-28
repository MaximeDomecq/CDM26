import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
            <NavLink href="/dashboard/regles">📋 Règles</NavLink>
            <div className="w-px h-5 bg-white/20 mx-1 flex-shrink-0" />
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden md:block text-xs text-gold-300 font-semibold max-w-[80px] truncate">{displayName}</span>
            </Link>
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
