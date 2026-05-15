import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const players = [
  // France
  { name: "Kylian Mbappé", team: "France", team_flag: "🇫🇷", position: "Attaquant" },
  { name: "Antoine Griezmann", team: "France", team_flag: "🇫🇷", position: "Attaquant" },
  // Argentine
  { name: "Lionel Messi", team: "Argentine", team_flag: "🇦🇷", position: "Attaquant" },
  { name: "Lautaro Martínez", team: "Argentine", team_flag: "🇦🇷", position: "Attaquant" },
  { name: "Julián Álvarez", team: "Argentine", team_flag: "🇦🇷", position: "Attaquant" },
  // Brésil
  { name: "Vinicius Jr.", team: "Brésil", team_flag: "🇧🇷", position: "Attaquant" },
  { name: "Rodrygo", team: "Brésil", team_flag: "🇧🇷", position: "Attaquant" },
  { name: "Endrick", team: "Brésil", team_flag: "🇧🇷", position: "Attaquant" },
  // Angleterre
  { name: "Harry Kane", team: "Angleterre", team_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", position: "Attaquant" },
  { name: "Bukayo Saka", team: "Angleterre", team_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", position: "Attaquant" },
  { name: "Jude Bellingham", team: "Angleterre", team_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", position: "Milieu" },
  // Portugal
  { name: "Cristiano Ronaldo", team: "Portugal", team_flag: "🇵🇹", position: "Attaquant" },
  { name: "Rafael Leão", team: "Portugal", team_flag: "🇵🇹", position: "Attaquant" },
  { name: "Bernardo Silva", team: "Portugal", team_flag: "🇵🇹", position: "Milieu" },
  // Espagne
  { name: "Álvaro Morata", team: "Espagne", team_flag: "🇪🇸", position: "Attaquant" },
  { name: "Pedri", team: "Espagne", team_flag: "🇪🇸", position: "Milieu" },
  { name: "Lamine Yamal", team: "Espagne", team_flag: "🇪🇸", position: "Attaquant" },
  // Allemagne
  { name: "Kai Havertz", team: "Allemagne", team_flag: "🇩🇪", position: "Attaquant" },
  { name: "Florian Wirtz", team: "Allemagne", team_flag: "🇩🇪", position: "Milieu" },
  { name: "Jamal Musiala", team: "Allemagne", team_flag: "🇩🇪", position: "Milieu" },
  // Pays-Bas
  { name: "Memphis Depay", team: "Pays-Bas", team_flag: "🇳🇱", position: "Attaquant" },
  { name: "Cody Gakpo", team: "Pays-Bas", team_flag: "🇳🇱", position: "Attaquant" },
  // Belgique
  { name: "Romelu Lukaku", team: "Belgique", team_flag: "🇧🇪", position: "Attaquant" },
  { name: "Lois Openda", team: "Belgique", team_flag: "🇧🇪", position: "Attaquant" },
  // États-Unis
  { name: "Christian Pulisic", team: "États-Unis", team_flag: "🇺🇸", position: "Attaquant" },
  { name: "Folarin Balogun", team: "États-Unis", team_flag: "🇺🇸", position: "Attaquant" },
  // Mexique
  { name: "Hirving Lozano", team: "Mexique", team_flag: "🇲🇽", position: "Attaquant" },
  { name: "Santiago Giménez", team: "Mexique", team_flag: "🇲🇽", position: "Attaquant" },
  // Uruguay
  { name: "Darwin Núñez", team: "Uruguay", team_flag: "🇺🇾", position: "Attaquant" },
  { name: "Federico Valverde", team: "Uruguay", team_flag: "🇺🇾", position: "Milieu" },
  // Colombie
  { name: "Luis Díaz", team: "Colombie", team_flag: "🇨🇴", position: "Attaquant" },
  { name: "James Rodríguez", team: "Colombie", team_flag: "🇨🇴", position: "Milieu" },
  // Maroc
  { name: "Youssef En-Nesyri", team: "Maroc", team_flag: "🇲🇦", position: "Attaquant" },
  { name: "Hakim Ziyech", team: "Maroc", team_flag: "🇲🇦", position: "Milieu" },
  // Sénégal
  { name: "Sadio Mané", team: "Sénégal", team_flag: "🇸🇳", position: "Attaquant" },
  // Japon
  { name: "Takumi Minamino", team: "Japon", team_flag: "🇯🇵", position: "Attaquant" },
  { name: "Kaoru Mitoma", team: "Japon", team_flag: "🇯🇵", position: "Attaquant" },
  // Corée du Sud
  { name: "Son Heung-min", team: "Corée du Sud", team_flag: "🇰🇷", position: "Attaquant" },
  // Italie
  { name: "Gianluca Scamacca", team: "Italie", team_flag: "🇮🇹", position: "Attaquant" },
  { name: "Federico Chiesa", team: "Italie", team_flag: "🇮🇹", position: "Attaquant" },
  // Croatie
  { name: "Luka Modrić", team: "Croatie", team_flag: "🇭🇷", position: "Milieu" },
  { name: "Ivan Perišić", team: "Croatie", team_flag: "🇭🇷", position: "Attaquant" },
];

async function seed() {
  console.log(`Seeding ${players.length} players...`);
  const { error } = await supabase
    .from("players")
    .upsert(players, { onConflict: "name" });

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log("Done! Players seeded.");
}

seed();
