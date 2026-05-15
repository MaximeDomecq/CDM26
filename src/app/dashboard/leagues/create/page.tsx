"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function generateCode(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

export default function CreateLeaguePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const invite_code = generateCode();

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({ name, invite_code, created_by: user.id })
      .select()
      .single();

    if (leagueError || !league) {
      setError("Erreur lors de la création de la ligue.");
      setLoading(false);
      return;
    }

    await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: user.id,
    });

    router.push(`/dashboard/leagues/${league.id}`);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Créer une ligue</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la ligue</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Famille Domecq"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-2 rounded-lg font-semibold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer la ligue"}
        </button>
      </form>
    </div>
  );
}
