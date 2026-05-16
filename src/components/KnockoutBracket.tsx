"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";

interface KnockoutMatch {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  phase: string;
  home_score: number | null;
  away_score: number | null;
}

interface Props {
  knockoutMatches: KnockoutMatch[];
  pctComplete: number;
}

// WC 2026: 48 teams → 32 qualify from groups → knockout rounds
const ROUNDS = [
  {
    // 32 teams → 16 matches → 16 advance
    phase: "Seizièmes de finale",
    label: "Seizièmes de finale",
    sublabel: "Round of 32",
    emoji: "⚔️",
    dates: "29 juin – 4 juillet 2026",
    matchCount: 16,
    color: "brand",
  },
  {
    // 16 teams → 8 matches → 8 advance
    phase: "Huitièmes de finale",
    label: "Huitièmes de finale",
    sublabel: "Round of 16",
    emoji: "🔥",
    dates: "5 – 8 juillet 2026",
    matchCount: 8,
    color: "purple",
  },
  {
    // 8 teams → 4 matches → 4 advance
    phase: "Quarts de finale",
    label: "Quarts de finale",
    sublabel: "Quarter-finals",
    emoji: "⭐",
    dates: "10 – 11 juillet 2026",
    matchCount: 4,
    color: "gold",
  },
  {
    // 4 teams → 2 matches → 2 advance
    phase: "Demi-finales",
    label: "Demi-finales",
    sublabel: "Semi-finals",
    emoji: "💫",
    dates: "14 – 15 juillet 2026",
    matchCount: 2,
    color: "wc",
  },
  {
    // 2 teams → final
    phase: "Finale",
    label: "Grande Finale",
    sublabel: "Final · MetLife Stadium",
    emoji: "🏆",
    dates: "19 juillet 2026 · New Jersey",
    matchCount: 1,
    color: "trophy",
  },
];

const ROUND_COLORS: Record<string, string> = {
  brand:  "border-brand-200 dark:border-brand-900/60 bg-brand-50/40 dark:bg-brand-950/20",
  purple: "border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20",
  gold:   "border-gold-300 dark:border-gold-900/60 bg-amber-50/40 dark:bg-amber-950/20",
  wc:     "border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20",
  trophy: "border-gold-400 dark:border-gold-700/60 bg-gradient-to-br from-amber-50/60 to-yellow-50/40 dark:from-amber-950/20 dark:to-yellow-950/10",
};

const HEADER_COLORS: Record<string, string> = {
  brand:  "bg-brand-600 text-white",
  purple: "bg-purple-600 text-white",
  gold:   "bg-amber-500 text-white",
  wc:     "bg-sky-600 text-white",
  trophy: "bg-wc-header text-white",
};

export default function KnockoutBracket({ knockoutMatches, pctComplete }: Props) {
  const matchesByPhase: Record<string, KnockoutMatch[]> = {};
  for (const m of knockoutMatches) {
    if (!matchesByPhase[m.phase]) matchesByPhase[m.phase] = [];
    matchesByPhase[m.phase].push(m);
  }

  const groupStageIncomplete = pctComplete < 100;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {groupStageIncomplete && (
        <div className="rounded-2xl p-5 text-white overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1f3c 60%, #132947 100%)" }}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">⏳</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg">Phase de groupes en cours ({pctComplete}%)</p>
              <p className="text-white/60 text-sm mt-1">
                Les 32 équipes qualifiées seront connues au 27 juin 2026.
                Le tableau se remplit automatiquement au fur et à mesure.
              </p>
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pctComplete}%`, background: "linear-gradient(90deg, #f59e0b, #fcd34d)" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3rd place match */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🥉</span>
            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Match pour la 3e place</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">18 juillet 2026</span>
        </div>
        <div className="px-5 py-4">
          <MatchSlot match={matchesByPhase["3e place"]?.[0]} />
        </div>
      </div>

      {/* Knockout rounds */}
      {ROUNDS.map((round) => {
        const matches = matchesByPhase[round.phase] ?? [];
        const emptyCount = Math.max(0, round.matchCount - matches.length);

        return (
          <div key={round.phase} className={`rounded-2xl border overflow-hidden shadow-card ${ROUND_COLORS[round.color]}`}>
            {/* Header */}
            <div className={`px-5 py-3 flex items-center justify-between ${HEADER_COLORS[round.color]}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{round.emoji}</span>
                <div>
                  <div className="font-black text-sm leading-tight">{round.label}</div>
                  <div className="text-white/60 text-xs">{round.sublabel}</div>
                </div>
              </div>
              <span className="text-white/70 text-xs text-right">{round.dates}</span>
            </div>

            {/* Matches */}
            <div className={`p-4 grid gap-3 ${round.matchCount >= 8 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
              {Array.from({ length: emptyCount }).map((_, i) => (
                <TBDRow key={i} />
              ))}
              {matches.length === 0 && emptyCount === 0 && (
                <p className="text-gray-400 dark:text-gray-600 text-sm col-span-2 py-2">En attente des qualifications.</p>
              )}
            </div>

            {/* Progress chip */}
            {matches.length > 0 && (
              <div className="px-5 pb-3 flex items-center gap-2">
                <div className="h-1 flex-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(matches.length / round.matchCount) * 100}%`,
                      background: "linear-gradient(90deg, #f59e0b, #fcd34d)",
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {matches.length}/{round.matchCount}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MatchSlot({ match }: { match?: KnockoutMatch }) {
  if (!match) {
    return (
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600 text-sm font-semibold">
        <span>🏳️</span><span>À qualifier</span>
        <span className="mx-2 font-bold">–</span>
        <span>À qualifier</span><span>🏳️</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span>{flag(match.home_team)}</span>
      <span className="font-bold text-sm text-gray-900 dark:text-white">{match.home_team}</span>
      {match.home_score !== null ? (
        <span className="font-black text-gray-900 dark:text-white mx-1">{match.home_score}–{match.away_score}</span>
      ) : (
        <span className="text-gray-300 dark:text-gray-700 font-bold mx-1">vs</span>
      )}
      <span className="font-bold text-sm text-gray-900 dark:text-white">{match.away_team}</span>
      <span>{flag(match.away_team)}</span>
    </div>
  );
}

function MatchRow({ match }: { match: KnockoutMatch }) {
  const cestTime = new Date(parseISO(match.kickoff_at).getTime() + 2 * 3600 * 1000);
  const hasResult = match.home_score !== null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-mono">
        {format(cestTime, "d MMM · HH:mm", { locale: fr })} CEST
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-base">{flag(match.home_team)}</span>
          <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{match.home_team}</span>
        </div>
        <div className="flex-shrink-0 px-2">
          {hasResult ? (
            <span className="font-black text-lg text-gray-900 dark:text-white">
              {match.home_score}–{match.away_score}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-gray-700 font-bold text-sm">vs</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{match.away_team}</span>
          <span className="text-base">{flag(match.away_team)}</span>
        </div>
      </div>
    </div>
  );
}

function TBDRow() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-3"
      style={{ background: "rgba(255,255,255,0.4)" }}
    >
      <div className="flex items-center justify-between gap-2 text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🏳️</span>
          <span className="font-semibold text-sm italic">À qualifier</span>
        </div>
        <span className="font-bold text-sm">–</span>
        <div className="flex items-center gap-1.5 justify-end">
          <span className="font-semibold text-sm italic">À qualifier</span>
          <span className="text-base">🏳️</span>
        </div>
      </div>
    </div>
  );
}
