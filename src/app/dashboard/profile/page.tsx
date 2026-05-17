"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const TEAMS = [
  // UEFA (16)
  { name: "Allemagne", flag: "🇩🇪" }, { name: "Angleterre", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Autriche", flag: "🇦🇹" }, { name: "Belgique", flag: "🇧🇪" },
  { name: "Bosnie-Herzégovine", flag: "🇧🇦" }, { name: "Croatie", flag: "🇭🇷" },
  { name: "Espagne", flag: "🇪🇸" }, { name: "France", flag: "🇫🇷" },
  { name: "Norvège", flag: "🇳🇴" }, { name: "Pays-Bas", flag: "🇳🇱" },
  { name: "Portugal", flag: "🇵🇹" }, { name: "Suède", flag: "🇸🇪" },
  { name: "Suisse", flag: "🇨🇭" }, { name: "Tchéquie", flag: "🇨🇿" },
  { name: "Turquie", flag: "🇹🇷" }, { name: "Écosse", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // CONMEBOL (6)
  { name: "Argentine", flag: "🇦🇷" }, { name: "Brésil", flag: "🇧🇷" },
  { name: "Colombie", flag: "🇨🇴" }, { name: "Équateur", flag: "🇪🇨" },
  { name: "Paraguay", flag: "🇵🇾" }, { name: "Uruguay", flag: "🇺🇾" },
  // CAF (10)
  { name: "Afrique du Sud", flag: "🇿🇦" }, { name: "Algérie", flag: "🇩🇿" },
  { name: "Cap-Vert", flag: "🇨🇻" }, { name: "Côte d'Ivoire", flag: "🇨🇮" },
  { name: "Égypte", flag: "🇪🇬" }, { name: "Ghana", flag: "🇬🇭" },
  { name: "Maroc", flag: "🇲🇦" }, { name: "RD Congo", flag: "🇨🇩" },
  { name: "Sénégal", flag: "🇸🇳" }, { name: "Tunisie", flag: "🇹🇳" },
  // AFC (9)
  { name: "Arabie Saoudite", flag: "🇸🇦" }, { name: "Australie", flag: "🇦🇺" },
  { name: "Corée du Sud", flag: "🇰🇷" }, { name: "Iran", flag: "🇮🇷" },
  { name: "Irak", flag: "🇮🇶" }, { name: "Japon", flag: "🇯🇵" },
  { name: "Jordanie", flag: "🇯🇴" }, { name: "Qatar", flag: "🇶🇦" },
  { name: "Ouzbékistan", flag: "🇺🇿" },
  // CONCACAF (6)
  { name: "Canada", flag: "🇨🇦" }, { name: "Curaçao", flag: "🇨🇼" },
  { name: "États-Unis", flag: "🇺🇸" }, { name: "Haïti", flag: "🇭🇹" },
  { name: "Mexique", flag: "🇲🇽" }, { name: "Panama", flag: "🇵🇦" },
  // OFC (1)
  { name: "Nouvelle-Zélande", flag: "🇳🇿" },
];

interface Player {
  id: string; name: string; team: string; team_flag: string; position: string;
}

interface Profile {
  display_name: string;
  favorite_team: string | null; favorite_team_flag: string | null;
  predicted_winner: string | null; predicted_winner_flag: string | null;
  predicted_top_scorer_id: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: prof }, { data: pl }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("players").select("*").order("team").order("name"),
      ]);
      if (prof) setProfile(prof as Profile);
      if (pl) setPlayers(pl as Player[]);
    }
    load();
  }, [supabase]);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;
    await supabase.from("profiles").update(profile).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); router.refresh(); }, 1500);
  }

  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => p ? { ...p, [key]: value } : p);
  }

  if (!profile) {
    return <div className="text-gray-400 dark:text-gray-600 text-sm">Chargement…</div>;
  }

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Mon profil</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Personnalisez votre expérience et faites vos pronostics de tournoi.</p>

      {/* Favorite team */}
      <Section title="Équipe favorite" sub="Affichée dans le header et sur votre profil.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEAMS.map((team) => (
            <button
              key={team.name}
              onClick={() => { setField("favorite_team", team.name); setField("favorite_team_flag", team.flag); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                profile.favorite_team === team.name
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 font-semibold shadow-sm"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-xl">{team.flag}</span>
              <span className="truncate">{team.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Predicted winner */}
      <Section title="🏆 Vainqueur de la Coupe du Monde" sub={<>Si cette équipe gagne le tournoi : <span className="font-bold text-emerald-600 dark:text-emerald-400">+20 points</span> à votre total. Ce choix est <span className="font-semibold">définitif</span> après le début du tournoi.</>}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEAMS.map((team) => (
            <button
              key={team.name}
              onClick={() => { setField("predicted_winner", team.name); setField("predicted_winner_flag", team.flag); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                profile.predicted_winner === team.name
                  ? "border-gold-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-semibold shadow-sm"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gold-300 dark:hover:border-gold-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-xl">{team.flag}</span>
              <span className="truncate">{team.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Top scorer */}
      <Section
        title="⚽ Meilleur buteur"
        sub={<><span className="font-bold text-emerald-600 dark:text-emerald-400">+2 points</span> à chaque but marqué · <span className="font-bold text-emerald-600 dark:text-emerald-400">+10 points</span> s&apos;il remporte le Soulier d&apos;Or</>}
        className="mb-8"
      >
        <input
          type="text"
          placeholder="Rechercher un joueur ou une équipe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {filteredPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => setField("predicted_top_scorer_id", player.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm border transition-all text-left ${
                profile.predicted_top_scorer_id === player.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 font-semibold"
                  : "border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-200 dark:hover:border-brand-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-xl">{player.team_flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-600">{player.team} · {player.position}</div>
              </div>
              {profile.predicted_top_scorer_id === player.id && (
                <span className="ml-auto text-brand-600 dark:text-brand-400 font-bold">✓</span>
              )}
            </button>
          ))}
          {filteredPlayers.length === 0 && (
            <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-4">Aucun joueur trouvé.</p>
          )}
        </div>
      </Section>

      <button
        onClick={save}
        disabled={saving}
        className={`w-full py-3 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 ${
          saved
            ? "bg-emerald-500 text-white"
            : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow"
        }`}
      >
        {saved ? "✓ Enregistré !" : saving ? "Enregistrement…" : "Sauvegarder le profil"}
      </button>
    </div>
  );
}

function Section({
  title, sub, children, className = "mb-5"
}: {
  title: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-6 ${className}`}>
      <h2 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{sub}</p>}
      {children}
    </section>
  );
}
