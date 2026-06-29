"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";
import type { ScoreTier, KnockoutTier } from "@/lib/scoring";

export interface PredictionEntry {
  userId: string;
  displayName: string;
  prediction: { home_score: number; away_score: number } | null;
  knockoutPrediction: { qualifier_team: string | null; predicted_context: string | null } | null;
  knockoutBreakdown: { qualifierPts: number; contextPts: number; scorePts: number } | null;
  bonusMultiplier: number | null;
  points: number | null;
  tier: ScoreTier | KnockoutTier | null;
  isMe: boolean;
  isUniqueExact?: boolean;
}

export interface MatchBreakdownItem {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  phase: string;
  matchEndType: string | null;
  winnerTeam: string | null;
  entries: PredictionEntry[];
}

interface Props {
  breakdown: MatchBreakdownItem[];
}

const TIER_STYLE: Record<string, string> = {
  exact:          "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  goal_diff:      "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  correct_winner: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400",
  total_goals:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  wrong:          "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500",
};

const TIER_LABEL: Record<string, string> = {
  exact:          "Score exact ✓",
  goal_diff:      "Différence",
  correct_winner: "Résultat",
  total_goals:    "Total buts",
  wrong:          "Raté",
};

const END_TYPE_LABEL: Record<string, string> = {
  aet: "Prol.",
  pens: "T.A.B.",
};

export default function LeagueMatchBreakdown({ breakdown }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (breakdown.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-8 text-center">
        <p className="text-gray-400 dark:text-gray-600 text-sm">
          Les pronostics de chacun seront visibles dès le coup d&apos;envoi du match.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {breakdown.map((item) => {
        const isOpen = openId === item.matchId;
        const cestTime = parseISO(item.kickoffAt);
        const isFinished = item.homeScore !== null;
        const isKO = item.phase !== "Groupe";
        const predictedCount = item.entries.filter((e) => e.prediction !== null).length;

        return (
          <div
            key={item.matchId}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => setOpenId(isOpen ? null : item.matchId)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>{flag(item.homeTeam)}</span>
                  <span>{item.homeTeam}</span>
                  {isFinished ? (
                    <span className="font-black text-base px-1 text-gray-900 dark:text-white">
                      {item.homeScore}–{item.awayScore}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600 font-bold px-1">vs</span>
                  )}
                  <span>{item.awayTeam}</span>
                  <span>{flag(item.awayTeam)}</span>
                  {/* Qualifier winner badge */}
                  {isKO && item.winnerTeam && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">
                      {flag(item.winnerTeam)} {item.winnerTeam}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{format(cestTime, "d MMM · HH:mm", { locale: fr })} CEST</span>
                  <span>·</span>
                  <span>{item.phase}</span>
                  {isKO && item.matchEndType && item.matchEndType !== "90min" && (
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {END_TYPE_LABEL[item.matchEndType]}
                    </span>
                  )}
                  {!isFinished && (
                    <span className="text-amber-500 font-semibold">En cours / à venir</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  {predictedCount}/{item.entries.length} pronos
                </span>
                <span
                  className="text-gray-400 dark:text-gray-600 text-xs transition-transform duration-200"
                  style={{ display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}
                >
                  ▾
                </span>
              </div>
            </button>

            {/* Predictions list */}
            {isOpen && (
              <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
                {item.entries.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`px-5 py-3 ${entry.isMe ? "bg-brand-50 dark:bg-brand-950/20" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {entry.displayName}
                        {entry.isMe && (
                          <span className="ml-1.5 text-xs text-brand-500 dark:text-brand-400 font-medium">(vous)</span>
                        )}
                      </span>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.prediction ? (
                          <>
                            {isKO && entry.knockoutPrediction ? (
                              <span className="font-mono font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                {entry.knockoutPrediction.qualifier_team && (
                                  <>{flag(entry.knockoutPrediction.qualifier_team)}</>
                                )}
                                <span className="text-gray-400 dark:text-gray-500">
                                  {entry.knockoutPrediction.predicted_context === "90min" ? "90m" : "+"}
                                </span>
                                <span className="tabular-nums">
                                  {entry.prediction.home_score}–{entry.prediction.away_score}
                                </span>
                              </span>
                            ) : (
                              <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                                {entry.prediction.home_score}–{entry.prediction.away_score}
                              </span>
                            )}

                            {/* Tier badge (groupes seulement) */}
                            {!isKO && entry.tier && entry.tier !== "wrong" && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_STYLE[entry.tier] ?? ""}`}>
                                {TIER_LABEL[entry.tier] ?? entry.tier}
                              </span>
                            )}
                            {entry.bonusMultiplier && (
                              <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">
                                ×{entry.bonusMultiplier}
                              </span>
                            )}
                            {entry.points !== null && (
                              <span className="font-black text-brand-600 dark:text-brand-400 text-sm w-14 text-right">
                                +{entry.points} pts
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-600 italic">Pas de prono</span>
                        )}
                      </div>
                    </div>

                    {/* Détail KO — deuxième ligne */}
                    {isKO && entry.prediction && entry.knockoutBreakdown && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.knockoutBreakdown.qualifierPts > 0 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"}`}>
                          {entry.knockoutBreakdown.qualifierPts > 0 ? "✓" : "✗"} Qualifié +{entry.knockoutBreakdown.qualifierPts}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.knockoutBreakdown.contextPts > 0 ? "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"}`}>
                          {entry.knockoutBreakdown.contextPts > 0 ? "✓" : "✗"} Contexte +{entry.knockoutBreakdown.contextPts}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.knockoutBreakdown.scorePts > 0 ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"}`}>
                          Score +{entry.knockoutBreakdown.scorePts}
                        </span>
                        {entry.isUniqueExact && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                            ⭐ Unique
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
