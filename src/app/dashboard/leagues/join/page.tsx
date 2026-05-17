"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinLeagueAction } from "./action";

export default function JoinLeaguePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await joinLeagueAction(formData);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/dashboard/leagues/${result.leagueId}`);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Rejoindre une ligue</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Entrez le code partagé par l&apos;admin de la ligue.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-6 flex flex-col gap-4"
      >
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
            Code d&apos;invitation
          </label>
          <input
            name="code"
            type="text"
            required
            placeholder="Ex : AB12CD"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-widest bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && (
          <div className="rounded-xl px-4 py-2.5 text-sm font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "Recherche…" : "Rejoindre la ligue"}
        </button>
      </form>
    </div>
  );
}
