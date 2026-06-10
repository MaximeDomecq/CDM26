"use client";

import { useState, useMemo, useRef } from "react";
import { format, isToday, isTomorrow, differenceInHours, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import MatchCard from "./MatchCard";
import { flag } from "@/lib/teams";

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

interface Props {
  matches: Match[];
  predictions: Prediction[];
  userId: string;
  favoriteTeam: string | null;
  favoriteTeamFlag: string | null;
  newScoreIds?: Set<string>;
}

type View = "date" | "group" | "today" | "favorite";

export default function MatchesClient({ matches, predictions, userId, favoriteTeam, favoriteTeamFlag, newScoreIds }: Props) {
  const [view, setView] = useState<View>("date");

  const predictionMap = useMemo(
    () => new Map(predictions.map((p) => [p.match_id, p])),
    [predictions]
  );

  const now = useRef(new Date()).current;

  const upcoming24h = useMemo(
    () => matches.filter((m) => {
      const kickoff = parseISO(m.kickoff_at);
      const diff = differenceInHours(kickoff, now);
      return diff >= 0 && diff <= 24;
    }),
    [matches, now]
  );

  const todayMatches = useMemo(() => matches.filter((m) => isToday(parseISO(m.kickoff_at))), [matches]);
  const tomorrowMatches = useMemo(() => matches.filter((m) => isTomorrow(parseISO(m.kickoff_at))), [matches]);

  const favoriteMatches = useMemo(
    () => favoriteTeam
      ? matches.filter((m) => m.home_team === favoriteTeam || m.away_team === favoriteTeam)
      : [],
    [matches, favoriteTeam]
  );

  const byDate = useMemo(() => {
    const map: Record<string, Match[]> = {};
    for (const m of matches) {
      const key = format(parseISO(m.kickoff_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return map;
  }, [matches]);

  const byGroup = useMemo(() => {
    const map: Record<string, Match[]> = {};
    for (const m of matches) {
      if (!map[m.phase]) map[m.phase] = [];
      map[m.phase].push(m);
    }
    return map;
  }, [matches]);

  function renderList(list: Match[], emptyMsg = "Aucun match.") {
    if (list.length === 0)
      return <p className="text-gray-400 dark:text-gray-600 text-sm">{emptyMsg}</p>;
    return (
      <div className="flex flex-col gap-3">
        {list.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            prediction={predictionMap.get(m.id) ?? null}
            locked={parseISO(m.kickoff_at) <= now || m.home_score !== null}
            userId={userId}
            freshScore={newScoreIds?.has(m.id) ?? false}
          />
        ))}
      </div>
    );
  }

  function renderGrouped(grouped: Record<string, Match[]>, labelFn: (key: string) => string) {
    return Object.entries(grouped).map(([key, list]) => (
      <section key={key} className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
          {labelFn(key)}
        </h2>
        {renderList(list)}
      </section>
    ));
  }

  const TABS: { id: View; label: string; emoji: string }[] = [
    { id: "date", label: "Par date", emoji: "📅" },
    { id: "group", label: "Par groupe", emoji: "🗂️" },
    { id: "today", label: "Aujourd'hui", emoji: "🔴" },
    { id: "favorite", label: favoriteTeam ?? "Mon équipe", emoji: favoriteTeamFlag ?? "⭐" },
  ];

  return (
    <div>
      {/* 24h reminder */}
      {upcoming24h.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">
              {upcoming24h.length} match{upcoming24h.length > 1 ? "s" : ""} dans les prochaines 24h !
            </p>
            <ul className="mt-1 text-xs text-amber-700 dark:text-amber-500 space-y-0.5">
              {upcoming24h.map((m) => (
                <li key={m.id}>
                  {flag(m.home_team)} {m.home_team} vs {flag(m.away_team)} {m.away_team} —{" "}
                  {format(parseISO(m.kickoff_at), "HH:mm", { locale: fr })}
                  {!predictionMap.has(m.id) && (
                    <span className="ml-1 font-bold text-amber-900 dark:text-amber-300">· Pronostic manquant !</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Matchs & Pronostics</h1>
        <span className="text-sm text-gray-400 dark:text-gray-500">{matches.length} matchs</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              view === tab.id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-700"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {view === "date" && renderGrouped(byDate, (key) => {
        const date = parseISO(key);
        if (isToday(date)) return "Aujourd'hui";
        if (isTomorrow(date)) return "Demain";
        return format(date, "EEEE d MMMM", { locale: fr });
      })}

      {view === "group" && renderGrouped(byGroup, (key) => key)}

      {view === "today" && (
        <>
          {todayMatches.length === 0 && tomorrowMatches.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 text-sm">Aucun match aujourd&apos;hui ni demain.</p>
          ) : (
            <>
              {todayMatches.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Aujourd&apos;hui</h2>
                  {renderList(todayMatches)}
                </section>
              )}
              {tomorrowMatches.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Demain</h2>
                  {renderList(tomorrowMatches)}
                </section>
              )}
            </>
          )}
        </>
      )}

      {view === "favorite" && (
        <>
          {!favoriteTeam ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              <p className="text-4xl mb-3">⭐</p>
              <p>Vous n&apos;avez pas encore d&apos;équipe favorite.</p>
              <a href="/dashboard/profile" className="mt-2 inline-block text-brand-600 font-medium hover:underline text-sm">
                Configurer mon profil →
              </a>
            </div>
          ) : (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                {favoriteTeamFlag} {favoriteTeam}
              </h2>
              {renderList(favoriteMatches, `${favoriteTeam} n'a pas encore de match programmé.`)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
