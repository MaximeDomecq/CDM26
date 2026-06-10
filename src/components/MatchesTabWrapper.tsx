"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";
import MatchesClient from "./MatchesClient";
import { getTier, calculatePoints, type ScoreTier } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/client";

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

function cestDate(utcIso: string) {
  return parseISO(utcIso);
}

// Matches on M6: all France matches + knockout rounds + opening match
const M6_PHASES = ["seizième", "huitième", "quart", "demi", "finale", "3e place", "petite"];
const M6_TEAMS = ["France"];
// Opening match: Mexico vs host USA on June 11
const M6_OPENING: [string, string] = ["Mexique", "États-Unis"];

function channels(homeTeam: string, awayTeam: string, phase: string): string[] {
  const ch = ["beIN Sports"];
  const phaseL = phase.toLowerCase();
  const isKnockout = M6_PHASES.some(p => phaseL.includes(p));
  const involvesFrance = M6_TEAMS.some(t => homeTeam === t || awayTeam === t);
  const isOpening = (homeTeam === M6_OPENING[0] && awayTeam === M6_OPENING[1])
                 || (homeTeam === M6_OPENING[1] && awayTeam === M6_OPENING[0]);
  if (involvesFrance || isKnockout || isOpening) ch.unshift("M6");
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
                  const chs = channels(m.home_team, m.away_team, m.phase);
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

const TIER_LABEL: Record<ScoreTier, string> = {
  exact: "Score exact",
  goal_diff: "Diff. de buts",
  correct_winner: "Bon vainqueur",
  total_goals: "Total buts",
  wrong: "Raté",
};

const TIER_STYLE: Record<ScoreTier, string> = {
  exact: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  goal_diff: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  correct_winner: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400",
  total_goals: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  wrong: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

function ResultsView({ matches, predictions }: { matches: Match[]; predictions: Prediction[] }) {
  const finished = matches.filter(m => m.home_score !== null && m.away_score !== null);
  const predMap = new Map(predictions.map(p => [p.match_id, p]));

  if (finished.length === 0) {
    return (
      <p className="text-gray-400 dark:text-gray-600 py-8 text-center">
        Aucun match terminé pour l&apos;instant.
      </p>
    );
  }

  let totalPoints = 0;
  for (const m of finished) {
    const pred = predMap.get(m.id);
    if (pred && m.home_score !== null && m.away_score !== null) {
      totalPoints += calculatePoints(pred, { home_score: m.home_score, away_score: m.away_score });
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {finished.length} match{finished.length > 1 ? "s" : ""} terminé{finished.length > 1 ? "s" : ""}
        </p>
        <div className="px-3 py-1.5 rounded-xl bg-wc-header text-white text-sm font-black">
          {totalPoints} pts au total
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {finished.map(m => {
          const pred = predMap.get(m.id);
          const result = { home_score: m.home_score!, away_score: m.away_score! };
          const tier = pred ? getTier(pred, result) : null;
          const pts = pred ? calculatePoints(pred, result) : null;

          return (
            <div
              key={m.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4"
            >
              {/* Match row */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-wide w-16 flex-shrink-0">
                  {m.phase}
                </span>
                <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{flag(m.home_team)}</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{m.home_team}</span>
                  </div>
                  <span className="font-black text-lg text-gray-900 dark:text-white px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 font-mono">
                    {m.home_score} – {m.away_score}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{m.away_team}</span>
                    <span className="text-xl">{flag(m.away_team)}</span>
                  </div>
                </div>
              </div>

              {/* Prediction row */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                {pred ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-600">Ton prono :</span>
                      <span className="font-black text-gray-700 dark:text-gray-300 font-mono text-sm">
                        {pred.home_score} – {pred.away_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tier && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_STYLE[tier]}`}>
                          {TIER_LABEL[tier]}
                        </span>
                      )}
                      <span className={`text-sm font-black px-3 py-1 rounded-xl ${
                        pts === 5 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                        : pts! >= 3 ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                        : pts! >= 1 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                      }`}>
                        {pts} pt{pts !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-gray-300 dark:text-gray-700 italic">Aucun pronostic</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MatchesTabWrapper({
  matches: initialMatches, predictions, userId, favoriteTeam, favoriteTeamFlag, calendarMatches,
}: Props) {
  const [tab, setTab] = useState<"pronos" | "resultats" | "calendrier">("pronos");
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [newScoreIds, setNewScoreIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("matches-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const updated = payload.new as Match;
          setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
          if (updated.home_score !== null) {
            setNewScoreIds(prev => new Set(prev).add(updated.id));
            setTimeout(() => {
              setNewScoreIds(prev => { const s = new Set(prev); s.delete(updated.id); return s; });
            }, 5000);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const finishedCount = matches.filter(m => m.home_score !== null).length;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Matchs</h1>
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TabBtn active={tab === "pronos"} onClick={() => setTab("pronos")}>⚽ Pronostics</TabBtn>
          <TabBtn active={tab === "resultats"} onClick={() => setTab("resultats")}>
            🏆 Résultats{finishedCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">{finishedCount}</span>}
          </TabBtn>
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
          newScoreIds={newScoreIds}
        />
      ) : tab === "resultats" ? (
        <ResultsView matches={matches} predictions={predictions} />
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
