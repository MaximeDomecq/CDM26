"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { getTier } from "@/lib/scoring";
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

const TIER_LABELS = {
  exact: { label: "Score exact", color: "bg-green-100 text-green-700" },
  goal_diff: { label: "Bonne différence", color: "bg-blue-100 text-blue-700" },
  correct_winner: { label: "Bon résultat", color: "bg-sky-100 text-sky-700" },
  total_goals: { label: "Total buts OK", color: "bg-yellow-100 text-yellow-700" },
  wrong: { label: "Raté", color: "bg-red-100 text-red-700" },
};

export default function MatchCard({ match, prediction, locked, userId }: Props) {
  const [home, setHome] = useState<string>(prediction?.home_score?.toString() ?? "");
  const [away, setAway] = useState<string>(prediction?.away_score?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasResult = match.home_score !== null && match.away_score !== null;

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
      {
        user_id: userId,
        match_id: match.id,
        home_score: parseInt(home),
        away_score: parseInt(away),
      },
      { onConflict: "user_id,match_id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <span>{format(new Date(match.kickoff_at), "d MMM · HH:mm", { locale: fr })}</span>
          <span>·</span>
          <span>{match.phase}</span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <span className="truncate">{match.home_team}</span>
          {hasResult ? (
            <span className="text-lg font-bold text-brand-700 shrink-0">
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span className="text-gray-300 shrink-0">vs</span>
          )}
          <span className="truncate">{match.away_team}</span>
        </div>
        {tier && (
          <span className={clsx("mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium", TIER_LABELS[tier].color)}>
            {TIER_LABELS[tier].label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          disabled={locked}
          className="w-12 text-center border rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <span className="text-gray-400 font-bold">–</span>
        <input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          disabled={locked}
          className="w-12 text-center border rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        {!locked && (
          <button
            onClick={save}
            disabled={saving || home === "" || away === ""}
            className="ml-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition disabled:opacity-40"
          >
            {saved ? "✓" : saving ? "…" : "OK"}
          </button>
        )}
        {locked && !hasResult && (
          <span className="ml-1 text-xs text-gray-400">En attente</span>
        )}
      </div>
    </div>
  );
}
