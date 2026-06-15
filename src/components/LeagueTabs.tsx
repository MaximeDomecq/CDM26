"use client";

import { useState } from "react";
import LeagueMatchBreakdown from "./LeagueMatchBreakdown";
import LeagueChat from "./LeagueChat";
import type { MatchBreakdownItem } from "./LeagueMatchBreakdown";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  matchPoints: number;
  topScorerBonus: number;
  winnerBonus: number;
  predictionsCount: number;
}

interface Props {
  leaderboard: LeaderboardEntry[];
  breakdownEnCours: MatchBreakdownItem[];
  breakdownTermines: MatchBreakdownItem[];
  leagueId: string;
  currentUserId: string;
  currentDisplayName: string;
}

type MainTab = "classement" | "pronostics" | "discussion" | "regles";
type PronoTab = "en-cours" | "termines";

export default function LeagueTabs({
  leaderboard, breakdownEnCours, breakdownTermines, leagueId, currentUserId, currentDisplayName,
}: Props) {
  const [tab, setTab] = useState<MainTab>("classement");
  const [pronoTab, setPronoTab] = useState<PronoTab>(
    breakdownTermines.length > 0 ? "termines" : "en-cours"
  );

  const mainTabs: { id: MainTab; label: string }[] = [
    { id: "classement", label: "Classement" },
    { id: "pronostics", label: "Pronostics" },
    { id: "discussion", label: "Discussion" },
    { id: "regles", label: "Règles" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
        {mainTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              tab === t.id
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Classement */}
      {tab === "classement" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Joueur</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Pronos</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {leaderboard.map((entry, i) => (
                <tr
                  key={entry.userId}
                  className={
                    entry.userId === currentUserId
                      ? "bg-brand-50 dark:bg-brand-950/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  }
                >
                  <td className="px-4 py-3.5 text-center">
                    {i === 0 ? <span className="text-lg">🥇</span>
                    : i === 1 ? <span className="text-lg">🥈</span>
                    : i === 2 ? <span className="text-lg">🥉</span>
                    : <span className="font-bold text-gray-400 dark:text-gray-600 text-sm">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                    {entry.displayName}
                    {entry.userId === currentUserId && (
                      <span className="ml-2 text-xs text-brand-500 dark:text-brand-400 font-medium">(vous)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-500 dark:text-gray-400 text-sm">
                    {entry.predictionsCount}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-black text-brand-600 dark:text-brand-400 text-base">{entry.points}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-600 ml-1">pts</span>
                    {entry.topScorerBonus > 0 && (
                      <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold">⚽ +{entry.topScorerBonus}</div>
                    )}
                    {entry.winnerBonus > 0 && (
                      <div className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold">🏆 +{entry.winnerBonus}</div>
                    )}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
                    Aucun membre pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pronostics */}
      {tab === "pronostics" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {([
              { id: "en-cours" as PronoTab, label: "En cours", count: breakdownEnCours.length },
              { id: "termines" as PronoTab, label: "Terminés", count: breakdownTermines.length },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setPronoTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  pronoTab === t.id
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-1.5 text-xs font-bold opacity-60">({t.count})</span>
                )}
              </button>
            ))}
          </div>

          {pronoTab === "en-cours" && (
            breakdownEnCours.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-8 text-center">
                <p className="text-gray-400 dark:text-gray-600 text-sm">
                  Les matchs en cours ou à venir apparaîtront ici dès le coup d&apos;envoi.
                </p>
              </div>
            ) : (
              <LeagueMatchBreakdown breakdown={breakdownEnCours} />
            )
          )}

          {pronoTab === "termines" && (
            breakdownTermines.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-8 text-center">
                <p className="text-gray-400 dark:text-gray-600 text-sm">
                  Les résultats et pronostics apparaîtront ici une fois les matchs terminés.
                </p>
              </div>
            ) : (
              <LeagueMatchBreakdown breakdown={breakdownTermines} />
            )
          )}
        </div>
      )}

      {/* Discussion */}
      {tab === "discussion" && (
        <LeagueChat
          leagueId={leagueId}
          currentUserId={currentUserId}
          currentDisplayName={currentDisplayName}
        />
      )}

      {/* Règles */}
      {tab === "regles" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card">
          <div className="bg-wc-header px-5 py-3">
            <h3 className="text-white font-black text-sm">Comment sont calculés les points ?</h3>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Par match</h4>
              <div className="space-y-2">
                {[
                  { pts: "5 pts", label: "Score exact", sub: "", color: "emerald" },
                  { pts: "+1",   label: "Bonus score unique", sub: "Si tu es le seul de la ligue à avoir le bon score", color: "emerald" },
                  { pts: "3 pts", label: "Bonne différence de buts", sub: "Ex : prono 2-0, résultat 3-1", color: "blue" },
                  { pts: "2 pts", label: "Bon résultat", sub: "Victoire ou match nul correct", color: "sky" },
                  { pts: "1 pt",  label: "Bon nombre de buts", sub: "Le total de buts des deux équipes est correct", color: "amber" },
                  { pts: "0 pt",  label: "Mauvais pronostic", sub: "", color: "gray" },
                ].map(({ pts, label, sub, color }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 font-black text-xs px-2 py-0.5 rounded-full min-w-[44px] text-center
                      ${color === "emerald" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
                        color === "blue"    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" :
                        color === "sky"     ? "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400" :
                        color === "amber"   ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" :
                                             "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500"
                      }`}>{pts}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{label}</div>
                      {sub && <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Bonus de tournoi</h4>
              <div className="space-y-3">
                <div className="rounded-xl border border-gold-300 dark:border-gold-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>🏆</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Vainqueur de la Coupe</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Si ton équipe gagne : <span className="font-black text-emerald-600 dark:text-emerald-400">+20 pts</span>
                  </p>
                </div>
                <div className="rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/50 dark:bg-brand-950/20 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚽</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Meilleur buteur</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-black text-emerald-600 dark:text-emerald-400">+2 pts</span> par but ·{" "}
                    <span className="font-black text-emerald-600 dark:text-emerald-400">+10 pts</span> Soulier d&apos;Or
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
