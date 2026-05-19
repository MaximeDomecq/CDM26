"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PhysicsBalls from "@/components/PhysicsBalls";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "verification-failed"
      ? "Le lien de vérification est invalide ou expiré. Réessaie."
      : null
  );
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverified(false);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setUnverified(true);
      } else {
        setError("Email ou mot de passe incorrect.");
      }
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  function startCooldown() {
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function resendVerification() {
    if (resendCooldown > 0 || !email) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    startCooldown();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
            Mot de passe
          </label>
          <Link href="/auth/reset" className="text-xs font-medium hover:opacity-80" style={{ color: "rgba(255,255,255,0.45)" }}>
            Oublié ?
          </Link>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
        />
      </div>

      {error && (
        <div className="rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {unverified && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)" }}>
          <p className="font-semibold mb-1" style={{ color: "#fcd34d" }}>📬 Email non confirmé</p>
          <p className="mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>
            Clique sur le lien envoyé à <span className="font-bold" style={{ color: "#fcd34d" }}>{email}</span>.
          </p>
          <button
            type="button"
            onClick={resendVerification}
            disabled={resendCooldown > 0}
            className="text-xs font-bold underline disabled:opacity-40"
            style={{ color: "#f59e0b" }}
          >
            {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer l'email de confirmation"}
          </button>
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
        {loading ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1f3c 60%, #132947 100%)" }}
    >
      <PhysicsBalls count={14} />
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 1 }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }} />
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
              We Are 2026
            </p>
          </div>

          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>

          <p className="text-sm text-center mt-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="font-bold hover:opacity-80" style={{ color: "#f59e0b" }}>
              Créer un compte
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
