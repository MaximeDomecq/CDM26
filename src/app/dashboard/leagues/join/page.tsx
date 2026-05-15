"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinLeaguePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", code.trim().toUpperCase())
      .single();

    if (!league) {
      setError("Code invalide. Vérifiez le code et réessayez.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: user.id });

    if (memberError) {
      setError("Vous êtes peut-être déjà membre de cette ligue.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/leagues/${league.id}`);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Rejoindre une ligue</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Code d&apos;invitation</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: AB12CD"
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-2 rounded-lg font-semibold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {loading ? "Recherche…" : "Rejoindre"}
        </button>
      </form>
    </div>
  );
}
