"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const TEAMS = [
  { name: "France", flag: "🇫🇷" },
  { name: "Argentine", flag: "🇦🇷" },
  { name: "Brésil", flag: "🇧🇷" },
  { name: "Angleterre", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Espagne", flag: "🇪🇸" },
  { name: "Allemagne", flag: "🇩🇪" },
  { name: "Pays-Bas", flag: "🇳🇱" },
  { name: "Belgique", flag: "🇧🇪" },
  { name: "États-Unis", flag: "🇺🇸" },
  { name: "Mexique", flag: "🇲🇽" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Colombie", flag: "🇨🇴" },
  { name: "Équateur", flag: "🇪🇨" },
  { name: "Chili", flag: "🇨🇱" },
  { name: "Pérou", flag: "🇵🇪" },
  { name: "Maroc", flag: "🇲🇦" },
  { name: "Sénégal", flag: "🇸🇳" },
  { name: "Côte d'Ivoire", flag: "🇨🇮" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Nigéria", flag: "🇳🇬" },
  { name: "Afrique du Sud", flag: "🇿🇦" },
  { name: "Cameroun", flag: "🇨🇲" },
  { name: "Angola", flag: "🇦🇴" },
  { name: "Tunisie", flag: "🇹🇳" },
  { name: "Japon", flag: "🇯🇵" },
  { name: "Corée du Sud", flag: "🇰🇷" },
  { name: "Arabie Saoudite", flag: "🇸🇦" },
  { name: "Irak", flag: "🇮🇶" },
  { name: "Iran", flag: "🇮🇷" },
  { name: "Australie", flag: "🇦🇺" },
  { name: "Nouvelle-Zélande", flag: "🇳🇿" },
  { name: "Indonésie", flag: "🇮🇩" },
  { name: "Chine", flag: "🇨🇳" },
  { name: "Thaïlande", flag: "🇹🇭" },
  { name: "Croatie", flag: "🇭🇷" },
  { name: "Italie", flag: "🇮🇹" },
  { name: "Serbie", flag: "🇷🇸" },
  { name: "Danemark", flag: "🇩🇰" },
  { name: "Suisse", flag: "🇨🇭" },
  { name: "Slovaquie", flag: "🇸🇰" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "Panama", flag: "🇵🇦" },
];

const AVATAR_COLORS = [
  "#0369a1", "#7c3aed", "#dc2626", "#d97706",
  "#059669", "#db2777", "#0891b2", "#65a30d",
];

interface Player {
  id: string;
  name: string;
  team: string;
  team_flag: string;
  position: string;
}

interface Profile {
  display_name: string;
  favorite_team: string | null;
  favorite_team_flag: string | null;
  avatar_color: string | null;
  predicted_winner: string | null;
  predicted_winner_flag: string | null;
  predicted_top_scorer_id: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

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
  }, []);

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
    return <div className="text-gray-400 text-sm">Chargement…</div>;
  }

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Mon profil</h1>
      <p className="text-gray-500 text-sm mb-8">Personnalisez votre expérience et faites vos pronostics de tournoi.</p>

      {/* Avatar color */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h2 className="font-semibold mb-4">Couleur de profil</h2>
        <div className="flex gap-3 flex-wrap">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setField("avatar_color", color)}
              style={{ backgroundColor: color }}
              className={`w-9 h-9 rounded-full transition-transform ${profile.avatar_color === color ? "ring-4 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
            />
          ))}
        </div>
      </section>

      {/* Favorite team */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h2 className="font-semibold mb-1">Équipe favorite</h2>
        <p className="text-xs text-gray-400 mb-4">Affichée dans le header et sur votre profil.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEAMS.map((team) => (
            <button
              key={team.name}
              onClick={() => { setField("favorite_team", team.name); setField("favorite_team_flag", team.flag); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
                profile.favorite_team === team.name
                  ? "border-brand-500 bg-brand-50 text-brand-700 font-semibold"
                  : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{team.flag}</span>
              <span className="truncate">{team.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Predicted winner */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h2 className="font-semibold mb-1">🏆 Vainqueur de la Coupe du Monde</h2>
        <p className="text-xs text-gray-400 mb-4">
          Si cette équipe gagne le tournoi : <span className="font-bold text-green-600">+20 points</span> à votre total.
          Ce choix est <span className="font-semibold">définitif</span> après le début du tournoi.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEAMS.map((team) => (
            <button
              key={team.name}
              onClick={() => { setField("predicted_winner", team.name); setField("predicted_winner_flag", team.flag); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
                profile.predicted_winner === team.name
                  ? "border-yellow-400 bg-yellow-50 text-yellow-800 font-semibold"
                  : "border-gray-200 hover:border-yellow-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{team.flag}</span>
              <span className="truncate">{team.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Predicted top scorer */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold mb-1">⚽ Meilleur buteur</h2>
        <p className="text-xs text-gray-400 mb-4">
          <span className="font-bold text-green-600">+2 points</span> à chaque but marqué par ce joueur ·{" "}
          <span className="font-bold text-green-600">+10 points</span> s&apos;il remporte le Soulier d&apos;Or.
        </p>
        <input
          type="text"
          placeholder="Rechercher un joueur ou une équipe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {filteredPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => setField("predicted_top_scorer_id", player.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition text-left ${
                profile.predicted_top_scorer_id === player.id
                  ? "border-brand-500 bg-brand-50 font-semibold"
                  : "border-gray-100 hover:border-brand-200 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{player.team_flag}</span>
              <div>
                <div className="font-medium">{player.name}</div>
                <div className="text-xs text-gray-400">{player.team} · {player.position}</div>
              </div>
              {profile.predicted_top_scorer_id === player.id && (
                <span className="ml-auto text-brand-600">✓</span>
              )}
            </button>
          ))}
          {filteredPlayers.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Aucun joueur trouvé.</p>
          )}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition disabled:opacity-50 text-lg"
      >
        {saved ? "✓ Enregistré !" : saving ? "Enregistrement…" : "Sauvegarder le profil"}
      </button>
    </div>
  );
}
