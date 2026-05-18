"use client";

import { useState } from "react";
import GroupStandings from "./GroupStandings";
import KnockoutBracket from "./KnockoutBracket";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  phase: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string;
}

interface KnockoutMatch {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  phase: string;
  home_score: number | null;
  away_score: number | null;
}

interface Player {
  id: string;
  name: string;
  team: string;
  team_flag: string;
  goals: number;
  won_golden_boot: boolean;
}

interface Props {
  groupMatches: Match[];
  knockoutMatches: KnockoutMatch[];
  pctComplete: number;
  players: Player[];
}

export default function GroupsAndBracket({ groupMatches, knockoutMatches, pctComplete, players }: Props) {
  const [tab, setTab] = useState<"groupes" | "tableau" | "buteurs">("groupes");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Compétition</h1>
        <div className="flex gap-2 flex-wrap">
          <TabBtn active={tab === "groupes"} onClick={() => setTab("groupes")}>📊 Groupes</TabBtn>
          <TabBtn active={tab === "tableau"} onClick={() => setTab("tableau")}>🗂 Tableau</TabBtn>
          <TabBtn active={tab === "buteurs"} onClick={() => setTab("buteurs")}>⚽ Buteurs</TabBtn>
        </div>
      </div>

      {tab === "groupes" && (
        <div>
          <div className="mb-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Phase de groupes · 11 juin – 27 juin 2026 · 12 groupes de 4 équipes
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-800 inline-block" />
                Top 2 qualifiés automatiquement
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800 inline-block" />
                8 meilleurs 3es qualifiés
              </span>
            </div>
          </div>
          <GroupStandings matches={groupMatches} />
        </div>
      )}

      {tab === "tableau" && (
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            32 équipes qualifiées · Seizièmes · Huitièmes · Quarts · Demi-finales · Finale
          </p>
          <KnockoutBracket knockoutMatches={knockoutMatches} pctComplete={pctComplete} />
        </div>
      )}

      {tab === "buteurs" && (
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Classement des buteurs · mis à jour automatiquement après chaque match
          </p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-10">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Joueur</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Buts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {players.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
                      Le tournoi n&apos;a pas encore débuté.
                    </td>
                  </tr>
                )}
                {players.map((player, i) => (
                  <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      {i === 0 && player.goals > 0 ? (
                        <span className="text-lg">🥇</span>
                      ) : (
                        <span className="font-bold text-gray-400 dark:text-gray-600 text-sm">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{player.team_flag}</span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {player.name}
                            {player.won_golden_boot && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                                Soulier d&apos;Or
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-600">{player.team}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-black text-2xl text-gray-900 dark:text-white">{player.goals}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-600 ml-1">buts</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-wc-header text-white shadow-sm"
          : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {children}
    </button>
  );
}
