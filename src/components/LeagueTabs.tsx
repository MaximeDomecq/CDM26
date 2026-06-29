"use client";

import { useState } from "react";
import LeagueMatchBreakdown from "./LeagueMatchBreakdown";
import LeagueChat from "./LeagueChat";
import PlayerProfileModal from "./PlayerProfileModal";
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
  correctCount: number;
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
type ReglesSubTab = "groupes" | "tournoi" | "bonus";

function PtsBadge({ pts, color }: { pts: string; color: "emerald" | "blue" | "sky" | "amber" | "purple" | "gray" }) {
  const cls = {
    emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
    blue:    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
    sky:     "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400",
    amber:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
    purple:  "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400",
    gray:    "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500",
  }[color];
  return (
    <span className={`flex-shrink-0 font-black text-xs px-2 py-0.5 rounded-full min-w-[48px] text-center ${cls}`}>
      {pts}
    </span>
  );
}

function ReglesTab() {
  const [tab, setTab] = useState<ReglesSubTab>("groupes");

  const tabs: { id: ReglesSubTab; label: string }[] = [
    { id: "groupes", label: "Phase de groupes" },
    { id: "tournoi", label: "Phase tournoi" },
    { id: "bonus",   label: "Bonus favoris" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card">
      <div className="bg-wc-header px-5 py-3">
        <h3 className="text-white font-black text-sm">Comment sont calculés les points ?</h3>
      </div>

      {/* Sous-navigation */}
      <div className="flex gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === t.id
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">

        {/* ── Phase de groupes ── */}
        {tab === "groupes" && (
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Par match</h4>
              <div className="space-y-2">
                {[
                  { pts: "5 pts", label: "Score exact", sub: "", color: "emerald" as const },
                  { pts: "+1",   label: "Bonus score unique", sub: "Si tu es le seul de la ligue à avoir le bon score", color: "emerald" as const },
                  { pts: "3 pts", label: "Bonne différence de buts", sub: "Ex : prono 2-0, résultat 3-1", color: "blue" as const },
                  { pts: "2 pts", label: "Bon résultat", sub: "Victoire ou match nul correct", color: "sky" as const },
                  { pts: "1 pt",  label: "Bon nombre de buts", sub: "Total correct mais mauvais résultat", color: "amber" as const },
                  { pts: "0 pt",  label: "Mauvais pronostic", sub: "", color: "gray" as const },
                ].map(({ pts, label, sub, color }) => (
                  <div key={label} className="flex items-start gap-3">
                    <PtsBadge pts={pts} color={color} />
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{label}</div>
                      {sub && <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Départage à égalité</h4>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">En cas d&apos;égalité de points :</p>
                <ol className="space-y-1.5">
                  {[
                    { n: "1", icon: "🎯", label: "Plus de scores exacts" },
                    { n: "2", icon: "↔",  label: "Plus de bonnes différences" },
                    { n: "3", icon: "✓",  label: "Plus de bons vainqueurs" },
                    { n: "4", icon: "➕", label: "Plus de bons totaux de buts" },
                  ].map(({ n, icon, label }) => (
                    <li key={n} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-black text-[10px] flex items-center justify-center flex-shrink-0">{n}</span>
                      <span>{icon}</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ── Phase tournoi ── */}
        {tab === "tournoi" && (
          <div className="space-y-5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              À partir des seizièmes de finale, chaque prono comporte <strong className="text-gray-700 dark:text-gray-300">3 champs indépendants</strong>.
            </p>

            {/* 3 champs */}
            <div className="space-y-3">
              <div className="rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/50 dark:bg-brand-950/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <PtsBadge pts="2 pts" color="purple" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Bon qualifié</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">L&apos;équipe que tu as choisie pour se qualifier avance.</p>
              </div>

              <div className="rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/50 dark:bg-brand-950/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <PtsBadge pts="1 pt" color="purple" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Bon contexte</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tu as prédit <strong>90 min</strong> (victoire en temps réglementaire) ou <strong>+</strong> (prolongation ou tirs au but) correctement.
                </p>
              </div>

              <div className="rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/50 dark:bg-brand-950/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Score à 90 min</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { pts: "+3 pts", label: "Score exact", sub: "(+1 si unique dans la ligue)", color: "emerald" as const },
                    { pts: "+2 pts", label: "Bonne différence de buts", sub: "Ex : 2-0 prédit, 3-1 résultat", color: "blue" as const },
                    { pts: "+1 pt",  label: "Bon total de buts", sub: "Consolation — uniquement si 0 pt par ailleurs", color: "amber" as const },
                  ].map(({ pts, label, sub, color }) => (
                    <div key={label} className="flex items-start gap-2">
                      <PtsBadge pts={pts} color={color} />
                      <div>
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{label}</div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-600">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Maximum */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Maximum par match éliminatoire</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Qualifié <span className="font-black text-purple-600 dark:text-purple-400">+2</span> ·
                Contexte <span className="font-black text-purple-600 dark:text-purple-400">+1</span> ·
                Score exact <span className="font-black text-emerald-600 dark:text-emerald-400">+3</span>
                {" = "}<span className="font-black text-gray-900 dark:text-white">6 pts</span>
                <span className="text-gray-400 dark:text-gray-600"> (7 si score unique)</span>
              </p>
            </div>

            {/* Note score */}
            <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3">
              <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">Quel score entrer ?</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Si tu choisis <strong>90 min</strong> → score à 90 min, nul impossible</li>
                <li>Si tu choisis <strong>+</strong> → score à <strong>120 min</strong> (victoires et nuls valides). Seul le score à 120 min est comparé.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Bonus favoris ── */}
        {tab === "bonus" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ces bonus s&apos;ajoutent aux points de matchs et se jouent sur toute la durée du tournoi.
            </p>

            <div className="space-y-3">
              {/* Bonus multiplicateurs */}
              <div className="rounded-xl border border-orange-200 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Bonus ×2 et ×3</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Chaque joueur dispose de <strong>2 bonus</strong> à placer sur les matchs de son choix, pour toute la compétition :
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800/40 p-2 text-center">
                    <div className="font-black text-lg text-orange-600 dark:text-orange-400">×2</div>
                    <div className="text-[11px] font-semibold text-orange-700 dark:text-orange-500">1 disponible</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-600">Double les points</div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800/40 p-2 text-center">
                    <div className="font-black text-lg text-red-600 dark:text-red-400">×3</div>
                    <div className="text-[11px] font-semibold text-red-700 dark:text-red-500">1 disponible</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-600">Triple les points</div>
                  </div>
                </div>
                <ul className="space-y-0.5 text-[11px] text-gray-400 dark:text-gray-500 list-disc list-inside">
                  <li>Placeable sur n&apos;importe quel match (groupes ou élimination)</li>
                  <li>Modifiable jusqu&apos;au coup d&apos;envoi du match</li>
                  <li>Si le score est 0 pt, le bonus ne change rien</li>
                </ul>
              </div>

              <div className="rounded-xl border border-gold-300 dark:border-gold-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🏆</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Vainqueur de la Coupe du Monde</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Si tu as prédit la bonne équipe championne du monde :{" "}
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+20 pts</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 italic">
                  Choix effectué avant le début du tournoi, non modifiable.
                </p>
              </div>

              <div className="rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/50 dark:bg-brand-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚽</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Meilleur buteur</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+2 pts</span> par but marqué par ton joueur ·{" "}
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+10 pts</span> s&apos;il remporte le Soulier d&apos;Or
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 italic">
                  Les points s&apos;accumulent au fil des matchs.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Départage à égalité de points</h4>
              <ol className="space-y-1.5">
                {[
                  { n: "1", icon: "🎯", label: "Plus de scores exacts" },
                  { n: "2", icon: "↔",  label: "Plus de bonnes différences" },
                  { n: "3", icon: "✓",  label: "Plus de bons vainqueurs" },
                  { n: "4", icon: "➕", label: "Plus de bons totaux de buts" },
                ].map(({ n, icon, label }) => (
                  <li key={n} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-black text-[10px] flex items-center justify-center flex-shrink-0">{n}</span>
                    <span>{icon}</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
type PronoTab = "en-cours" | "termines";

export default function LeagueTabs({
  leaderboard, breakdownEnCours, breakdownTermines, leagueId, currentUserId, currentDisplayName,
}: Props) {
  const [tab, setTab] = useState<MainTab>("classement");
  const [pronoTab, setPronoTab] = useState<PronoTab>(
    breakdownTermines.length > 0 ? "termines" : "en-cours"
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedEntry = selectedUserId
    ? leaderboard.find(e => e.userId === selectedUserId) ?? null
    : null;
  const selectedRank = selectedUserId
    ? leaderboard.findIndex(e => e.userId === selectedUserId) + 1
    : 0;

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
                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden sm:table-cell">Exacts</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden sm:table-cell">Bons</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {leaderboard.map((entry, i) => (
                <tr
                  key={entry.userId}
                  onClick={() => setSelectedUserId(entry.userId)}
                  className={`cursor-pointer ${
                    entry.userId === currentUserId
                      ? "bg-brand-50 dark:bg-brand-950/30 hover:bg-brand-100 dark:hover:bg-brand-950/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  } transition-colors`}
                >
                  <td className="px-4 py-3.5 text-center">
                    {i === 0 ? <span className="text-lg">🥇</span>
                    : i === 1 ? <span className="text-lg">🥈</span>
                    : i === 2 ? <span className="text-lg">🥉</span>
                    : <span className="font-bold text-gray-400 dark:text-gray-600 text-sm">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0"
                        style={{ background: entry.avatarColor }}
                      >
                        {entry.displayName.trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        {entry.displayName}
                        {entry.userId === currentUserId && (
                          <span className="ml-2 text-xs text-brand-500 dark:text-brand-400 font-medium">(vous)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-0.5 sm:hidden">
                      {entry.exactCount > 0 && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">🎯 {entry.exactCount}</span>
                      )}
                      {entry.correctCount > 0 && (
                        <span className="text-[11px] font-semibold text-brand-500 dark:text-brand-400">✓ {entry.correctCount}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center hidden sm:table-cell">
                    {entry.exactCount > 0
                      ? <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">🎯 {entry.exactCount}</span>
                      : <span className="text-gray-300 dark:text-gray-700 text-sm">—</span>}
                  </td>
                  <td className="px-3 py-3.5 text-center hidden sm:table-cell">
                    {entry.correctCount > 0
                      ? <span className="font-bold text-brand-500 dark:text-brand-400 text-sm">✓ {entry.correctCount}</span>
                      : <span className="text-gray-300 dark:text-gray-700 text-sm">—</span>}
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
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
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

      {/* Player profile modal */}
      {selectedEntry && (
        <PlayerProfileModal
          entry={{ ...selectedEntry, rank: selectedRank }}
          breakdownTermines={breakdownTermines}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Règles */}
      {tab === "regles" && (
        <ReglesTab />
      )}
    </div>
  );
}
