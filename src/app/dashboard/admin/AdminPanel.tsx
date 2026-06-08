"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { flag } from "@/lib/teams";
import { updateMatchScore, setTournamentWinner } from "@/app/actions/admin";

interface Match {
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
  tournamentWinner: string | null;
}

function MatchRow({ match }: { match: Match }) {
  const [home, setHome] = useState(match.home_score?.toString() ?? "");
  const [away, setAway] = useState(match.away_score?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      const h = home === "" ? null : parseInt(home);
      const a = away === "" ? null : parseInt(away);
      await updateMatchScore(match.id, h, a);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function clear() {
    startTransition(async () => {
      await updateMatchScore(match.id, null, null);
      setHome(""); setAway("");
    });
  }

  const hasScore = match.home_score !== null && match.away_score !== null;

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
      {/* Date */}
      <span className="text-xs text-gray-400 dark:text-gray-600 w-20 shrink-0 font-mono">
        {format(parseISO(match.kickoff_at), "d MMM HH:mm", { locale: fr })}
      </span>

      {/* Match */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-lg">{flag(match.home_team)}</span>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{match.home_team}</span>
        <span className="text-gray-300 dark:text-gray-600 text-xs mx-1">vs</span>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{match.away_team}</span>
        <span className="text-lg">{flag(match.away_team)}</span>
      </div>

      {/* Score inputs */}
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number" min={0} max={30} value={home}
          onChange={e => setHome(e.target.value)}
          placeholder="–"
          className="w-10 text-center border border-gray-200 dark:border-gray-700 rounded-lg py-1 text-sm font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-300"
        />
        <span className="text-gray-400 font-black text-sm">–</span>
        <input
          type="number" min={0} max={30} value={away}
          onChange={e => setAway(e.target.value)}
          placeholder="–"
          className="w-10 text-center border border-gray-200 dark:border-gray-700 rounded-lg py-1 text-sm font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-300"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={save}
          disabled={pending || home === "" || away === ""}
          className="px-3 py-1 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-all active:scale-95"
        >
          {pending ? "…" : saved ? "✓" : "Sauver"}
        </button>
        {hasScore && (
          <button
            onClick={clear}
            disabled={pending}
            className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-40 transition-all"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel({ matches, tournamentWinner }: Props) {
  const [winner, setWinner] = useState(tournamentWinner ?? "");
  const [winnerPending, startWinnerTransition] = useTransition();
  const [winnerSaved, setWinnerSaved] = useState(false);

  function saveWinner() {
    startWinnerTransition(async () => {
      await setTournamentWinner(winner || null);
      setWinnerSaved(true);
      setTimeout(() => setWinnerSaved(false), 2000);
    });
  }

  // Grouper les matchs par date
  const byDate: Record<string, Match[]> = {};
  for (const m of matches) {
    const day = format(parseISO(m.kickoff_at), "EEEE d MMMM", { locale: fr });
    if (!byDate[day]) byDate[day] = [];
    byDate[day].push(m);
  }

  const withScore = matches.filter(m => m.home_score !== null).length;
  const total = matches.length;

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {withScore} / {total} matchs avec score
        </p>
      </div>

      {/* Vainqueur du tournoi */}
      <div className="rounded-2xl p-5 mb-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40">
        <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
          🏆 Vainqueur du tournoi
        </p>
        {tournamentWinner && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Actuel : <span className="font-black text-gray-900 dark:text-white">{flag(tournamentWinner)} {tournamentWinner}</span>
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text" value={winner}
            onChange={e => setWinner(e.target.value)}
            placeholder="Nom de l'équipe (ex: France)"
            className="flex-1 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2 text-sm font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
          <button
            onClick={saveWinner}
            disabled={winnerPending}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-all active:scale-95"
          >
            {winnerPending ? "…" : winnerSaved ? "✓ Enregistré" : "Valider"}
          </button>
        </div>
      </div>

      {/* Matchs groupés par date */}
      <div className="flex flex-col gap-6">
        {Object.entries(byDate).map(([day, dayMatches]) => (
          <div key={day}>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2 capitalize">
              {day}
            </p>
            <div className="flex flex-col gap-1.5">
              {dayMatches.map(m => <MatchRow key={m.id} match={m} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
