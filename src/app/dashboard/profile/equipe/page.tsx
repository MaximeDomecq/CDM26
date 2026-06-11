"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TEAMS } from "@/lib/teams-list";

export default function EquipePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("favorite_team").eq("id", user.id).single()
        .then(({ data }) => { if (data) setCurrent((data as { favorite_team: string | null }).favorite_team); });
    });
  }, [supabase]);

  const PROFILE_LOCK = new Date("2026-06-11T18:52:00Z");

  useEffect(() => {
    if (new Date() >= PROFILE_LOCK) router.replace("/dashboard/profile");
  }, [router]);

  async function select(name: string, flag: string) {
    if (new Date() >= PROFILE_LOCK) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ favorite_team: name, favorite_team_flag: flag }).eq("id", user.id);
    router.push("/dashboard/profile");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/profile" className="text-brand-500 dark:text-brand-400 font-semibold text-sm hover:underline">← Retour</Link>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Équipe favorite</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TEAMS.map((team) => (
          <button
            key={team.name}
            disabled={saving}
            onClick={() => select(team.name, team.flag)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all disabled:opacity-60 ${
              current === team.name
                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 font-semibold shadow-sm"
                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-gray-900"
            }`}
          >
            <span className="text-xl">{team.flag}</span>
            <span className="truncate">{team.name}</span>
            {current === team.name && <span className="ml-auto text-brand-500 font-bold">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
