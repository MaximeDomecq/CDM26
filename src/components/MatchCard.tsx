"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { getTier, calculatePoints } from "@/lib/scoring";
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
  exact:          { label: "Score exact ✓", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  goal_diff:      { label: "Bonne différence", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  correct_winner: { label: "Bon résultat", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
  total_goals:    { label: "Total buts OK", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  wrong:          { label: "Raté", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export default function MatchCard({ match, prediction, locked, userId }: Props) {
  const [home, setHome] = useState(prediction?.home_score?.toString() ?? "");
  const [away, setAway] = useState(prediction?.away_score?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasResult = match.home_score !== null && match.away_score !== null;
  const hasPrediction = prediction !== null;
  const canEdit = !locked; // can edit/create prediction any time before kickoff

  const tier = hasResult && hasPrediction
    ? getTier(
        { home_score: prediction.home_score, away_score: prediction.away_score },
        { home_score: match.home_score!, away_score: match.away_score! }
      )
    : null;

  const pts = tier
    ? calculatePoints(
        { home_score: prediction!.home_score, away_score: prediction!.away_score },
        { home_score: match.home_score!, away_score: match.away_score! },
        false
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
  }

  const cestTime = parseISO(match.kickoff_at);

  return (
    <div className={clsx(
      "bg-white dark:bg-gray-900 rounded-2xl border shadow-card transition-all overflow-hidden",
      tier === "exact"   ? "border-emerald-200 dark:border-emerald-800/60" :
      tier === "wrong"   ? "border-gray-100 dark:border-gray-800" :
      tier              ? "border-brand-100 dark:border-brand-900/60" :
      hasPrediction      ? "border-brand-100 dark:border-brand-900/60" :
      canPredict         ? "border-amber-200 dark:border-amber-800/40" :
                          "border-gray-100 dark:border-gray-800"
    )}>

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span className="font-semibold text-gray-500 dark:text-gray-400">{match.phase}</span>
          <span>·</span>
          <span>{format(cestTime, "d MMM", { locale: fr })}</span>
          <span>·</span>
          <span className="font-mono">{format(cestTime, "HH:mm")} CEST</span>
        </div>
        {canEdit && !hasPrediction && (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
            À pronostiquer
          </span>
        )}
        {locked && !hasPrediction && !hasResult && (
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Verrouillé
          </span>
        )}
      </div>

      {/* Teams + score — 3-column centered layout */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Home */}
          <div className="flex flex-col items-center gap-1 min-w-0">
            <span className="text-4xl">{flag(match.home_team)}</span>
            <span className="font-bold text-sm text-gray-900 dark:text-white text-center leading-tight">
              {match.home_team}
            </span>
          </div>

          {/* Center: score */}
          <div className="flex flex-col items-center gap-0.5 px-2">
            {hasResult ? (
              <div className="flex items-center gap-1.5">
                <span className="text-3xl font-black text-gray-900 dark:text-white w-8 text-center tabular-nums">
                  {match.home_score}
                </span>
                <span className="text-gray-400 dark:text-gray-600 font-black text-xl">–</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white w-8 text-center tabular-nums">
                  {match.away_score}
                </span>
              </div>
            ) : (
              <span className="text-gray-300 dark:text-gray-600 font-black text-lg px-2">vs</span>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-1 min-w-0">
            <span className="text-4xl">{flag(match.away_team)}</span>
            <span className="font-bold text-sm text-gray-900 dark:text-white text-center leading-tight">
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-4">

          {/* Has prediction + has result → show tier + points */}
          {hasPrediction && hasResult && tier && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 justify-center flex-wrap">
                <span className={clsx("text-xs font-bold px-3 py-1 rounded-full", TIER_CONFIG[tier].cls)}>
                  {TIER_CONFIG[tier].label}
                </span>
                <span className="font-black text-lg text-gray-900 dark:text-white">
                  {pts! > 0 ? `+${pts}` : "0"} pts
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Ton prono : <span className="font-black text-gray-600 dark:text-gray-300 tabular-nums">
                  {prediction.home_score} – {prediction.away_score}
                </span>
              </p>
            </div>
          )}

          {/* Not locked → always show editable input (pre-filled if prediction exists) */}
          {canEdit && !saved && (
            <div className="flex items-center justify-center gap-2">
              <input
                type="number" min={0} max={20} value={home}
                onChange={(e) => setHome(e.target.value)}
                placeholder="0"
                className="w-14 text-center border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-lg font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <span className="text-gray-400 dark:text-gray-600 font-black text-xl">–</span>
              <input
                type="number" min={0} max={20} value={away}
                onChange={(e) => setAway(e.target.value)}
                placeholder="0"
                className="w-14 text-center border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-lg font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <button
                onClick={save}
                disabled={saving || home === "" || away === ""}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white transition-all active:scale-95 disabled:opacity-40"
              >
                {saving ? "…" : hasPrediction ? "Modifier" : "Valider"}
              </button>
            </div>
          )}

          {/* Just saved confirmation */}
          {canEdit && saved && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-black text-base tabular-nums">
                {home} – {away}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                ✓ Enregistré
              </span>
            </div>
          )}

          {/* Locked, has prediction, waiting for result */}
          {locked && hasPrediction && !hasResult && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Ton prono :</span>
              <span className="font-black text-brand-600 dark:text-brand-400 tabular-nums text-base">
                {prediction!.home_score} – {prediction!.away_score}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                En attente
              </span>
            </div>
          )}

          {/* Locked, no prediction, no result */}
          {locked && !hasPrediction && !hasResult && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 italic">
              Pas de pronostic pour ce match.
            </p>
          )}

          {/* Locked, no prediction, has result */}
          {locked && !hasPrediction && hasResult && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 italic">
              Pas de pronostic — 0 pt
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
