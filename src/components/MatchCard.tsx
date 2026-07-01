"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { getTier, calculatePoints, calculateKnockoutPoints, isKnockoutPhase } from "@/lib/scoring";
import { flag } from "@/lib/teams";
import clsx from "clsx";

function fmtCountdown(sec: number): string {
  if (sec <= 0) return "00:00";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}j ${h}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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
  bonus_multiplier: number | null;
}

interface Props {
  match: Match;
  prediction: Prediction | null;
  locked: boolean;
  userId: string;
  freshScore?: boolean;
  usedX2: number;
  usedX3: number;
  onBonusChange: (bonus: number | null) => void;
}

const TIER_CONFIG = {
  exact:          { label: "Score exact ✓", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  goal_diff:      { label: "Bonne différence", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  correct_winner: { label: "Bon résultat", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
  total_goals:    { label: "Total buts OK", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  wrong:          { label: "Raté", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

const KNOCKOUT_TIER_CONFIG = {
  exact:       { label: "Score exact ✓", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  goal_diff:   { label: "Bonne différence", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  total_goals: { label: "Total buts", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  wrong:       { label: "Raté", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

const END_TYPE_LABEL: Record<string, string> = {
  "90min": "90 min",
  aet: "Prol.",
  pens: "T.A.B.",
};

export default function MatchCard({ match, prediction, locked, userId, freshScore = false, usedX2, usedX3, onBonusChange }: Props) {
  const isKnockout = isKnockoutPhase(match.phase);

  // Group stage state
  const [home, setHome] = useState(prediction?.home_score?.toString() ?? "");
  const [away, setAway] = useState(prediction?.away_score?.toString() ?? "");

  // Knockout state
  const [qualifier, setQualifier] = useState<string>(prediction?.qualifier_team ?? "");
  const [context, setContext] = useState<"90min" | "+" | "">(
    (prediction?.predicted_context as "90min" | "+" | "") ?? ""
  );

  // Bonus state
  const [bonus, setBonus] = useState<number | null>(prediction?.bonus_multiplier ?? null);

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Saved values (updated after each successful save)
  const [savedHome, setSavedHome] = useState<number | null>(prediction?.home_score ?? null);
  const [savedAway, setSavedAway] = useState<number | null>(prediction?.away_score ?? null);
  const [savedQualifier, setSavedQualifier] = useState<string | null>(prediction?.qualifier_team ?? null);
  const [savedContext, setSavedContext] = useState<string | null>(prediction?.predicted_context ?? null);
  const [savedBonus, setSavedBonus] = useState<number | null>(prediction?.bonus_multiplier ?? null);

  // Countdown + dynamic lock
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const kickoff = parseISO(match.kickoff_at);
    return Math.max(0, Math.floor((kickoff.getTime() - Date.now()) / 1000));
  });
  const [dynamicLocked, setDynamicLocked] = useState(
    () => locked || parseISO(match.kickoff_at) <= new Date()
  );

  useEffect(() => {
    if (dynamicLocked) return;
    const id = setInterval(() => {
      const kickoff = parseISO(match.kickoff_at);
      const diff = Math.floor((kickoff.getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsLeft(0);
        setDynamicLocked(true);
      } else {
        setSecondsLeft(diff);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [dynamicLocked, match.kickoff_at]);

  const hasResult = match.home_score !== null && match.away_score !== null;
  const hasSavedPrediction = isKnockout
    ? savedHome !== null && savedAway !== null && !!savedQualifier && !!savedContext
    : savedHome !== null && savedAway !== null;
  const canEdit = !dynamicLocked;

  const minsElapsed = (Date.now() - parseISO(match.kickoff_at).getTime()) / 60000;
  const isLive = dynamicLocked && hasResult && minsElapsed <= 130;

  // Score validation for knockout
  const homeNum = parseInt(home);
  const awayNum = parseInt(away);
  const scoreIsValid = home !== "" && away !== "" && !isNaN(homeNum) && !isNaN(awayNum);
  const scoreDraw = scoreIsValid && homeNum === awayNum;
  // Draw impossible at 90min
  const contextScoreConflict = isKnockout && scoreIsValid && context === "90min" && scoreDraw;
  // Score winner must match the chosen qualifier (unless draw = pens possible with "+" context)
  const qualifierScoreConflict = isKnockout && scoreIsValid && !!qualifier && !scoreDraw && (
    (qualifier === match.home_team && awayNum > homeNum) ||
    (qualifier === match.away_team && homeNum > awayNum)
  );

  // Bonus availability
  const canSelectX2 = 1 - usedX2 + (savedBonus === 2 ? 1 : 0) > 0;
  const canSelectX3 = 1 - usedX3 + (savedBonus === 3 ? 1 : 0) > 0;
  const displayRemainingX2 = Math.max(0, 1 - usedX2 + (savedBonus === 2 ? 1 : 0));
  const displayRemainingX3 = Math.max(0, 1 - usedX3 + (savedBonus === 3 ? 1 : 0));
  const knockoutCanSave = isKnockout
    ? !!qualifier && !!context && scoreIsValid && !contextScoreConflict && !qualifierScoreConflict
    : scoreIsValid;

  // Scoring — group stage
  const tier = !isKnockout && hasResult && hasSavedPrediction
    ? getTier(
        { home_score: savedHome!, away_score: savedAway! },
        { home_score: match.home_score!, away_score: match.away_score! }
      )
    : null;

  const pts = !isKnockout && tier
    ? calculatePoints(
        { home_score: savedHome!, away_score: savedAway! },
        { home_score: match.home_score!, away_score: match.away_score! },
        false
      ) * (savedBonus ?? 1)
    : null;

  // Scoring — knockout
  const knockoutBreakdown =
    isKnockout && hasResult && hasSavedPrediction && match.match_end_type && match.winner_team
      ? calculateKnockoutPoints(
          {
            home_score: savedHome!,
            away_score: savedAway!,
            qualifier_team: savedQualifier!,
            predicted_context: savedContext as "90min" | "+",
          },
          {
            home_score: match.home_score!,
            away_score: match.away_score!,
            extra_time_home_score: match.extra_time_home_score ?? null,
            extra_time_away_score: match.extra_time_away_score ?? null,
            match_end_type: match.match_end_type as "90min" | "aet" | "pens",
            winner_team: match.winner_team,
          },
          false
        )
      : null;

  async function save() {
    const h = parseInt(home);
    const a = parseInt(away);
    if (isNaN(h) || isNaN(a) || home === "" || away === "") return;
    if (parseISO(match.kickoff_at) <= new Date()) return;
    if (isKnockout && (!qualifier || !context || contextScoreConflict || qualifierScoreConflict)) return;

    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      user_id: userId,
      match_id: match.id,
      home_score: h,
      away_score: a,
      bonus_multiplier: bonus ?? null,
    };
    if (isKnockout) {
      payload.qualifier_team = qualifier;
      payload.predicted_context = context;
    }

    const { error } = await supabase
      .from("predictions")
      .upsert(payload, { onConflict: "user_id,match_id" });

    setSaving(false);
    if (!error) {
      setSavedHome(h);
      setSavedAway(a);
      if (isKnockout) {
        setSavedQualifier(qualifier);
        setSavedContext(context);
      }
      setSavedBonus(bonus);
      onBonusChange(bonus);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    }
  }

  const cestTime = parseISO(match.kickoff_at);

  return (
    <div className={clsx(
      "bg-white dark:bg-gray-900 rounded-2xl border shadow-card transition-all overflow-hidden",
      !isKnockout && (
        tier === "exact"    ? "border-emerald-200 dark:border-emerald-800/60" :
        tier === "wrong"    ? "border-gray-100 dark:border-gray-800" :
        tier               ? "border-brand-100 dark:border-brand-900/60" :
        hasSavedPrediction  ? "border-emerald-200 dark:border-emerald-800/40" :
        canEdit             ? "border-amber-200 dark:border-amber-800/40" :
                             "border-gray-100 dark:border-gray-800"
      ),
      isKnockout && (
        knockoutBreakdown && knockoutBreakdown.tier === "exact"  ? "border-emerald-200 dark:border-emerald-800/60" :
        knockoutBreakdown && knockoutBreakdown.total > 0         ? "border-brand-100 dark:border-brand-900/60" :
        hasSavedPrediction                                        ? "border-emerald-200 dark:border-emerald-800/40" :
        canEdit                                                   ? "border-amber-200 dark:border-amber-800/40" :
                                                                   "border-gray-100 dark:border-gray-800"
      ),
    )}>

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span className="font-semibold text-gray-500 dark:text-gray-400">{match.phase}</span>
          <span>·</span>
          <span>{format(cestTime, "d MMM", { locale: fr })}</span>
          <span>·</span>
          <span className="font-mono">{format(cestTime, "HH:mm")} CEST</span>
          {/* Badge fin de match knockout */}
          {isKnockout && match.match_end_type && match.match_end_type !== "90min" && (
            <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full">
              {END_TYPE_LABEL[match.match_end_type]}
            </span>
          )}
        </div>

        {/* Badge EN COURS */}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            EN COURS
          </span>
        )}

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

      {/* Countdown to kickoff */}
      {!dynamicLocked && !hasResult && (
        <div className={clsx(
          "mx-4 mb-2 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold font-mono",
          secondsLeft < 60
            ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
            : secondsLeft < 3600
            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
            : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        )}>
          <span>⏱</span>
          <span>Verrouillage dans {fmtCountdown(secondsLeft)}</span>
        </div>
      )}

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

          {/* ── GROUPE : résultat connu → tier + points ── */}
          {!isKnockout && hasSavedPrediction && hasResult && tier && (
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

          {/* ── KNOCKOUT : résultat connu → breakdown détaillé ── */}
          {isKnockout && hasSavedPrediction && hasResult && knockoutBreakdown && (
            <div className="flex flex-col items-center gap-2">
              {/* Score total */}
              <div className="flex items-center gap-2 justify-center flex-wrap">
                {knockoutBreakdown.tier !== "wrong" && (
                  <span className={clsx("text-xs font-bold px-3 py-1 rounded-full", KNOCKOUT_TIER_CONFIG[knockoutBreakdown.tier].cls)}>
                    {KNOCKOUT_TIER_CONFIG[knockoutBreakdown.tier].label}
                  </span>
                )}
                {savedBonus && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">
                    ×{savedBonus}
                  </span>
                )}
                <span className="font-black text-lg text-gray-900 dark:text-white">
                  {knockoutBreakdown.total * (savedBonus ?? 1) > 0 ? `+${knockoutBreakdown.total * (savedBonus ?? 1)}` : "0"} pts
                </span>
              </div>
              {/* Breakdown ligne */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap justify-center">
                <span className={knockoutBreakdown.qualifierPts > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "line-through"}>
                  {flag(savedQualifier ?? "")} Qualifié {knockoutBreakdown.qualifierPts > 0 ? "+2" : "✗"}
                </span>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <span className={knockoutBreakdown.contextPts > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "line-through"}>
                  {savedContext === "90min" ? "90 min" : "+"} {knockoutBreakdown.contextPts > 0 ? "+1" : "✗"}
                </span>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <span className={knockoutBreakdown.scorePts > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>
                  Score {savedHome}–{savedAway} {knockoutBreakdown.scorePts > 0 ? `+${knockoutBreakdown.scorePts}` : "✗"}
                </span>
              </div>
            </div>
          )}

          {/* ── KNOCKOUT : résultat en attente → résumé prono ── */}
          {isKnockout && hasSavedPrediction && !hasResult && dynamicLocked && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                {flag(savedQualifier ?? "")}
                <span>{savedQualifier}</span>
                <span className="text-gray-400 dark:text-gray-600 font-normal mx-0.5">·</span>
                <span>{savedContext === "90min" ? "90 min" : "+"}</span>
                <span className="text-gray-400 dark:text-gray-600 font-normal mx-0.5">·</span>
                <span className="tabular-nums">{savedHome}–{savedAway}</span>
                {savedBonus && (
                  <span className="text-purple-600 dark:text-purple-400 font-black">×{savedBonus}</span>
                )}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                En attente
              </span>
            </div>
          )}

          {/* ── MODIFIABLE ── */}
          {canEdit && (
            <>
              {/* Indicateur si prono existant */}
              {hasSavedPrediction && (
                <div className={clsx(
                  "flex items-center justify-center gap-2.5 py-2 px-4 rounded-xl border transition-all duration-500",
                  justSaved
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600"
                    : "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30"
                )}>
                  {isKnockout ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                      {flag(savedQualifier ?? "")} {savedQualifier} · {savedContext === "90min" ? "90 min" : "+"} · {savedHome}–{savedAway}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums text-xl leading-none">
                      {savedHome} – {savedAway}
                    </span>
                  )}
                  <span className={clsx(
                    "text-xs font-bold px-2 py-0.5 rounded-full transition-all",
                    justSaved
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                  )}>
                    {justSaved ? "✓ Enregistré !" : "✓ Prono enregistré"}
                  </span>
                </div>
              )}

              {/* ── Saisie KNOCKOUT ── */}
              {isKnockout && (
                <div className="flex flex-col gap-4">

                  {/* Étape 1 — Qualifier */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black shrink-0">1</span>
                      Qui se qualifie ?
                    </p>
                    <div className="flex gap-2">
                      {[match.home_team, match.away_team].map((team) => (
                        <button
                          key={team}
                          onClick={() => setQualifier(team)}
                          className={clsx(
                            "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border font-bold transition-all",
                            qualifier === team
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 shadow-sm"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          <span className="text-lg">{flag(team)}</span>
                          <span className="truncate text-xs">{team}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Étape 2 — Contexte (apparaît après qualifier) */}
                  {qualifier && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black shrink-0">2</span>
                        Comment se qualifie {flag(qualifier)} {qualifier} ?
                      </p>
                      <div className="flex gap-2">
                        {(["90min", "+"] as const).map((ctx) => (
                          <button
                            key={ctx}
                            onClick={() => setContext(ctx)}
                            className={clsx(
                              "flex-1 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all",
                              context === ctx
                                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                          >
                            {ctx === "90min" ? "⏱ Victoire 90 min" : "⚡ Prol. / T.A.B."}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Étape 3 — Score (apparaît après contexte) */}
                  {qualifier && context && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black shrink-0">3</span>
                        Score à {context === "+" ? "120 min" : "90 min"}
                        {context === "90min" && <span className="normal-case font-normal">(pas de nul)</span>}
                      </p>
                      <div className="flex items-start gap-2">
                        {/* Home */}
                        <div className="flex flex-col items-center gap-1">
                          <span className={clsx(
                            "text-[10px] font-bold leading-tight text-center block w-16 truncate",
                            qualifier === match.home_team ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"
                          )}>
                            {flag(match.home_team)} {match.home_team}
                          </span>
                          <input
                            type="number" min={0} max={20} value={home}
                            onChange={(e) => setHome(e.target.value)}
                            placeholder="0"
                            className={clsx(
                              "w-16 text-center border rounded-xl py-2 text-xl font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-300 dark:placeholder:text-gray-600",
                              qualifier === match.home_team ? "border-brand-400 dark:border-brand-600" : "border-gray-200 dark:border-gray-700"
                            )}
                          />
                        </div>
                        <span className="text-gray-400 dark:text-gray-600 font-black text-2xl mt-6">–</span>
                        {/* Away */}
                        <div className="flex flex-col items-center gap-1">
                          <span className={clsx(
                            "text-[10px] font-bold leading-tight text-center block w-16 truncate",
                            qualifier === match.away_team ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"
                          )}>
                            {flag(match.away_team)} {match.away_team}
                          </span>
                          <input
                            type="number" min={0} max={20} value={away}
                            onChange={(e) => setAway(e.target.value)}
                            placeholder="0"
                            className={clsx(
                              "w-16 text-center border rounded-xl py-2 text-xl font-black bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-300 dark:placeholder:text-gray-600",
                              qualifier === match.away_team ? "border-brand-400 dark:border-brand-600" : "border-gray-200 dark:border-gray-700"
                            )}
                          />
                        </div>
                      </div>
                      {contextScoreConflict && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                          Score nul impossible si victoire en temps réglementaire
                        </p>
                      )}
                      {qualifierScoreConflict && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 mt-1.5 font-bold">
                          Le score ne peut pas faire gagner l&apos;équipe adverse de ton qualifié
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bouton enregistrer — pleine largeur, séparé */}
                  {qualifier && context && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={save}
                        disabled={saving || !knockoutCanSave}
                        className={clsx(
                          "w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40",
                          hasSavedPrediction
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            : "bg-brand-600 hover:bg-brand-700 text-white"
                        )}
                      >
                        {saving ? "Enregistrement…" : hasSavedPrediction ? "✎ Modifier le prono" : "✓ Enregistrer le prono"}
                      </button>
                      {!scoreIsValid && !contextScoreConflict && !qualifierScoreConflict && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                          Entre un score pour enregistrer
                        </p>
                      )}
                    </div>
                  )}
                  {/* Hint si qualifier pas encore choisi */}
                  {!qualifier && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                      Choisis d&apos;abord qui se qualifie
                    </p>
                  )}

                  {/* Joker (optionnel) */}
                  <BonusSelector
                    bonus={bonus} setBonus={setBonus}
                    canSelectX2={canSelectX2} canSelectX3={canSelectX3}
                    displayRemainingX2={displayRemainingX2} displayRemainingX3={displayRemainingX3}
                  />
                </div>
              )}

              {/* ── Saisie GROUPE ── */}
              {!isKnockout && (
                <div className="flex flex-col gap-2">
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
                  <BonusSelector
                    bonus={bonus} setBonus={setBonus}
                    canSelectX2={canSelectX2} canSelectX3={canSelectX3}
                    displayRemainingX2={displayRemainingX2} displayRemainingX3={displayRemainingX3}
                  />
                </div>
              )}
            </>
          )}

          {/* ── Verrouillé avec prono GROUPE, résultat en attente ── */}
          {!isKnockout && locked && hasSavedPrediction && !hasResult && (
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

interface BonusSelectorProps {
  bonus: number | null;
  setBonus: (b: number | null) => void;
  canSelectX2: boolean;
  canSelectX3: boolean;
  displayRemainingX2: number;
  displayRemainingX3: number;
}

function BonusSelector({ bonus, setBonus, canSelectX2, canSelectX3, displayRemainingX2, displayRemainingX3 }: BonusSelectorProps) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
        Joker <span className="normal-case font-normal">(optionnel — multiplie tous les points)</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setBonus(null)}
          className={clsx(
            "flex-1 py-1.5 px-2 rounded-xl border text-xs font-bold transition-all",
            bonus === null
              ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-gray-300"
          )}
        >
          — Aucun
        </button>
        <button
          onClick={() => canSelectX2 && setBonus(bonus === 2 ? null : 2)}
          disabled={!canSelectX2}
          className={clsx(
            "flex-1 py-1.5 px-2 rounded-xl border text-xs font-bold transition-all",
            bonus === 2
              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
              : canSelectX2
              ? "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700"
              : "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          )}
        >
          ×2
          <span className="ml-1 font-normal opacity-70">
            ({displayRemainingX2} restant{displayRemainingX2 !== 1 ? "s" : ""})
          </span>
        </button>
        <button
          onClick={() => canSelectX3 && setBonus(bonus === 3 ? null : 3)}
          disabled={!canSelectX3}
          className={clsx(
            "flex-1 py-1.5 px-2 rounded-xl border text-xs font-bold transition-all",
            bonus === 3
              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
              : canSelectX3
              ? "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700"
              : "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          )}
        >
          ×3
          <span className="ml-1 font-normal opacity-70">
            ({displayRemainingX3} restant{displayRemainingX3 !== 1 ? "s" : ""})
          </span>
        </button>
      </div>
    </div>
  );
}
