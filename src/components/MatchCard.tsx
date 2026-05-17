"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { getTier } from "@/lib/scoring";
import { flag } from "@/lib/teams";
import clsx from "clsx";

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
  match: Match;
  prediction: Prediction | null;
  locked: boolean;
  userId: string;
}

const TIER_CONFIG = {
  exact:          { label: "Score exact ✓", points: "+5 pts", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  goal_diff:      { label: "Bonne différence", points: "+3 pts", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  correct_winner: { label: "Bon résultat", points: "+2 pts", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
  total_goals:    { label: "Total buts OK", points: "+1 pt", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  wrong:          { label: "Raté", points: "0 pt", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export default function MatchCard({ match, prediction, locked, userId }: Props) {
  const [home, setHome] = useState<string>(prediction?.home_score?.toString() ?? "");
  const [away, setAway] = useState<string>(prediction?.away_score?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasResult = match.home_score !== null && match.away_score !== null;
  const hasPrediction = prediction !== null;

  const tier =
    hasResult && prediction
      ? getTier(
          { home_score: prediction.home_score, away_score: prediction.away_score },
          { home_score: match.home_score!, away_score: match.away_score! }
        )
      : null;

  async function save() {
    if (home === "" || away === "") return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("predictions").upsert(
      { user_id: userId, match_id: match.id, home_score: parseInt(home), away_score: parseInt(away) },
      { onConflict: "user_id,match_id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const cestTime = parseISO(match.kickoff_at);

  return (
    <div className={clsx(
      "group bg-white dark:bg-gray-900 rounded-2xl border shadow-card hover:shadow-card-hover transition-all",
      tier === "exact" ? "border-emerald-200 dark:border-emerald-800" :
      hasPrediction ? "border-brand-100 dark:border-brand-900" :
      locked ? "border-gray-100 dark:border-gray-800 opacity-75" :
      "border-gray-100 dark:border-gray-800"
    )}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <span className="font-semibold text-gray-500 dark:text-gray-400">{match.phase}</span>
          <span>·</span>
          <span>{format(cestTime, "d MMM", { locale: fr })}</span>
          <span>·</span>
          <span className="font-mono">{format(cestTime, "HH:mm")} CEST</span>
        </div>
        {locked && !hasResult && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Verrouillé
          </span>
        )}
        {!locked && !hasPrediction && (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
            À pronostiquer
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Teams + score */}
        <div className="flex items-center gap-3">
          {/* Home */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-2xl">{flag(match.home_team)}</span>
            <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{match.home_team}</span>
          </div>

          {/* Score / separator */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {hasResult ? (
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-gray-900 dark:text-white w-7 text-center">{match.home_score}</span>
                <span className="text-gray-400 dark:text-gray-600 font-bold">–</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white w-7 text-center">{match.away_score}</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-gray-300 dark:text-gray-600 px-2">vs</div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
            <span className="font-bold text-gray-900 dark:text-white text-sm truncate text-right">{match.away_team}</span>
            <span className="text-2xl">{flag(match.away_team)}</span>
          </div>
        </div>

        {/* Tier badge (after result) */}
        {tier && (
          <div className="mt-2 flex items-center gap-2">
            <span className={clsx("text-xs px-2 py-0.5 rounded-full font-semibold", TIER_CONFIG[tier].cls)}>
              {TIER_CONFIG[tier].label}
            </span>
            <span className="text-xs font-black text-gray-700 dark:text-gray-300">{TIER_CONFIG[tier].points}</span>
            {prediction && (
              <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto">
                Pronostic : {prediction.home_score}–{prediction.away_score}
              </span>
            )}
          </div>
        )}

        {/* Prediction input */}
        {!locked && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="number" min={0} max={20} value={home}
                onChange={(e) => setHome(e.target.value)}
                placeholder="0"
                className="w-14 text-center border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-base font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <span className="text-gray-400 dark:text-gray-600 font-black text-lg">–</span>
              <input
                type="number" min={0} max={20} value={away}
                onChange={(e) => setAway(e.target.value)}
                placeholder="0"
                className="w-14 text-center border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-base font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>
            <button
              onClick={save}
              disabled={saving || home === "" || away === ""}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow"
              )}
            >
              {saved ? "✓" : saving ? "…" : "Valider"}
            </button>
          </div>
        )}

        {/* Locked with prediction */}
        {locked && hasPrediction && !hasResult && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Ton pronostic :</span>
            <span className="font-black text-gray-700 dark:text-gray-200">{prediction!.home_score}–{prediction!.away_score}</span>
          </div>
        )}

        {/* Locked without prediction */}
        {locked && !hasPrediction && !hasResult && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600 italic">Pas de pronostic pour ce match.</p>
        )}
      </div>
    </div>
  );
}
