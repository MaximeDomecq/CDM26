"use client";

import { useEffect } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";
import type { MatchBreakdownItem } from "./LeagueMatchBreakdown";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarColor: string;
  favoriteTeam: string | null;
  favoriteTeamFlag: string | null;
  predictedWinner: string | null;
  predictedWinnerFlag: string | null;
  topScorerName: string | null;
  topScorerFlag: string | null;
  points: number;
  matchPoints: number;
  topScorerBonus: number;
  winnerBonus: number;
  predictionsCount: number;
  exactCount: number;
  goalDiffCount: number;
  correctWinnerCount: number;
  totalGoalsCount: number;
  wrongCount: number;
  rank: number;
}

interface Props {
  entry: LeaderboardEntry;
  breakdownTermines: MatchBreakdownItem[];
  onClose: () => void;
}

const TIER_CONFIG = [
  { key: "exact",          label: "Score exact",       pts: 5, color: "emerald", icon: "🎯" },
  { key: "goal_diff",      label: "Bonne différence",  pts: 3, color: "blue",    icon: "↔" },
  { key: "correct_winner", label: "Bon résultat",      pts: 2, color: "sky",     icon: "✓" },
  { key: "total_goals",    label: "Total buts",        pts: 1, color: "amber",   icon: "➕" },
  { key: "wrong",          label: "Raté",              pts: 0, color: "gray",    icon: "✗" },
] as const;

const TIER_STYLE: Record<string, string> = {
  exact:          "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  goal_diff:      "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  correct_winner: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400",
  total_goals:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  wrong:          "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500",
};

const TIER_LABEL: Record<string, string> = {
  exact:          "Exact",
  goal_diff:      "Différence",
  correct_winner: "Résultat",
  total_goals:    "Total buts",
  wrong:          "Raté",
};

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function PlayerProfileModal({ entry, breakdownTermines, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Predictions for this user across finished matches
  const userPredictions = breakdownTermines.map((match) => {
    const pred = match.entries.find(e => e.userId === entry.userId);
    return { match, pred };
  }).filter(({ pred }) => pred !== undefined);

  const tierCounts: Record<string, number> = {
    exact: entry.exactCount,
    goal_diff: entry.goalDiffCount,
    correct_winner: entry.correctWinnerCount,
    total_goals: entry.totalGoalsCount,
    wrong: entry.wrongCount,
  };

  const totalFinished = entry.predictionsCount;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: entry.avatarColor }}
          >
            {initials(entry.displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 dark:text-white text-base truncate">{entry.displayName}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              #{entry.rank} du classement · {entry.points} pts
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Picks */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Pronostics de tournoi</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-center">
                <div className="text-lg mb-1">{entry.favoriteTeamFlag ?? "🏴"}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Équipe fav.</div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{entry.favoriteTeam ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-3 text-center">
                <div className="text-lg mb-1">{entry.predictedWinnerFlag ?? "🏆"}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-amber-500 dark:text-amber-400 mb-0.5">Vainqueur</div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{entry.predictedWinner ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 p-3 text-center">
                <div className="text-lg mb-1">{entry.topScorerFlag ?? "⚽"}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-brand-500 dark:text-brand-400 mb-0.5">Buteur</div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{entry.topScorerName ?? "—"}</div>
              </div>
            </div>
          </div>

          {/* Points breakdown */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Répartition des points</p>

            {/* Tier rows */}
            <div className="space-y-2 mb-4">
              {TIER_CONFIG.map(({ key, label, pts, icon }) => {
                const count = tierCounts[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center">{icon}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_STYLE[key]}`}>
                      {count}×
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-12 text-right">
                      {pts > 0 ? `${count * pts} pts` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Points matchs</span>
                <span className="font-black text-gray-900 dark:text-white">{entry.matchPoints} pts</span>
              </div>
              {entry.topScorerBonus > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">⚽ Bonus buteur ({entry.topScorerName})</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{entry.topScorerBonus} pts</span>
                </div>
              )}
              {entry.winnerBonus > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">🏆 Bonus vainqueur</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">+{entry.winnerBonus} pts</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-800 dark:text-gray-200">Total</span>
                <span className="font-black text-brand-600 dark:text-brand-400">{entry.points} pts</span>
              </div>
            </div>
          </div>

          {/* Prediction history */}
          <div className="px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Historique ({totalFinished}/{breakdownTermines.length} pronos)
            </p>

            {userPredictions.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">Aucun pronostic enregistré.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {userPredictions.map(({ match, pred }) => {
                  if (!pred) return null;
                  const isFinished = match.homeScore !== null;
                  return (
                    <div
                      key={match.matchId}
                      className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5"
                    >
                      {/* Match line */}
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex-wrap">
                        <span>{flag(match.homeTeam)}</span>
                        <span>{match.homeTeam}</span>
                        {isFinished ? (
                          <span className="font-black text-gray-900 dark:text-white px-1">{match.homeScore}–{match.awayScore}</span>
                        ) : (
                          <span className="text-gray-400 px-1">vs</span>
                        )}
                        <span>{match.awayTeam}</span>
                        <span>{flag(match.awayTeam)}</span>
                        <span className="ml-auto text-gray-400 dark:text-gray-500 font-normal">
                          {format(parseISO(match.kickoffAt), "d MMM", { locale: fr })}
                        </span>
                      </div>
                      {/* Prediction + result */}
                      <div className="flex items-center gap-2">
                        {pred.prediction ? (
                          <>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Prono :</span>
                            <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                              {pred.prediction.home_score}–{pred.prediction.away_score}
                            </span>
                            {pred.tier && (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${TIER_STYLE[pred.tier]}`}>
                                {TIER_LABEL[pred.tier]}
                              </span>
                            )}
                            {pred.isUniqueExact && (
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400">
                                ⭐ seul
                              </span>
                            )}
                            {pred.points !== null && (
                              <span className="ml-auto font-black text-brand-600 dark:text-brand-400 text-sm">
                                +{pred.points} pts
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-600 italic">Pas de prono</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
