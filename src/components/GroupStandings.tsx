"use client";

import { flag } from "@/lib/teams";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  phase: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string;
}

interface TeamStat {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
}

function computeGroup(matches: Match[], groupName: string): TeamStat[] {
  const groupMatches = matches.filter((m) => m.phase === groupName);
  const stats: Record<string, TeamStat> = {};

  const ensure = (name: string) => {
    if (!stats[name]) stats[name] = { name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
  };

  for (const m of groupMatches) {
    ensure(m.home_team);
    ensure(m.away_team);
    if (m.home_score === null || m.away_score === null) continue;

    const h = stats[m.home_team];
    const a = stats[m.away_team];
    h.played++; a.played++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;

    if (m.home_score > m.away_score) {
      h.won++; h.pts += 3; a.lost++;
    } else if (m.home_score < m.away_score) {
      a.won++; a.pts += 3; h.lost++;
    } else {
      h.drawn++; h.pts++; a.drawn++; a.pts++;
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdB = b.gf - b.ga, gdA = a.gf - a.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export default function GroupStandings({ matches }: { matches: Match[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {GROUPS.map((g) => {
        const groupName = `Groupe ${g}`;
        const rows = computeGroup(matches, groupName);
        const hasResults = rows.some((r) => r.played > 0);

        return (
          <div key={g} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
            {/* Group header */}
            <div className="bg-wc-header px-4 py-3 flex items-center justify-between">
              <span className="text-white font-black text-base tracking-tight">Groupe {g}</span>
              {!hasResults && (
                <span className="text-white/40 text-xs font-medium">Pas encore joué</span>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-full">Équipe</th>
                    <th className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">J</th>
                    <th className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">G</th>
                    <th className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">N</th>
                    <th className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">P</th>
                    <th className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">DB</th>
                    <th className="px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, i) => {
                    const qualify = i < 2;
                    const possible3rd = i === 2;
                    return (
                      <tr
                        key={row.name}
                        className={`transition-colors ${qualify ? "bg-emerald-50/60 dark:bg-emerald-900/10" : possible3rd ? "bg-amber-50/40 dark:bg-amber-900/10" : ""} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold w-4 text-center ${qualify ? "text-emerald-600" : possible3rd ? "text-amber-600" : "text-gray-400"}`}>
                              {i + 1}
                            </span>
                            <span className="text-base">{flag(row.name)}</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-center text-gray-600 dark:text-gray-400 text-xs">{row.played}</td>
                        <td className="px-2 py-2.5 text-center text-gray-600 text-xs">{row.won}</td>
                        <td className="px-2 py-2.5 text-center text-gray-600 text-xs">{row.drawn}</td>
                        <td className="px-2 py-2.5 text-center text-gray-600 text-xs">{row.lost}</td>
                        <td className="px-2 py-2.5 text-center text-gray-500 text-xs">{row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`font-black text-sm ${qualify ? "text-emerald-700" : "text-gray-800"}`}>{row.pts}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-200 inline-block" /> Qualifié</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-200 inline-block" /> 3e possible</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
