"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PhysicsBalls from "@/components/PhysicsBalls";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1f3c 60%, #132947 100%)" }}
    >
      <PhysicsBalls count={10} />

      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 1 }}>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
      </div>

      <div className="relative w-full max-w-sm px-4" style={{ zIndex: 10 }}>
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div className="text-center mb-7">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)" }}
            >
              <span className="text-2xl font-black" style={{ color: "#080e1a" }}>26</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">CDM 2026</h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#f59e0b" }}>
              Rejoins la compétition
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Prénom / Pseudo
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Maxime"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 caractères minimum"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-black text-base transition-all active:scale-95 disabled:opacity-50 mt-1"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
                color: "#080e1a",
                boxShadow: "0 0 20px rgba(245,158,11,0.3)",
              }}
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="font-bold transition-colors hover:opacity-80" style={{ color: "#f59e0b" }}>
              Se connecter
            </Link>
          </p>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          Bougez la souris ou cliquez pour jouer ⚽
        </p>
      </div>
    </main>
  );
}
