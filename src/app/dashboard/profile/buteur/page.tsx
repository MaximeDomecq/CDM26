"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Player {
  id: string; name: string; team: string; team_flag: string; position: string;
}

export default function ButeurPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [current, setCurrent] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase.from("profiles").select("predicted_top_scorer_id").eq("id", user.id).single(),
        supabase.from("players").select("*").order("team").order("name"),
      ]).then(([{ data: prof }, { data: pl }]) => {
        if (prof) setCurrent((prof as { predicted_top_scorer_id: string | null }).predicted_top_scorer_id);
        if (pl) setPlayers(pl as Player[]);
      });
    });
  }, [supabase]);

  const PROFILE_LOCK = new Date("2026-06-11T18:52:00Z");

  useEffect(() => {
    if (new Date() >= PROFILE_LOCK) router.replace("/dashboard/profile");
  }, [router]);

  async function select(playerId: string) {
    if (new Date() >= PROFILE_LOCK) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ predicted_top_scorer_id: playerId }).eq("id", user.id);
    router.push("/dashboard/profile");
    router.refresh();
  }

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/profile" className="text-brand-500 dark:text-brand-400 font-semibold text-sm hover:underline">← Retour</Link>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Meilleur buteur</h1>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 ml-1">
        <span className="font-bold text-emerald-600 dark:text-emerald-400">+2 pts</span> par but ·{" "}
        <span className="font-bold text-emerald-600 dark:text-emerald-400">+10 pts</span> s&apos;il remporte le Soulier d&apos;Or
      </p>
      <input
        type="text"
        placeholder="Rechercher un joueur ou une équipe…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="flex flex-col gap-1.5">
        {filtered.map((player) => (
          <button
            key={player.id}
            disabled={saving}
            onClick={() => select(player.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all text-left disabled:opacity-60 ${
              current === player.id
                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 font-semibold"
                : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-200 dark:hover:border-brand-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <span className="text-xl">{player.team_flag}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
              <div className="text-xs text-gray-400 dark:text-gray-600">{player.team} · {player.position}</div>
            </div>
            {current === player.id && <span className="text-brand-500 font-bold ml-auto">✓</span>}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-6">Aucun joueur trouvé.</p>
        )}
      </div>
    </div>
  );
}
