export const TEAM_FLAGS: Record<string, string> = {
  // Groupe A
  "Mexique": "🇲🇽", "Afrique du Sud": "🇿🇦", "Corée du Sud": "🇰🇷", "Tchéquie": "🇨🇿",
  // Groupe B
  "Canada": "🇨🇦", "Bosnie-Herzégovine": "🇧🇦", "Qatar": "🇶🇦", "Suisse": "🇨🇭",
  // Groupe C
  "Écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Brésil": "🇧🇷", "Maroc": "🇲🇦", "Haïti": "🇭🇹",
  // Groupe D
  "États-Unis": "🇺🇸", "Paraguay": "🇵🇾", "Australie": "🇦🇺", "Turquie": "🇹🇷",
  // Groupe E
  "Équateur": "🇪🇨", "Allemagne": "🇩🇪", "Curaçao": "🇨🇼", "Côte d'Ivoire": "🇨🇮",
  // Groupe F
  "Japon": "🇯🇵", "Suède": "🇸🇪", "Tunisie": "🇹🇳", "Pays-Bas": "🇳🇱",
  // Groupe G
  "Belgique": "🇧🇪", "Égypte": "🇪🇬", "Iran": "🇮🇷", "Nouvelle-Zélande": "🇳🇿",
  // Groupe H
  "Espagne": "🇪🇸", "Cap-Vert": "🇨🇻", "Arabie Saoudite": "🇸🇦", "Uruguay": "🇺🇾",
  // Groupe I
  "France": "🇫🇷", "Sénégal": "🇸🇳", "Irak": "🇮🇶", "Norvège": "🇳🇴",
  // Groupe J
  "Argentine": "🇦🇷", "Algérie": "🇩🇿", "Autriche": "🇦🇹", "Jordanie": "🇯🇴",
  // Groupe K
  "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "Ouzbékistan": "🇺🇿", "Colombie": "🇨🇴",
  // Groupe L
  "Angleterre": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatie": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
};

export function flag(team: string): string {
  return TEAM_FLAGS[team] ?? "🏳️";
}
