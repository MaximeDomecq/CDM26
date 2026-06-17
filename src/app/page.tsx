"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const FLAGS = [
  "🇲🇽","🇿🇦","🇰🇷","🇨🇿","🇧🇦","🇳🇱","🇩🇪","🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇦🇹","🇧🇪","🇭🇷","🇪🇸","🇫🇷","🇳🇴",
  "🇵🇹","🇸🇪","🇨🇭","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🇹🇷","🇦🇷","🇧🇷","🇨🇴","🇪🇨","🇵🇾","🇺🇾","🇩🇿","🇨🇻","🇨🇮",
  "🇪🇬","🇬🇭","🇲🇦","🇨🇩","🇸🇳","🇹🇳","🇸🇦","🇦🇺","🇮🇷","🇮🇶","🇯🇵","🇯🇴","🇶🇦","🇺🇿","🇨🇦",
  "🇨🇼","🇺🇸","🇭🇹","🇵🇦","🇳🇿",
];

const FEATURES = [
  {
    icon: "⚽",
    title: "Pronostiquez chaque match",
    desc: "104 matchs à pronostiquer, de la phase de groupes à la finale. Vos choix sont verrouillés au coup d'envoi.",
  },
  {
    icon: "🏆",
    title: "Ligues entre amis",
    desc: "Créez votre ligue privée, partagez un code d'invitation et défiez famille et amis.",
  },
  {
    icon: "📊",
    title: "Classements en direct",
    desc: "Les points se calculent automatiquement à chaque résultat. Les classements se mettent à jour en temps réel.",
  },
  {
    icon: "🗂",
    title: "Tableau des phases finales",
    desc: "Suivez le tableau des 32 équipes qualifiées, des seizièmes jusqu'à la grande finale.",
  },
];

const SCORES = [
  { pts: "5", label: "Score exact", color: "emerald", sub: "+1 bonus si seul dans la ligue" },
  { pts: "3", label: "Bonne différence de buts", color: "blue", sub: "Ex : 2-0 pronostiqué, 3-1 réel" },
  { pts: "2", label: "Bon résultat", color: "sky", sub: "Victoire / nul correct" },
  { pts: "1", label: "Total de buts exact", color: "amber", sub: "Même nombre de buts au total" },
];

export default function LandingPage() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    let x = 0;
    const speed = 0.5;
    const half = el.scrollWidth / 2;
    let raf: number;
    function tick() {
      x -= speed;
      if (Math.abs(x) >= half) x = 0;
      el!.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="min-h-screen bg-[#080e1a] text-white overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "linear-gradient(to bottom, rgba(8,14,26,0.95) 0%, transparent 100%)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-lg"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)", color: "#080e1a" }}
          >26</div>
          <span className="font-black text-white tracking-tight text-lg">CDM 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login"
            className="text-sm font-semibold text-white/70 hover:text-white transition-colors px-3 py-1.5">
            Se connecter
          </Link>
          <Link href="/auth/register"
            className="text-sm font-black px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)", color: "#080e1a" }}>
            Rejoindre
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16"
        style={{ background: "linear-gradient(160deg, #080e1a 0%, #0d1f3c 50%, #132947 100%)" }}
      >
        {/* Radial glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }} />
        </div>

        {/* Trophy glow */}
        <div className="relative mb-6">
          <div className="text-8xl sm:text-9xl drop-shadow-2xl" style={{ filter: "drop-shadow(0 0 40px rgba(245,158,11,0.5))" }}>🏆</div>
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
          style={{ borderColor: "rgba(245,158,11,0.4)", color: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          FIFA World Cup 2026 · Canada · USA · Mexique
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-center leading-[1.05] tracking-tight mb-6 max-w-4xl">
          Pronostique la{" "}
          <span style={{ background: "linear-gradient(135deg, #f59e0b, #fcd34d, #d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Coupe du Monde
          </span>
          {" "}avec tes amis
        </h1>

        <p className="text-white/60 text-lg text-center max-w-xl mb-10 leading-relaxed">
          48 nations. 104 matchs. 1 trophée.<br />
          Créez vos ligues, pronostiquez chaque résultat et grimpez au classement.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/auth/register"
            className="px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
              color: "#080e1a",
              boxShadow: "0 0 40px rgba(245,158,11,0.4)",
            }}>
            Créer mon compte
          </Link>
          <Link href="/auth/login"
            className="px-8 py-4 rounded-2xl font-semibold text-base border transition-all hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
            J&apos;ai déjà un compte →
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            { val: "48", label: "nations qualifiées" },
            { val: "104", label: "matchs au total" },
            { val: "12", label: "groupes" },
            { val: "32", label: "équipes en phases finales" },
          ].map(({ val, label }) => (
            <div key={val} className="text-center">
              <div className="text-3xl font-black" style={{ color: "#f59e0b" }}>{val}</div>
              <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/25 text-xs animate-bounce">
          <span>↓</span>
        </div>
      </section>

      {/* ── FLAG TICKER ── */}
      <div className="py-4 overflow-hidden border-y" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div className="flex" ref={marqueeRef} style={{ willChange: "transform" }}>
          {[...FLAGS, ...FLAGS].map((f, i) => (
            <span key={i} className="text-3xl mx-3 flex-shrink-0">{f}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Fonctionnalités</p>
          <h2 className="text-3xl sm:text-4xl font-black">Tout ce qu&apos;il faut pour jouer</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="rounded-2xl p-6 border transition-all hover:scale-[1.02]"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-black text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Comment jouer</p>
            <h2 className="text-3xl sm:text-4xl font-black">Prêt en 3 minutes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", icon: "📝", title: "Crée ton compte", desc: "Choisis ton pseudo et c'est parti." },
              { step: "2", icon: "🤝", title: "Rejoins une ligue", desc: "Crée ta ligue ou rejoint celle d'un ami avec son code." },
              { step: "3", icon: "⚽", title: "Pronostique !", desc: "Saisie tes scores avant chaque coup d'envoi et accumule les points." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-black relative"
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#080e1a" }}>
                  {icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#080e1a] text-xs font-black flex items-center justify-center shadow-lg">{step}</span>
                </div>
                <h3 className="font-black text-base mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE APP ── */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Application mobile</p>
          <h2 className="text-3xl sm:text-4xl font-black">Installez l&apos;app en 10 secondes</h2>
          <p className="text-white/50 mt-4 text-base max-w-lg mx-auto leading-relaxed">
            Pas besoin de l&apos;App Store. Ajoutez CDM 2026 directement sur votre écran d&apos;accueil comme une vraie application.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* iOS */}
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                🍎
              </div>
              <div>
                <div className="font-black text-base">iPhone · iPad</div>
                <div className="text-xs text-white/40">Safari uniquement</div>
              </div>
            </div>
            <ol className="space-y-4">
              {[
                { icon: "🌐", text: "Ouvrez cette page dans Safari" },
                { icon: "⬆️", text: <>Appuyez sur l&apos;icône <strong className="text-white">Partager</strong> en bas de l&apos;écran</> },
                { icon: "➕", text: <>Sélectionnez <strong className="text-white">&ldquo;Sur l&apos;écran d&apos;accueil&rdquo;</strong></> },
                { icon: "✅", text: <>Appuyez sur <strong className="text-white">Ajouter</strong> en haut à droite</> },
              ].map(({ icon, text }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-white/60 leading-relaxed pt-0.5">{text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Android */}
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                🤖
              </div>
              <div>
                <div className="font-black text-base">Android</div>
                <div className="text-xs text-white/40">Chrome recommandé</div>
              </div>
            </div>
            <ol className="space-y-4">
              {[
                { text: "Ouvrez cette page dans Chrome" },
                { text: <>Appuyez sur le menu <strong className="text-white">⋮</strong> en haut à droite</> },
                { text: <>Sélectionnez <strong className="text-white">&ldquo;Ajouter à l&apos;écran d&apos;accueil&rdquo;</strong></> },
                { text: <>Appuyez sur <strong className="text-white">Ajouter</strong> pour confirmer</> },
              ].map(({ text }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-white/60 leading-relaxed pt-0.5">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Result callout */}
        <div className="mt-6 rounded-2xl px-6 py-4 flex items-center gap-4 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}>
          <span className="text-3xl flex-shrink-0">📱</span>
          <p className="text-sm text-white/70 leading-relaxed">
            L&apos;app s&apos;ouvre en plein écran, sans barre de navigation — exactement comme une application native. Notifications, mise à jour automatique des scores incluses.
          </p>
        </div>
      </section>

      {/* ── SCORING ── */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Système de points</p>
          <h2 className="text-3xl sm:text-4xl font-black">Comment on marque des points ?</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Match points */}
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-5" style={{ color: "#f59e0b" }}>Par match</h3>
            <div className="space-y-4">
              {SCORES.map(({ pts, label, color, sub }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm
                    ${color === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
                      color === "blue"    ? "bg-blue-500/20 text-blue-400" :
                      color === "sky"     ? "bg-sky-500/20 text-sky-400" :
                                           "bg-amber-500/20 text-amber-400"}`}>
                    {pts}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bonus points */}
          <div className="space-y-4">
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <span className="font-black">Vainqueur de la Coupe</span>
              </div>
              <p className="text-white/60 text-sm">Si ton équipe gagne le tournoi :</p>
              <p className="text-3xl font-black mt-1" style={{ color: "#f59e0b" }}>+20 pts</p>
            </div>
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(14,165,233,0.06)", borderColor: "rgba(14,165,233,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚽</span>
                <span className="font-black">Meilleur buteur</span>
              </div>
              <p className="text-white/60 text-sm"><span className="font-black text-sky-400">+2 pts</span> par but de ton joueur</p>
              <p className="text-white/60 text-sm mt-1"><span className="font-black text-sky-400">+10 pts</span> s&apos;il remporte le Soulier d&apos;Or</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4 text-center" style={{ background: "linear-gradient(160deg, #080e1a 0%, #0d1f3c 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-6xl mb-6" style={{ filter: "drop-shadow(0 0 24px rgba(245,158,11,0.5))" }}>⚽</div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            La Coupe du Monde{" "}
            <span style={{ color: "#f59e0b" }}>est en cours</span>
          </h2>
          <p className="text-white/50 mb-10 text-lg">Les matchs s&apos;enchaînent — rejoins maintenant et pronostique !</p>
          <Link
            href="/auth/register"
            className="inline-block px-10 py-5 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
              color: "#080e1a",
              boxShadow: "0 0 60px rgba(245,158,11,0.35)",
            }}>
            On joue →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4 border-t text-center text-white/25 text-xs" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        CDM 2026 · Fait avec ❤️ pour la famille et les amis
      </footer>
    </main>
  );
}
