import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";

export const revalidate = 60;

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user!.id);

  const predictionMap = new Map(
    (predictions ?? []).map((p) => [p.match_id, p])
  );

  const now = new Date();

  const grouped = (matches ?? []).reduce(
    (acc: Record<string, typeof matches>, match) => {
      const phase = match!.phase ?? "Groupe";
      if (!acc[phase]) acc[phase] = [];
      acc[phase]!.push(match);
      return acc;
    },
    {}
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Matchs & Pronostics</h1>
      {Object.entries(grouped).map(([phase, phaseMatches]) => (
        <section key={phase} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {phase}
          </h2>
          <div className="flex flex-col gap-3">
            {phaseMatches!.map((match) => (
              <MatchCard
                key={match!.id}
                match={match!}
                prediction={predictionMap.get(match!.id) ?? null}
                locked={new Date(match!.kickoff_at) <= now}
                userId={user!.id}
              />
            ))}
          </div>
        </section>
      ))}
      {(!matches || matches.length === 0) && (
        <p className="text-gray-400 text-sm">Les matchs seront disponibles bientôt.</p>
      )}
    </div>
  );
}
