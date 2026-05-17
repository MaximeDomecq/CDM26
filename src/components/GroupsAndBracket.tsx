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

interface Props {
  groupMatches: Match[];
  knockoutMatches: KnockoutMatch[];
  pctComplete: number;
}

export default function GroupsAndBracket({ groupMatches, knockoutMatches, pctComplete }: Props) {
  const [tab, setTab] = useState<"groupes" | "tableau">("groupes");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Compétition</h1>
        <div className="flex gap-2">
          <TabBtn active={tab === "groupes"} onClick={() => setTab("groupes")}>📊 Groupes</TabBtn>
          <TabBtn active={tab === "tableau"} onClick={() => setTab("tableau")}>🗂 Tableau</TabBtn>
        </div>
      </div>

      {tab === "groupes" ? (
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
      ) : (
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            32 équipes qualifiées · Seizièmes · Huitièmes · Quarts · Demi-finales · Finale
          </p>
          <KnockoutBracket knockoutMatches={knockoutMatches} pctComplete={pctComplete} />
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
