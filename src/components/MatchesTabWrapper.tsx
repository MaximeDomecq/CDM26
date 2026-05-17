"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";
import MatchesClient from "./MatchesClient";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  phase: string;
  home_score: number | null;
  away_score: number | null;
}

interface Prediction {
  id: string;
  match_id: string;
  home_score: number;
  away_score: number;
}

interface CalendarMatch {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  phase: string;
  home_score: number | null;
  away_score: number | null;
}

interface Props {
  matches: Match[];
  predictions: Prediction[];
  userId: string;
  favoriteTeam: string | null;
  favoriteTeamFlag: string | null;
  calendarMatches: CalendarMatch[];
}

const CEST = 2 * 3600 * 1000;

function cestDate(utcIso: string) {
  return new Date(parseISO(utcIso).getTime() + CEST);
}

function channels(homeTeam: string, awayTeam: string): string[] {
  const ch = ["beIN Sports"];
  if (homeTeam === "France" || awayTeam === "France") ch.unshift("M6");
  return ch;
}

function CalendarView({ matches }: { matches: CalendarMatch[] }) {
  if (matches.length === 0) {
    return <p className="text-gray-400 dark:text-gray-600">Aucun match programmé.</p>;
  }

  const byDay: Record<string, CalendarMatch[]> = {};
  for (const m of matches) {
    const key = format(cestDate(m.kickoff_at), "yyyy-MM-dd");
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(m);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 font-semibold text-[11px]">M6</span>
          Diffusion gratuite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-semibold text-[11px]">beIN</span>
          Tous les matchs (abonnement)
        </span>
      </div>
      <div className="space-y-6">
        {Object.entries(byDay).map(([dateKey, dayMatches]) => {
          const label = format(parseISO(dateKey), "EEEE d MMMM yyyy", { locale: fr });
          return (
            <section key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-wc-header text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {label}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  {dayMatches.length} match{dayMatches.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {dayMatches.map((m) => {
                  const cestTime = cestDate(m.kickoff_at);
                  const chs = channels(m.home_team, m.away_team);
                  const hasResult = m.home_score !== null && m.away_score !== null;
                  const isFrance = m.home_team === "France" || m.away_team === "France";
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-4 bg-white dark:bg-gray-900 rounded-xl border px-4 py-3 transition-all hover:shadow-card-hover ${
                        isFrance
                          ? "border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20"
                          : "border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex-shrink-0 w-14 text-center">
                        <div className="font-black text-base text-gray-900 dark:text-white font-mono">
                          {format(cestTime, "HH:mm")}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wide">CEST</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg flex-shrink-0">{flag(m.home_team)}</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{m.home_team}</span>
                          {hasResult ? (
                            <span className="font-black text-gray-900 dark:text-white mx-1 flex-shrink-0">
                              {m.home_score} – {m.away_score}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-700 mx-1 flex-shrink-0 text-sm font-bold">vs</span>
                          )}
                          <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{m.away_team}</span>
                          <span className="text-lg flex-shrink-0">{flag(m.away_team)}</span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{m.phase}</div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-1.5">
                        {chs.map((ch) => (
                          <span
                            key={ch}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              ch === "M6"
                                ? "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400"
                                : "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400"
                            }`}
                          >
                            {ch === "beIN Sports" ? "beIN" : ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-700 dark:text-amber-400">
        <strong>Note :</strong> Les matchs sur M6 seront confirmés officiellement par le Groupe M6. Seuls les matchs de la France sont indiqués avec certitude sur M6.
        beIN Sports diffuse l&apos;intégralité des 104 matchs (abonnement requis).
      </div>
    </div>
  );
}

export default function MatchesTabWrapper({
  matches, predictions, userId, favoriteTeam, favoriteTeamFlag, calendarMatches,
}: Props) {
  const [tab, setTab] = useState<"pronos" | "calendrier">("pronos");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Matchs</h1>
        <div className="flex gap-2">
          <TabBtn active={tab === "pronos"} onClick={() => setTab("pronos")}>⚽ Pronostics</TabBtn>
          <TabBtn active={tab === "calendrier"} onClick={() => setTab("calendrier")}>📅 Calendrier</TabBtn>
        </div>
      </div>

      {tab === "pronos" ? (
        <MatchesClient
          matches={matches}
          predictions={predictions}
          userId={userId}
          favoriteTeam={favoriteTeam}
          favoriteTeamFlag={favoriteTeamFlag}
        />
      ) : (
        <CalendarView matches={calendarMatches} />
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
