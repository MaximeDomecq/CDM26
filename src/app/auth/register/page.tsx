"use client";

import { useState } from "react";
import Link from "next/link";
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

const STRENGTH_LABEL = ["", "Faible", "Moyen", "Bien", "Fort"];
const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (strength < 1) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Cet email est déjà utilisé. Essaie de te connecter."
          : "Une erreur est survenue. Réessaie."
      );
      setLoading(false);
    } else if (data.session) {
      window.location.href = "/dashboard";
    } else {
      setSent(true);
      setLoading(false);
      startCooldown();
    }
  }

  function startCooldown() {
    setCooldown(60);
    const iv = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function resend() {
    if (cooldown > 0) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    startCooldown();
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
          {/* Logo */}
          <div className="text-center mb-7">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)" }}
            >
              <span className="text-2xl font-black" style={{ color: "#080e1a" }}>26</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">CDM 2026</h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#f59e0b" }}>
              {sent ? "Vérifie tes emails" : "Rejoins la compétition"}
            </p>
          </div>

          {sent ? (
            /* Email sent state */
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <p className="text-white font-semibold text-base mb-2">Email envoyé !</p>
              <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                Un lien de confirmation a été envoyé à
              </p>
              <p className="text-sm font-bold mb-5" style={{ color: "#f59e0b" }}>{email}</p>
              <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                Clique sur le lien dans le mail pour activer ton compte. Vérifie aussi tes spams.
              </p>
              <button
                onClick={resend}
                disabled={cooldown > 0}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 mb-4"
                style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.05)" }}
              >
                {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer l'email"}
              </button>
              <Link href="/auth/login" className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                Déjà confirmé ? Se connecter →
              </Link>
            </div>
          ) : (
            /* Registration form */
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                />
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: strength >= i ? STRENGTH_COLOR[strength] : "rgba(255,255,255,0.15)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength > 0 ? STRENGTH_COLOR[strength] : "rgba(255,255,255,0.4)" }}>
                      {STRENGTH_LABEL[strength]}
                    </p>
                  </div>
                )}
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
          )}

          {!sent && (
            <p className="text-sm text-center mt-5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Déjà un compte ?{" "}
              <Link href="/auth/login" className="font-bold hover:opacity-80" style={{ color: "#f59e0b" }}>
                Se connecter
              </Link>
            </p>
          )}
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          Bougez la souris ou cliquez pour jouer ⚽
        </p>
      </div>
    </main>
  );
}
