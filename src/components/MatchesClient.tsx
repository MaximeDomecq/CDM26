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
  extra_time_home_score: number | null;
  extra_time_away_score: number | null;
  match_end_type: string | null;
  winner_team: string | null;
}

interface Prediction {
  id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  qualifier_team: string | null;
  predicted_context: string | null;
}

interface Props {
  matches: Match[];
  predictions: Prediction[];
  userId: string;
  favoriteTeam: string | null;
  favoriteTeamFlag: string | null;
  newScoreIds?: Set<string>;
}

export default function MatchesClient({ matches, predictions, userId, favoriteTeam, favoriteTeamFlag, newScoreIds }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"date" | "equipe">("date");

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return matches.filter(m =>
      !q || m.home_team.toLowerCase().includes(q) || m.away_team.toLowerCase().includes(q)
    );
  }, [matches, search]);

  const sorted = useMemo(() => {
    const list = [...filtered].sort(
      (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
    );
    if (sort === "equipe" && favoriteTeam) {
      const fav = list.filter(m => m.home_team === favoriteTeam || m.away_team === favoriteTeam);
      const rest = list.filter(m => m.home_team !== favoriteTeam && m.away_team !== favoriteTeam);
      return [...fav, ...rest];
    }
    return list;
  }, [filtered, sort, favoriteTeam]);

  const byDate = useMemo(() => {
    const map: Record<string, Match[]> = {};
    for (const m of sorted) {
      const key = format(parseISO(m.kickoff_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return map;
  }, [sorted]);

  function renderList(list: Match[]) {
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

  return (
    <div>
      {/* 24h reminder */}
      {upcoming24h.length > 0 && !search && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3 flex items-start gap-3">
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

      {/* Search + sort */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="Rechercher une équipe…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0">
          <button
            onClick={() => setSort("date")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              sort === "date"
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSort("equipe")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              sort === "equipe"
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {favoriteTeamFlag ?? "⭐"} {favoriteTeam ?? "Mon équipe"}
          </button>
        </div>
      </div>

      {sorted.length === 0 && (
        <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-8">Aucun match trouvé.</p>
      )}

      {/* Grouped by date */}
      {Object.entries(byDate).map(([dateKey, dayMatches]) => {
        const date = parseISO(dateKey);
        const label = isToday(date) ? "Aujourd'hui" : isTomorrow(date) ? "Demain" : format(date, "EEEE d MMMM", { locale: fr });
        return (
          <section key={dateKey} className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              {label}
            </h2>
            {renderList(dayMatches)}
          </section>
        );
      })}
    </div>
  );
}
