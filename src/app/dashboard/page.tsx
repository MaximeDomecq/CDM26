import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";

export const revalidate = 0;

const WC_END = new Date("2026-07-19T20:00:00Z");

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.display_name ?? "Champion";

  const now = new Date();
  const tournamentEnded = now >= WC_END;

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from("matches").select("id, kickoff_at, home_team, away_team, phase, home_score, away_score").order("kickoff_at"),
    supabase.from("predictions").select("match_id").eq("user_id", user!.id),
  ]);

  const predictionSet = new Set((predictions ?? []).map((p) => p.match_id));
  const totalMatches = matches?.length ?? 0;
  const predictedCount = (matches ?? []).filter((m) => predictionSet.has(m.id)).length;
  const completionPct = totalMatches > 0 ? Math.round((predictedCount / totalMatches) * 100) : 0;

  const upcomingMatches = (matches ?? [])
    .filter((m) => parseISO(m.kickoff_at) > now)
    .slice(0, 4);

  const liveOrRecentMatches = (matches ?? []).filter((m) => {
    const k = parseISO(m.kickoff_at);
    const diff = (now.getTime() - k.getTime()) / 1000 / 60;
    return diff >= 0 && diff <= 120;
  });

  return (
    <div className="space-y-6 max-w-lg">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Bonjour, {displayName}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">FIFA World Cup 2026</p>
        </div>
        {!tournamentEnded && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 flex-shrink-0 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">En cours</span>
          </div>
        )}
      </div>

      {/* Live match */}
      {liveOrRecentMatches.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/40 shadow-card px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Match en cours</span>
          </div>
          <div className="space-y-2.5">
            {liveOrRecentMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {flag(m.home_team)} {m.home_team} — {flag(m.away_team)} {m.away_team}
                </span>
                {m.home_score !== null && (
                  <span className="font-black text-gray-900 dark:text-white font-mono ml-4 flex-shrink-0">
                    {m.home_score}–{m.away_score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions progress */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pronostics</span>
          <span className="text-sm font-black text-brand-600 dark:text-brand-400">{predictedCount} / {totalMatches}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {predictedCount < totalMatches ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            {totalMatches - predictedCount} match{totalMatches - predictedCount > 1 ? "s" : ""} sans pronostic
          </p>
        ) : (
          <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2 font-semibold">Tous les pronostics complétés ✓</p>
        )}
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-3">
        <NavCard
          href="/dashboard/matches"
          emoji="⚽"
          title="Pronostics"
          badge={totalMatches - predictedCount > 0 ? `${totalMatches - predictedCount} à faire` : undefined}
          badgeGreen={predictedCount === totalMatches}
        />
        <NavCard href="/dashboard/leagues" emoji="🏆" title="Mes ligues" />
        <NavCard href="/dashboard/groupes" emoji="📊" title="Groupes" />
        <NavCard href="/dashboard/profile" emoji="🎯" title="Mon profil" />
      </div>

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Prochains matchs</h2>
            <Link href="/dashboard/matches" className="text-xs text-brand-500 dark:text-brand-400 font-semibold hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingMatches.map((m) => {
              const hasPred = predictionSet.has(m.id);
              const kickoff = parseISO(m.kickoff_at);
              return (
                <Link
                  key={m.id}
                  href="/dashboard/matches"
                  className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 hover:border-brand-200 dark:hover:border-brand-800 transition-all shadow-card hover:shadow-card-hover group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasPred ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {flag(m.home_team)} {m.home_team} — {flag(m.away_team)} {m.away_team}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-xs text-gray-400 dark:text-gray-600">{format(kickoff, "d MMM", { locale: fr })}</div>
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{format(kickoff, "HH:mm")}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function NavCard({
  href, emoji, title, badge, badgeGreen,
}: {
  href: string; emoji: string; title: string; badge?: string; badgeGreen?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800 p-5 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{emoji}</span>
        {badge && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            badgeGreen
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
          }`}>
            {badge}
          </span>
        )}
      </div>
      <h2 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {title}
      </h2>
    </Link>
  );
}
