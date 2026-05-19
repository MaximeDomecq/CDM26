"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PhysicsBalls from "@/components/PhysicsBalls";

function passwordStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (pwd.length === 0) return 0;
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9!@#$%^&*]/.test(pwd)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];
const STRENGTH_LABEL = ["", "Faible", "Moyen", "Bien", "Fort"];

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (strength < 1) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Une erreur est survenue. Le lien est peut-être expiré.");
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
      <PhysicsBalls count={8} />
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 1 }}>
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
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
              Nouveau mot de passe
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 caractères minimum"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: strength >= i ? STRENGTH_COLOR[strength] : "rgba(255,255,255,0.15)" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strength > 0 ? STRENGTH_COLOR[strength] : "rgba(255,255,255,0.4)" }}>
                    {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: confirm.length > 0
                    ? password === confirm ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(239,68,68,0.5)"
                    : "1px solid rgba(255,255,255,0.15)",
                }}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password !== confirm || strength < 1}
              className="w-full py-3 rounded-xl font-black text-base transition-all active:scale-95 disabled:opacity-50 mt-1"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
                color: "#080e1a",
                boxShadow: "0 0 20px rgba(245,158,11,0.3)",
              }}
            >
              {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          Bougez la souris ou cliquez pour jouer ⚽
        </p>
      </div>
    </main>
  );
}
