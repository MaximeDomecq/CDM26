import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";

export const revalidate = 0;

const WC_START = new Date("2026-06-11T19:00:00Z");
const WC_END = new Date("2026-07-19T20:00:00Z");

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.display_name ?? "Champion";

  const now = new Date();
  const daysToStart = differenceInDays(WC_START, now);
  const tournamentStarted = now >= WC_START;
  const tournamentEnded = now >= WC_END;

  const [{ data: matches }, { data: predictions }, { data: profile }] = await Promise.all([
    supabase.from("matches").select("id, kickoff_at, home_team, away_team, phase, home_score, away_score").order("kickoff_at"),
    supabase.from("predictions").select("match_id").eq("user_id", user!.id),
    supabase.from("profiles").select("favorite_team, favorite_team_flag, predicted_winner, predicted_winner_flag, predicted_top_scorer_id").eq("id", user!.id).single(),
  ]);

  const predictionSet = new Set((predictions ?? []).map((p) => p.match_id));
  const totalMatches = matches?.length ?? 0;
  const predictedCount = (matches ?? []).filter((m) => predictionSet.has(m.id)).length;
  const completionPct = totalMatches > 0 ? Math.round((predictedCount / totalMatches) * 100) : 0;

  const topScorerId = (profile as { predicted_top_scorer_id?: string | null } | null)?.predicted_top_scorer_id ?? null;
  let topScorer: { name: string; team: string } | null = null;
  if (topScorerId) {
    const { data: player } = await supabase.from("players").select("name, team").eq("id", topScorerId).single();
    if (player) topScorer = player;
  }

  const upcomingMatches = (matches ?? [])
    .filter((m) => parseISO(m.kickoff_at) > now)
    .slice(0, 3);

  const liveOrRecentMatches = (matches ?? [])
    .filter((m) => {
      const k = parseISO(m.kickoff_at);
      const diff = (now.getTime() - k.getTime()) / 1000 / 60;
      return diff >= 0 && diff <= 120;
    });

  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-wc-header p-8 shadow-xl">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0ea5e9 0%, transparent 40%)"}} />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Bonjour, {displayName} 👋
              </h1>
              <p className="text-gold-400 font-semibold mt-1 text-sm uppercase tracking-wider">
                FIFA World Cup 2026 · Canada · USA · Mexique
              </p>
            </div>
            {!tournamentStarted && daysToStart >= 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3 text-center">
                <div className="text-4xl font-black text-gold-400 leading-none">{daysToStart}</div>
                <div className="text-white/70 text-xs font-semibold uppercase tracking-wide mt-0.5">jours restants</div>
              </div>
            )}
            {tournamentStarted && !tournamentEnded && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-2xl px-5 py-3">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-200 font-bold text-sm uppercase tracking-wider">En cours</span>
              </div>
            )}
          </div>

          {/* Countdown to tournament */}
          {!tournamentStarted && (
            <p className="text-white/50 text-sm mt-3">
              Coup d&apos;envoi le 11 juin 2026 — Mexique vs Afrique du Sud à l&apos;Estadio Azteca
            </p>
          )}
        </div>
      </div>

      {/* Live matches */}
      {liveOrRecentMatches.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-red-700 text-sm uppercase tracking-wider">Match en cours</span>
          </div>
          <div className="space-y-2">
            {liveOrRecentMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{flag(m.home_team)} {m.home_team} vs {flag(m.away_team)} {m.away_team}</span>
                {m.home_score !== null && (
                  <span className="text-lg font-black text-gray-900">{m.home_score} – {m.away_score}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {topScorer ? (
          <div className="rounded-2xl border bg-gradient-to-br from-brand-500/10 to-brand-600/5 border-brand-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Meilleur buteur</div>
            <div className="text-lg font-black text-gray-800 leading-tight">{topScorer.name}</div>
            <div className="text-xs text-gray-500 mt-1 truncate">{topScorer.team}</div>
          </div>
        ) : (
          <Link href="/dashboard/profile" className="rounded-2xl border bg-gradient-to-br from-amber-400/10 to-amber-500/5 border-amber-200 p-4 hover:border-amber-300 transition-colors">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Meilleur buteur</div>
            <div className="text-base font-black text-amber-600 leading-tight">—</div>
            <div className="text-xs text-amber-500 mt-1 leading-tight">Complète ton profil ↗</div>
          </Link>
        )}
        <StatCard
          label="Vainqueur prédit"
          value={profile?.predicted_winner_flag ?? "—"}
          sub={profile?.predicted_winner ?? "Non défini"}
          color="gold"
        />
        <StatCard
          label="Équipe favorite"
          value={profile?.favorite_team_flag ?? "—"}
          sub={profile?.favorite_team ?? "Non définie"}
          color="green"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Progression des pronostics</span>
          <span className="text-sm font-bold text-brand-600">{completionPct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {completionPct < 100 && (
          <p className="text-xs text-gray-400 mt-2">{totalMatches - predictedCount} match(s) sans pronostic</p>
        )}
      </div>

      {/* Main nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NavCard
          href="/dashboard/matches"
          emoji="⚽"
          title="Matchs & pronostics"
          description="Pronostiquez tous les matchs de la compétition."
          badge={totalMatches - predictedCount > 0 ? `${totalMatches - predictedCount} à faire` : "À jour !"}
          badgeColor={totalMatches - predictedCount > 0 ? "orange" : "green"}
        />
        <NavCard
          href="/dashboard/groupes"
          emoji="📊"
          title="Groupes & classements"
          description="Classements en direct des 12 groupes de la phase de poules."
        />
        <NavCard
          href="/dashboard/leagues"
          emoji="🏆"
          title="Mes ligues"
          description="Créez ou rejoignez une ligue et défiez vos amis."
        />
        <NavCard
          href="/dashboard/profile"
          emoji="🎯"
          title="Mon profil"
          description="Équipe favorite, vainqueur prédit, meilleur buteur."
        />
      </div>

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Prochains matchs</h2>
          <div className="space-y-2">
            {upcomingMatches.map((m) => {
              const hasPred = predictionSet.has(m.id);
              const kickoff = parseISO(m.kickoff_at);
              return (
                <Link
                  key={m.id}
                  href="/dashboard/matches"
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasPred ? "bg-green-400" : "bg-amber-400"}`} />
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
                      {flag(m.home_team)} {m.home_team} vs {flag(m.away_team)} {m.away_team}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{format(kickoff, "d MMM", { locale: fr })}</div>
                    <div className="text-xs font-bold text-gray-700">{format(kickoff, "HH:mm")} CEST</div>
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

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: "blue" | "gold" | "green" }) {
  const colors = {
    blue:  "from-brand-500/10 to-brand-600/5 border-brand-100",
    gold:  "from-gold-400/10 to-gold-500/5 border-gold-200",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-100",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-black text-gray-800 leading-none">{value}</div>
      <div className="text-xs text-gray-500 mt-1 truncate">{sub}</div>
    </div>
  );
}

function NavCard({
  href, emoji, title, description, badge, badgeColor
}: {
  href: string; emoji: string; title: string; description: string; badge?: string; badgeColor?: "orange" | "green"
}) {
  const badgeColors = {
    orange: "bg-amber-100 text-amber-700",
    green:  "bg-emerald-100 text-emerald-700",
  };
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:border-brand-200 p-6 transition-all hover:scale-[1.015] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl">{emoji}</div>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColors[badgeColor ?? "orange"]}`}>
            {badge}
          </span>
        )}
      </div>
      <h2 className="font-bold text-gray-900 text-base group-hover:text-brand-600 transition-colors">{title}</h2>
      <p className="text-sm text-gray-500 mt-1 leading-snug">{description}</p>
    </Link>
  );
}
