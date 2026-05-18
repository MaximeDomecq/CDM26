"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TEAMS } from "@/lib/teams-list";

export default function VainqueurPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("predicted_winner").eq("id", user.id).single()
        .then(({ data }) => { if (data) setCurrent((data as { predicted_winner: string | null }).predicted_winner); });
    });
  }, [supabase]);

  async function select(name: string, flag: string) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ predicted_winner: name, predicted_winner_flag: flag }).eq("id", user.id);
    router.push("/dashboard/profile");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/profile" className="text-brand-500 dark:text-brand-400 font-semibold text-sm hover:underline">← Retour</Link>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Vainqueur de la Coupe</h1>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 ml-1">
        Si cette équipe gagne le tournoi : <span className="font-bold text-emerald-600 dark:text-emerald-400">+20 pts</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TEAMS.map((team) => (
          <button
            key={team.name}
            disabled={saving}
            onClick={() => select(team.name, team.flag)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all disabled:opacity-60 ${
              current === team.name
                ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-semibold shadow-sm"
                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700 bg-white dark:bg-gray-900"
            }`}
          >
            <span className="text-xl">{team.flag}</span>
            <span className="truncate">{team.name}</span>
            {current === team.name && <span className="ml-auto text-amber-500 font-bold">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
