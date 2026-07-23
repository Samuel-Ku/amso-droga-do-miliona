export const PLAYER_NAME_POLICY_VERSION = "2026-07-23.1";

export type PlayerNameModerationCategory =
  | "format"
  | "profanity"
  | "discrimination"
  | "sexual"
  | "violence"
  | "extremism"
  | "impersonation"
  | "competitor"
  | "marketplace"
  | "contact"
  | "advertising";

export interface PlayerNamePhraseCategory {
  category: PlayerNameModerationCategory;
  phrases: readonly string[];
}

export const PLAYER_NAME_BLOCKED_PHRASES: readonly PlayerNamePhraseCategory[] = Object.freeze([
  {
    category: "impersonation",
    phrases: Object.freeze([
      "AMSO",
      "AMSO.pl",
      "Selkea",
      "Triadyn",
      "AMSO Team",
      "AMSO Official",
      "official",
      "oficjalny",
      "admin",
      "administrator",
      "moderator",
      "support",
      "customer support",
      "obsługa klienta",
      "biuro obsługi"
    ])
  },
  {
    category: "competitor",
    phrases: Object.freeze([
      "Shoplet",
      "AG.pl",
      "Computer Alliance",
      "x-kom",
      "xkom",
      "x-kom.pl",
      "Komputronik",
      "komputronik.pl",
      "Morele",
      "Media Expert",
      "mediaexpert",
      "RTV Euro AGD",
      "rtveuroagd",
      "OleOle",
      "Sferis",
      "MediaMarkt"
    ])
  },
  {
    category: "marketplace",
    phrases: Object.freeze(["Allegro", "OLX", "Amazon", "eBay"])
  },
  {
    category: "profanity",
    phrases: Object.freeze([
      "kurwa",
      "chuj",
      "pizda",
      "pierdol",
      "jebac",
      "jebać",
      "fuck",
      "shit",
      "bitch",
      "cunt",
      "motherfucker"
    ])
  },
  {
    category: "discrimination",
    phrases: Object.freeze([
      "nigger",
      "kike",
      "faggot",
      "retard",
      "czarnuch",
      "pedał",
      "pedal"
    ])
  },
  {
    category: "sexual",
    phrases: Object.freeze(["porn", "porno", "sex", "seks", "xxx"])
  },
  {
    category: "violence",
    phrases: Object.freeze([
      "kill",
      "murder",
      "zabije",
      "zabiję",
      "zabic",
      "zabić",
      "bomb threat"
    ])
  },
  {
    category: "extremism",
    phrases: Object.freeze(["nazi", "heil hitler", "isis", "white power"])
  },
  {
    category: "advertising",
    phrases: Object.freeze(["promocja", "kod rabatowy", "kup teraz", "buy now"])
  }
]);

export const PLAYER_NAME_COMPACT_ALIASES = Object.freeze([
  "amso",
  "amsopl",
  "amsoteam",
  "amsoofficial",
  "agpl",
  "xkom",
  "xkompl",
  "komputronikpl",
  "mediaexpert",
  "rtveuroagd"
]);

export const PLAYER_NAME_ALLOWED_MANUFACTURERS = Object.freeze([
  "Dell",
  "Lenovo",
  "HP",
  "Apple",
  "Acer",
  "ASUS",
  "Samsung",
  "Microsoft",
  "Intel",
  "AMD",
  "NVIDIA"
]);

export const PLAYER_NAME_EXCEPTIONS = Object.freeze([
  "Amazonka",
  "Administratorzy"
]);

export const PLAYER_NAME_RISK_PATTERNS = Object.freeze([
  {
    category: "contact" as const,
    pattern: /(?:https?:\/\/|www\.)/iu
  },
  {
    category: "contact" as const,
    pattern: /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/iu
  },
  {
    category: "contact" as const,
    pattern: /(?:^|[^\p{L}\p{N}])@[a-z0-9_]{2,}/iu
  },
  {
    category: "contact" as const,
    pattern: /\+?\d[\d(). -]{6,}/u
  },
  {
    category: "contact" as const,
    pattern: /\b[\p{L}\p{N}-]+\.(?:pl|com|eu|net|org)\b/iu
  }
]);

export const PLAYER_NAME_HOMOGLYPHS: Readonly<Record<string, string>> = Object.freeze({
  "а": "a",
  "е": "e",
  "ё": "e",
  "і": "i",
  "ј": "j",
  "к": "k",
  "м": "m",
  "о": "o",
  "р": "p",
  "с": "c",
  "т": "t",
  "у": "y",
  "х": "x",
  "α": "a",
  "ε": "e",
  "ι": "i",
  "κ": "k",
  "μ": "m",
  "ν": "v",
  "ο": "o",
  "ρ": "p",
  "τ": "t",
  "υ": "y",
  "χ": "x"
});
