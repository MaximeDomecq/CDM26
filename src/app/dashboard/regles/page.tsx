export const metadata = { title: "Règles du jeu — CDM 2026" };

export default function ReglesPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Règles du jeu</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500">Comment fonctionne le système de points CDM 2026</p>
      </div>

      {/* Phase de groupes */}
      <Section title="⚽ Phase de groupes" color="blue">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Pronostique le score exact de chaque match. Les points dépendent de la précision de ton pronostic :
        </p>
        <div className="space-y-2">
          <TierRow tier="Score exact" pts="5 pts" color="emerald" desc="Score parfait (ex. 2-1 pronostiqué, 2-1 réel)" />
          <TierRow tier="Différence de buts" pts="3 pts" color="blue" desc="Même écart entre les équipes (ex. +1 pronostiqué et réel)" />
          <TierRow tier="Vainqueur correct" pts="2 pts" color="sky" desc="Bonne équipe gagnante, mauvais écart" />
          <TierRow tier="Total de buts" pts="1 pt" color="amber" desc="Même nombre de buts au total, mauvais résultat" />
          <TierRow tier="Raté" pts="0 pt" color="gray" desc="Aucun des critères ci-dessus" />
        </div>
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
            Bonus score unique : si tu es le seul à avoir trouvé le score exact, tu gagnes +2 pts supplémentaires.
          </p>
        </div>
      </Section>

      {/* Phase éliminatoire */}
      <Section title="🏆 Phase éliminatoire" color="purple">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          À partir des 8e de finale, les pronostics se font en 3 étapes :
        </p>

        <div className="space-y-4">
          <Step num="1" label="Équipe qualifiée" pts="2 pts">
            Choisis l&apos;équipe qui passe au tour suivant. Bonne réponse = 2 pts.
          </Step>

          <Step num="2" label="Contexte" pts="1 pt">
            <p>Comment le match se termine :</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><span className="font-bold text-gray-900 dark:text-white">90 min</span> — victoire ou nul à 90 minutes (prolongations possibles, mais tu paries sur le score à 90 min). Les nuls ne sont pas autorisés ici car l&apos;un des équipes doit avancer.</li>
              <li><span className="font-bold text-gray-900 dark:text-white">+ (prolongations)</span> — égalité à 90 min, décision aux prolongations ou aux tirs au but. Tu pronostiques le score à <span className="font-bold">120 min</span> (victoires et nuls possibles).</li>
            </ul>
          </Step>

          <Step num="3" label="Score" pts="3 / 2 / 1 / 0 pt">
            <p>Même grille que la phase de groupes, mais appliquée au bon temps :</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-500">
              <li>• Contexte <span className="font-bold">90 min</span> → score comparé au score à 90 min</li>
              <li>• Contexte <span className="font-bold">+</span> → score comparé au score à 120 min</li>
              <li>• Un pronostic 90 min ne rapporte jamais de points sur un score 120 min, et vice versa.</li>
            </ul>
          </Step>
        </div>

        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-xl">
          <p className="text-xs font-semibold text-purple-800 dark:text-purple-400">
            Maximum : 2 + 1 + 3 = 6 pts par match éliminatoire (hors bonus ×2/×3).
          </p>
        </div>
      </Section>

      {/* Bonus multiplicateurs */}
      <Section title="⚡ Bonus ×2 et ×3" color="orange">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Tu disposes de <span className="font-bold text-gray-900 dark:text-white">3 bonus</span> à placer sur les matchs de ton choix, pour toute la compétition :
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-xl text-center">
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400">×2</div>
            <div className="text-xs font-semibold text-orange-700 dark:text-orange-500 mt-1">2 bonus disponibles</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Double les points du match</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-center">
            <div className="text-2xl font-black text-red-600 dark:text-red-400">×3</div>
            <div className="text-xs font-semibold text-red-700 dark:text-red-500 mt-1">1 bonus disponible</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Triple les points du match</div>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-500">
          <li>• Un seul bonus par match</li>
          <li>• Peut être placé sur n&apos;importe quel match (groupes ou éliminatoires)</li>
          <li>• Modifiable tant que le match n&apos;a pas commencé</li>
          <li>• Si le score est 0 pt, le bonus ne change rien</li>
        </ul>
      </Section>

      {/* Pronostics tournoi */}
      <Section title="🌟 Pronostics de tournoi" color="gold">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🏅</span>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">Vainqueur du tournoi — 20 pts</div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Bonne équipe championne du monde = 20 pts bonus à la fin de la compétition.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">👟</span>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">Meilleur buteur — jusqu&apos;à 10 pts</div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Points basés sur le nombre de buts du joueur que tu as choisi. Le gagnant du Soulier d&apos;Or rapporte un bonus supplémentaire.</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const border: Record<string, string> = {
    blue: "border-blue-200 dark:border-blue-800/40",
    purple: "border-purple-200 dark:border-purple-800/40",
    orange: "border-orange-200 dark:border-orange-800/40",
    gold: "border-yellow-200 dark:border-yellow-800/40",
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-card p-6 ${border[color] ?? "border-gray-100 dark:border-gray-800"}`}>
      <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

function TierRow({ tier, pts, color, desc }: { tier: string; pts: string; color: string; desc: string }) {
  const badge: Record<string, string> = {
    emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
    sky: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400",
    amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
    gray: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500",
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge[color] ?? ""}`}>{tier}</span>
          <span className="font-black text-sm text-gray-900 dark:text-white flex-shrink-0">{pts}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function Step({ num, label, pts, children }: { num: string; label: string; pts: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-sm text-gray-900 dark:text-white">{label}</span>
          <span className="text-xs font-black text-purple-600 dark:text-purple-400">{pts}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{children}</div>
      </div>
    </div>
  );
}
