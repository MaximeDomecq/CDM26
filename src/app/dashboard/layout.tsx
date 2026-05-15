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

  // Ensure profile row exists (handles users who registered before the trigger was live)
  await supabase.from("profiles").upsert(
    { id: user.id, display_name: displayName },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("favorite_team, favorite_team_flag, avatar_color")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-700 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span>⚽</span> CDM 2026
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard/matches" className="hover:text-brand-100 transition">Matchs</Link>
          <Link href="/dashboard/leagues" className="hover:text-brand-100 transition">Mes ligues</Link>
          <span className="text-brand-200">|</span>
          <Link href="/dashboard/profile" className="flex items-center gap-1.5 hover:text-brand-100 transition">
            {profile?.favorite_team_flag && <span className="text-lg">{profile.favorite_team_flag}</span>}
            <span className="text-brand-100">{displayName}</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-brand-200 hover:text-white transition">Déconnexion</button>
          </form>
        </nav>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
