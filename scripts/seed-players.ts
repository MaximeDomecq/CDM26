import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const players = [
  // UEFA
  // France
  { name: "Kylian Mbappé", team: "France", team_flag: "🇫🇷", position: "Attaquant" },
  { name: "Michael Olise", team: "France", team_flag: "🇫🇷", position: "Attaquant" },
  { name: "Ousmane Dembélé", team: "France", team_flag: "🇫🇷", position: "Attaquant" },
  // Angleterre
  { name: "Harry Kane", team: "Angleterre", team_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", position: "Attaquant" },
  { name: "Bukayo Saka", team: "Angleterre", team_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", position: "Attaquant" },
  { name: "Jude Bellingham", team: "Angleterre", team_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", position: "Milieu" },
  { name: "Phil Foden", team: "Angleterre", team_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", position: "Milieu" },
  // Portugal
  { name: "Cristiano Ronaldo", team: "Portugal", team_flag: "🇵🇹", position: "Attaquant" },
  { name: "Rafael Leão", team: "Portugal", team_flag: "🇵🇹", position: "Attaquant" },
  { name: "Bernardo Silva", team: "Portugal", team_flag: "🇵🇹", position: "Milieu" },
  { name: "Bruno Fernandes", team: "Portugal", team_flag: "🇵🇹", position: "Milieu" },
  // Espagne
  { name: "Álvaro Morata", team: "Espagne", team_flag: "🇪🇸", position: "Attaquant" },
  { name: "Pedri", team: "Espagne", team_flag: "🇪🇸", position: "Milieu" },
  { name: "Lamine Yamal", team: "Espagne", team_flag: "🇪🇸", position: "Attaquant" },
  { name: "Nico Williams", team: "Espagne", team_flag: "🇪🇸", position: "Attaquant" },
  // Allemagne
  { name: "Kai Havertz", team: "Allemagne", team_flag: "🇩🇪", position: "Attaquant" },
  { name: "Florian Wirtz", team: "Allemagne", team_flag: "🇩🇪", position: "Milieu" },
  { name: "Jamal Musiala", team: "Allemagne", team_flag: "🇩🇪", position: "Milieu" },
  // Pays-Bas
  { name: "Cody Gakpo", team: "Pays-Bas", team_flag: "🇳🇱", position: "Attaquant" },
  { name: "Donyell Malen", team: "Pays-Bas", team_flag: "🇳🇱", position: "Attaquant" },
  { name: "Tijjani Reijnders", team: "Pays-Bas", team_flag: "🇳🇱", position: "Milieu" },
  // Belgique
  { name: "Romelu Lukaku", team: "Belgique", team_flag: "🇧🇪", position: "Attaquant" },
  { name: "Lois Openda", team: "Belgique", team_flag: "🇧🇪", position: "Attaquant" },
  { name: "Kevin De Bruyne", team: "Belgique", team_flag: "🇧🇪", position: "Milieu" },
  // Croatie
  { name: "Luka Modrić", team: "Croatie", team_flag: "🇭🇷", position: "Milieu" },
  { name: "Ivan Perišić", team: "Croatie", team_flag: "🇭🇷", position: "Attaquant" },
  { name: "Andrej Kramarić", team: "Croatie", team_flag: "🇭🇷", position: "Attaquant" },
  // Suisse
  { name: "Granit Xhaka", team: "Suisse", team_flag: "🇨🇭", position: "Milieu" },
  { name: "Breel Embolo", team: "Suisse", team_flag: "🇨🇭", position: "Attaquant" },
  // Turquie
  { name: "Arda Güler", team: "Turquie", team_flag: "🇹🇷", position: "Milieu" },
  { name: "Hakan Çalhanoğlu", team: "Turquie", team_flag: "🇹🇷", position: "Milieu" },
  // Autriche
  { name: "Marcel Sabitzer", team: "Autriche", team_flag: "🇦🇹", position: "Milieu" },
  { name: "Michael Gregoritsch", team: "Autriche", team_flag: "🇦🇹", position: "Attaquant" },
  // Norvège
  { name: "Erling Haaland", team: "Norvège", team_flag: "🇳🇴", position: "Attaquant" },
  { name: "Martin Ødegaard", team: "Norvège", team_flag: "🇳🇴", position: "Milieu" },
  // Écosse
  { name: "Scott McTominay", team: "Écosse", team_flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", position: "Milieu" },
  { name: "Che Adams", team: "Écosse", team_flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", position: "Attaquant" },
  // Suède
  { name: "Viktor Gyökeres", team: "Suède", team_flag: "🇸🇪", position: "Attaquant" },
  { name: "Dejan Kulusevski", team: "Suède", team_flag: "🇸🇪", position: "Attaquant" },
  // Tchéquie
  { name: "Tomáš Souček", team: "Tchéquie", team_flag: "🇨🇿", position: "Milieu" },
  { name: "Patrik Schick", team: "Tchéquie", team_flag: "🇨🇿", position: "Attaquant" },
  // Bosnie-Herzégovine
  { name: "Edin Džeko", team: "Bosnie-Herzégovine", team_flag: "🇧🇦", position: "Attaquant" },

  // CONMEBOL
  // Argentine
  { name: "Lionel Messi", team: "Argentine", team_flag: "🇦🇷", position: "Attaquant" },
  { name: "Lautaro Martínez", team: "Argentine", team_flag: "🇦🇷", position: "Attaquant" },
  { name: "Julián Álvarez", team: "Argentine", team_flag: "🇦🇷", position: "Attaquant" },
  { name: "Rodrigo De Paul", team: "Argentine", team_flag: "🇦🇷", position: "Milieu" },
  // Brésil
  { name: "Vinicius Jr.", team: "Brésil", team_flag: "🇧🇷", position: "Attaquant" },
  { name: "Rodrygo", team: "Brésil", team_flag: "🇧🇷", position: "Attaquant" },
  { name: "Endrick", team: "Brésil", team_flag: "🇧🇷", position: "Attaquant" },
  { name: "Raphinha", team: "Brésil", team_flag: "🇧🇷", position: "Attaquant" },
  // Colombie
  { name: "Luis Díaz", team: "Colombie", team_flag: "🇨🇴", position: "Attaquant" },
  { name: "James Rodríguez", team: "Colombie", team_flag: "🇨🇴", position: "Milieu" },
  { name: "Jhon Durán", team: "Colombie", team_flag: "🇨🇴", position: "Attaquant" },
  // Uruguay
  { name: "Darwin Núñez", team: "Uruguay", team_flag: "🇺🇾", position: "Attaquant" },
  { name: "Federico Valverde", team: "Uruguay", team_flag: "🇺🇾", position: "Milieu" },
  // Équateur
  { name: "Enner Valencia", team: "Équateur", team_flag: "🇪🇨", position: "Attaquant" },
  // Paraguay
  { name: "Miguel Almirón", team: "Paraguay", team_flag: "🇵🇾", position: "Milieu" },
  { name: "Antonio Sanabria", team: "Paraguay", team_flag: "🇵🇾", position: "Attaquant" },

  // CAF
  // Maroc
  { name: "Youssef En-Nesyri", team: "Maroc", team_flag: "🇲🇦", position: "Attaquant" },
  { name: "Hakim Ziyech", team: "Maroc", team_flag: "🇲🇦", position: "Milieu" },
  { name: "Achraf Hakimi", team: "Maroc", team_flag: "🇲🇦", position: "Défenseur" },
  // Sénégal
  { name: "Sadio Mané", team: "Sénégal", team_flag: "🇸🇳", position: "Attaquant" },
  { name: "Nicolas Jackson", team: "Sénégal", team_flag: "🇸🇳", position: "Attaquant" },
  // Côte d'Ivoire
  { name: "Sébastien Haller", team: "Côte d'Ivoire", team_flag: "🇨🇮", position: "Attaquant" },
  { name: "Franck Kessié", team: "Côte d'Ivoire", team_flag: "🇨🇮", position: "Milieu" },
  // Égypte
  { name: "Mohamed Salah", team: "Égypte", team_flag: "🇪🇬", position: "Attaquant" },
  { name: "Mostafa Mohamed", team: "Égypte", team_flag: "🇪🇬", position: "Attaquant" },
  // Ghana
  { name: "Jordan Ayew", team: "Ghana", team_flag: "🇬🇭", position: "Attaquant" },
  { name: "Mohammed Kudus", team: "Ghana", team_flag: "🇬🇭", position: "Milieu" },
  // Algérie
  { name: "Riyad Mahrez", team: "Algérie", team_flag: "🇩🇿", position: "Attaquant" },
  { name: "Islam Slimani", team: "Algérie", team_flag: "🇩🇿", position: "Attaquant" },
  // Tunisie
  { name: "Youssef Msakni", team: "Tunisie", team_flag: "🇹🇳", position: "Attaquant" },
  { name: "Hannibal Mejbri", team: "Tunisie", team_flag: "🇹🇳", position: "Milieu" },
  // Afrique du Sud
  { name: "Percy Tau", team: "Afrique du Sud", team_flag: "🇿🇦", position: "Attaquant" },
  { name: "Themba Zwane", team: "Afrique du Sud", team_flag: "🇿🇦", position: "Attaquant" },
  // RD Congo
  { name: "Cédric Bakambu", team: "RD Congo", team_flag: "🇨🇩", position: "Attaquant" },
  { name: "Chancel Mbemba", team: "RD Congo", team_flag: "🇨🇩", position: "Défenseur" },
  // Cap-Vert
  { name: "Garry Rodrigues", team: "Cap-Vert", team_flag: "🇨🇻", position: "Attaquant" },
  { name: "Júlio Tavares", team: "Cap-Vert", team_flag: "🇨🇻", position: "Attaquant" },

  // AFC
  // Japon
  { name: "Kaoru Mitoma", team: "Japon", team_flag: "🇯🇵", position: "Attaquant" },
  { name: "Takefusa Kubo", team: "Japon", team_flag: "🇯🇵", position: "Attaquant" },
  { name: "Ritsu Doan", team: "Japon", team_flag: "🇯🇵", position: "Attaquant" },
  // Corée du Sud
  { name: "Son Heung-min", team: "Corée du Sud", team_flag: "🇰🇷", position: "Attaquant" },
  { name: "Lee Kang-in", team: "Corée du Sud", team_flag: "🇰🇷", position: "Milieu" },
  // Iran
  { name: "Mehdi Taremi", team: "Iran", team_flag: "🇮🇷", position: "Attaquant" },
  { name: "Sardar Azmoun", team: "Iran", team_flag: "🇮🇷", position: "Attaquant" },
  // Arabie Saoudite
  { name: "Salem Al-Dawsari", team: "Arabie Saoudite", team_flag: "🇸🇦", position: "Attaquant" },
  { name: "Firas Al-Buraikan", team: "Arabie Saoudite", team_flag: "🇸🇦", position: "Attaquant" },
  // Irak
  { name: "Mohanad Ali", team: "Irak", team_flag: "🇮🇶", position: "Attaquant" },
  { name: "Amjad Attwan", team: "Irak", team_flag: "🇮🇶", position: "Milieu" },
  // Australie
  { name: "Mathew Leckie", team: "Australie", team_flag: "🇦🇺", position: "Attaquant" },
  { name: "Mitchell Duke", team: "Australie", team_flag: "🇦🇺", position: "Attaquant" },
  // Qatar
  { name: "Akram Afif", team: "Qatar", team_flag: "🇶🇦", position: "Attaquant" },
  { name: "Almoez Ali", team: "Qatar", team_flag: "🇶🇦", position: "Attaquant" },
  // Jordanie
  { name: "Yazan Al-Naimat", team: "Jordanie", team_flag: "🇯🇴", position: "Attaquant" },
  { name: "Ahmad Dababneh", team: "Jordanie", team_flag: "🇯🇴", position: "Milieu" },
  // Ouzbékistan
  { name: "Eldor Shomurodov", team: "Ouzbékistan", team_flag: "🇺🇿", position: "Attaquant" },
  { name: "Jasur Yakhshiboev", team: "Ouzbékistan", team_flag: "🇺🇿", position: "Attaquant" },

  // CONCACAF
  // États-Unis
  { name: "Christian Pulisic", team: "États-Unis", team_flag: "🇺🇸", position: "Attaquant" },
  { name: "Folarin Balogun", team: "États-Unis", team_flag: "🇺🇸", position: "Attaquant" },
  { name: "Gio Reyna", team: "États-Unis", team_flag: "🇺🇸", position: "Milieu" },
  // Mexique
  { name: "Hirving Lozano", team: "Mexique", team_flag: "🇲🇽", position: "Attaquant" },
  { name: "Santiago Giménez", team: "Mexique", team_flag: "🇲🇽", position: "Attaquant" },
  { name: "Henry Martín", team: "Mexique", team_flag: "🇲🇽", position: "Attaquant" },
  // Canada
  { name: "Alphonso Davies", team: "Canada", team_flag: "🇨🇦", position: "Défenseur" },
  { name: "Jonathan David", team: "Canada", team_flag: "🇨🇦", position: "Attaquant" },
  { name: "Cyle Larin", team: "Canada", team_flag: "🇨🇦", position: "Attaquant" },
  // Panama
  { name: "Ismael Díaz", team: "Panama", team_flag: "🇵🇦", position: "Attaquant" },
  { name: "Cecilio Waterman", team: "Panama", team_flag: "🇵🇦", position: "Attaquant" },
  // Haïti
  { name: "Frantzdy Pierrot", team: "Haïti", team_flag: "🇭🇹", position: "Attaquant" },
  // Curaçao
  { name: "Leandro Bacuna", team: "Curaçao", team_flag: "🇨🇼", position: "Milieu" },
  { name: "Jarchinio Antonia", team: "Curaçao", team_flag: "🇨🇼", position: "Attaquant" },

  // OFC
  // Nouvelle-Zélande
  { name: "Chris Wood", team: "Nouvelle-Zélande", team_flag: "🇳🇿", position: "Attaquant" },
  { name: "Liberato Cacace", team: "Nouvelle-Zélande", team_flag: "🇳🇿", position: "Défenseur" },
];

async function seed() {
  console.log("Deleting existing players...");
  const { error: delErr } = await supabase.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) {
    console.error("Error deleting:", delErr.message);
    process.exit(1);
  }

  console.log(`Seeding ${players.length} players...`);
  const { error } = await supabase.from("players").insert(players);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log("Done! Players seeded.");
}

seed();
