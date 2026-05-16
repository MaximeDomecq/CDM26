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

const ROUNDS = [
  {
    id: "Huitièmes",
    label: "Huitièmes de finale",
    emoji: "⚔️",
    dates: "29 juin – 3 juillet 2026",
    slots: 16,
    color: "brand",
  },
  {
    id: "Quarts",
    label: "Quarts de finale",
    emoji: "🔥",
    dates: "5 – 8 juillet 2026",
    slots: 8,
    color: "purple",
  },
  {
    id: "Demis",
    label: "Demi-finales",
    emoji: "⭐",
    dates: "14 – 15 juillet 2026",
    slots: 4,
    color: "gold",
  },
  {
    id: "Finale",
    label: "Grande Finale",
    emoji: "🏆",
    dates: "19 juillet 2026 · MetLife Stadium, New Jersey",
    slots: 2,
    color: "wc",
  },
];

const ROUND_COLORS: Record<string, string> = {
  brand:  "border-brand-200 dark:border-brand-900/60 bg-brand-50/40 dark:bg-brand-950/20",
  purple: "border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20",
  gold:   "border-gold-300 dark:border-gold-900/60 bg-amber-50/40 dark:bg-amber-950/20",
  wc:     "border-gold-400 dark:border-gold-700/60 bg-gradient-to-br from-amber-50/60 to-yellow-50/40 dark:from-wc-navy/60 dark:to-wc-dark/40",
};

const HEADER_COLORS: Record<string, string> = {
  brand:  "bg-brand-600 text-white",
  purple: "bg-purple-600 text-white",
  gold:   "bg-gold-500 text-white",
  wc:     "bg-wc-header text-white",
};

export default function KnockoutBracket({ knockoutMatches, pctComplete }: Props) {
  const matchesByPhase: Record<string, KnockoutMatch[]> = {};
  for (const m of knockoutMatches) {
    const phase = m.phase;
    if (!matchesByPhase[phase]) matchesByPhase[phase] = [];
    matchesByPhase[phase].push(m);
  }

  const groupStageIncomplete = pctComplete < 100;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {groupStageIncomplete && (
        <div className="bg-wc-header rounded-2xl p-5 text-white">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⏳</span>
            <div>
              <p className="font-black text-lg">Phase de groupes en cours ({pctComplete}%)</p>
              <p className="text-white/70 text-sm mt-1">
                Le tableau se remplira automatiquement au fur et à mesure des qualifications.
                Les 32 équipes seront connues à l&apos;issue du 27 juin 2026.
              </p>
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-400 rounded-full transition-all"
                  style={{ width: `${pctComplete}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Third place */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">🥉</span>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">Match pour la 3e place</div>
            <div className="text-xs text-gray-400 dark:text-gray-600">18 juillet 2026</div>
          </div>
        </div>
        <MatchSlot match={matchesByPhase["3e place"]?.[0]} />
      </div>

      {/* Rounds */}
      {ROUNDS.map((round) => {
        const roundMatches = matchesByPhase[round.id] ?? [];
        const emptySlots = Math.max(0, round.slots / 2 - roundMatches.length);

        return (
          <div key={round.id} className={`rounded-2xl border overflow-hidden shadow-card ${ROUND_COLORS[round.color]}`}>
            {/* Header */}
            <div className={`px-5 py-3 flex items-center justify-between ${HEADER_COLORS[round.color]}`}>
              <div className="flex items-center gap-2">
                <span>{round.emoji}</span>
                <span className="font-black text-sm">{round.label}</span>
              </div>
              <span className="text-white/70 text-xs">{round.dates}</span>
            </div>

            {/* Matches grid */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roundMatches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <TBDRow key={i} />
              ))}
              {roundMatches.length === 0 && emptySlots === 0 && (
                <p className="text-gray-400 dark:text-gray-600 text-sm col-span-2">En attente des qualifications.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchSlot({ match }: { match?: KnockoutMatch }) {
  if (!match) {
    return (
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600">
        <div className="text-sm font-semibold">TBD</div>
        <span className="text-gray-300 dark:text-gray-700">–</span>
        <div className="text-sm font-semibold">TBD</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span>{flag(match.home_team)}</span>
      <span className="font-bold text-sm text-gray-900 dark:text-white">{match.home_team}</span>
      {match.home_score !== null ? (
        <span className="font-black text-gray-900 dark:text-white">{match.home_score}–{match.away_score}</span>
      ) : (
        <span className="text-gray-300 dark:text-gray-700 font-bold">vs</span>
      )}
      <span className="font-bold text-sm text-gray-900 dark:text-white">{match.away_team}</span>
      <span>{flag(match.away_team)}</span>
    </div>
  );
}

function MatchRow({ match }: { match: KnockoutMatch }) {
  const cestTime = new Date(parseISO(match.kickoff_at).getTime() + 2 * 3600 * 1000);
  const hasResult = match.home_score !== null && match.away_score !== null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="text-xs text-gray-400 dark:text-gray-600 mb-2 font-mono">
        {format(cestTime, "d MMM · HH:mm", { locale: fr })} CEST
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span>{flag(match.home_team)}</span>
          <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{match.home_team}</span>
        </div>
        {hasResult ? (
          <span className="font-black text-lg text-gray-900 dark:text-white flex-shrink-0">
            {match.home_score}–{match.away_score}
          </span>
        ) : (
          <span className="text-gray-300 dark:text-gray-700 font-bold flex-shrink-0 text-sm">vs</span>
        )}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{match.away_team}</span>
          <span>{flag(match.away_team)}</span>
        </div>
      </div>
    </div>
  );
}

function TBDRow() {
  return (
    <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-gray-400 dark:text-gray-600">
        <div className="flex items-center gap-1.5">
          <span>🏳️</span>
          <span className="font-semibold text-sm italic">À qualifier</span>
        </div>
        <span className="font-bold text-sm">–</span>
        <div className="flex items-center gap-1.5 justify-end">
          <span className="font-semibold text-sm italic">À qualifier</span>
          <span>🏳️</span>
        </div>
      </div>
    </div>
  );
}
