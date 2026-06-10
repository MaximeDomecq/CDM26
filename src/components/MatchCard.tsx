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
  freshScore?: boolean;
}

const TIER_CONFIG = {
  exact:          { label: "Score exact ✓", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  goal_diff:      { label: "Bonne différence", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  correct_winner: { label: "Bon résultat", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
  total_goals:    { label: "Total buts OK", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  wrong:          { label: "Raté", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export default function MatchCard({ match, prediction, locked, userId, freshScore = false }: Props) {
  const [home, setHome] = useState(prediction?.home_score?.toString() ?? "");
  const [away, setAway] = useState(prediction?.away_score?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // What's actually saved in DB — updates after each successful save
  const [savedHome, setSavedHome] = useState<number | null>(prediction?.home_score ?? null);
  const [savedAway, setSavedAway] = useState<number | null>(prediction?.away_score ?? null);

  const hasResult = match.home_score !== null && match.away_score !== null;
  const hasSavedPrediction = savedHome !== null && savedAway !== null;
  const canEdit = !locked;

  const tier = hasResult && hasSavedPrediction
    ? getTier(
        { home_score: savedHome, away_score: savedAway },
        { home_score: match.home_score!, away_score: match.away_score! }
      )
    : null;

  const pts = tier
    ? calculatePoints(
        { home_score: savedHome!, away_score: savedAway! },
        { home_score: match.home_score!, away_score: match.away_score! },
        false
      )
    : null;

  async function save() {
    if (home === "" || away === "") return;
    setSaving(true);
    const supabase = createClient();
    const h = parseInt(home);
    const a = parseInt(away);
    const { error } = await supabase.from("predictions").upsert(
      { user_id: userId, match_id: match.id, home_score: h, away_score: a },
      { onConflict: "user_id,match_id" }
    );
    setSaving(false);
    if (!error) {
      setSavedHome(h);
      setSavedAway(a);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    }
  }

  const cestTime = parseISO(match.kickoff_at);

  return (
    <div className={clsx(
      "bg-white dark:bg-gray-900 rounded-2xl border shadow-card transition-all overflow-hidden",
      tier === "exact"    ? "border-emerald-200 dark:border-emerald-800/60" :
      tier === "wrong"    ? "border-gray-100 dark:border-gray-800" :
      tier               ? "border-brand-100 dark:border-brand-900/60" :
      hasSavedPrediction  ? "border-emerald-200 dark:border-emerald-800/40" :
      canEdit             ? "border-amber-200 dark:border-amber-800/40" :
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

        {/* Status badge — toujours visible */}
        {canEdit && hasSavedPrediction && (
          <span className={clsx(
            "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 whitespace-nowrap",
            justSaved
              ? "bg-emerald-500 text-white scale-105"
              : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          )}>
            {justSaved ? "✓ Enregistré !" : "✓ Prono enregistré"}
          </span>
        )}
        {canEdit && !hasSavedPrediction && (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
            À pronostiquer
          </span>
        )}
        {locked && !hasSavedPrediction && (
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Pas de prono
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-center gap-1 min-w-0">
            <span className="text-4xl">{flag(match.home_team)}</span>
            <span className="font-bold text-sm text-gray-900 dark:text-white text-center leading-tight">
              {match.home_team}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 px-2">
            {hasResult ? (
              <div className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all duration-700",
                freshScore && "bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-400 dark:ring-emerald-600 scale-105"
              )}>
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

          <div className="flex flex-col items-center gap-1 min-w-0">
            <span className="text-4xl">{flag(match.away_team)}</span>
            <span className="font-bold text-sm text-gray-900 dark:text-white text-center leading-tight">
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-4 flex flex-col gap-3">

          {/* ── Résultat connu → tier + points ── */}
          {hasSavedPrediction && hasResult && tier && (
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
                  {savedHome} – {savedAway}
                </span>
              </p>
            </div>
          )}

          {/* ── Modifiable : indicateur persistant + saisie ── */}
          {canEdit && (
            <>
              {/* Indicateur prono enregistré — toujours visible si prono existe */}
              {hasSavedPrediction && (
                <div className={clsx(
                  "flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border transition-all duration-500",
                  justSaved
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600"
                    : "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30"
                )}>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums text-xl leading-none">
                    {savedHome} – {savedAway}
                  </span>
                  <span className={clsx(
                    "text-xs font-bold px-2 py-0.5 rounded-full transition-all",
                    justSaved
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                  )}>
                    {justSaved ? "✓ Prono enregistré !" : "✓ Prono enregistré"}
                  </span>
                </div>
              )}

              {/* Saisie — toujours disponible avant le coup d'envoi */}
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
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40",
                    hasSavedPrediction
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      : "bg-brand-600 hover:bg-brand-700 text-white"
                  )}
                >
                  {saving ? "…" : hasSavedPrediction ? "Modifier" : "Valider"}
                </button>
              </div>
            </>
          )}

          {/* ── Verrouillé avec prono, résultat en attente ── */}
          {locked && hasSavedPrediction && !hasResult && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Ton prono :</span>
              <span className="font-black text-brand-600 dark:text-brand-400 tabular-nums text-base">
                {savedHome} – {savedAway}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                En attente du résultat
              </span>
            </div>
          )}

          {/* ── Verrouillé sans prono ── */}
          {locked && !hasSavedPrediction && !hasResult && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 italic">
              Pas de pronostic pour ce match.
            </p>
          )}
          {locked && !hasSavedPrediction && hasResult && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 italic">
              Pas de pronostic — 0 pt
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
