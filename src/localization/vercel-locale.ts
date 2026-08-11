import {
  CAMPAIGN_LOCALES,
  type CampaignLocale
} from "./index";

export const VERCEL_LOCALE_STORAGE_KEY = "amso-million-runner-locale";

export const VERCEL_LANGUAGE_OPTIONS: ReadonlyArray<{
  readonly locale: CampaignLocale;
  readonly flag: string;
  readonly label: string;
}> = Object.freeze([
  { locale: "pl", flag: "🇵🇱", label: "Polski" },
  { locale: "de", flag: "🇩🇪", label: "Deutsch" },
  { locale: "en", flag: "🇬🇧", label: "English" },
  { locale: "es", flag: "🇪🇸", label: "Español" },
  { locale: "cs", flag: "🇨🇿", label: "Čeština" },
  { locale: "it", flag: "🇮🇹", label: "Italiano" },
  { locale: "fr", flag: "🇫🇷", label: "Français" },
  { locale: "uk", flag: "🇺🇦", label: "Українська" }
]);

export const VERCEL_LANGUAGE_SELECTOR_LABELS: Readonly<Record<CampaignLocale, string>> =
  Object.freeze({
    pl: "Zmień język",
    de: "Sprache ändern",
    en: "Change language",
    es: "Cambiar idioma",
    cs: "Změnit jazyk",
    it: "Cambia lingua",
    fr: "Changer de langue",
    uk: "Змінити мову"
  });

const SUPPORTED_LOCALES = new Set<string>(CAMPAIGN_LOCALES);

interface LanguageNavigator {
  readonly languages?: readonly string[];
  readonly language?: string;
}

interface LocaleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function supportedLocale(value: string | null | undefined): CampaignLocale | null {
  const base = value?.trim().toLowerCase().split("-")[0] ?? "";
  return SUPPORTED_LOCALES.has(base) ? base as CampaignLocale : null;
}

export function vercelCampaignLocaleFromUrl(currentUrl: string): CampaignLocale | null {
  return supportedLocale(new URL(currentUrl).searchParams.get("lang"));
}

export function detectVercelCampaignLocale(
  userLanguages: readonly string[],
  persistedLocale: string | null,
  requestedLocale: string | null = null
): CampaignLocale {
  const requested = supportedLocale(requestedLocale);
  if (requested !== null) return requested;
  const persisted = supportedLocale(persistedLocale);
  if (persisted !== null) return persisted;
  for (const language of userLanguages) {
    const locale = supportedLocale(language);
    if (locale !== null) return locale;
  }
  return "en";
}

export function applyVercelCampaignLocale(
  documentReference: Document,
  navigatorReference: LanguageNavigator,
  storage: LocaleStorage | null,
  requestedLocale: string | null = null
): CampaignLocale {
  let persistedLocale: string | null = null;
  try {
    persistedLocale = storage?.getItem(VERCEL_LOCALE_STORAGE_KEY) ?? null;
  } catch {
    // Storage can be disabled; browser language detection still works.
  }
  const languages = navigatorReference.languages?.length
    ? navigatorReference.languages
    : navigatorReference.language ? [navigatorReference.language] : [];
  const locale = detectVercelCampaignLocale(languages, persistedLocale, requestedLocale);
  documentReference.documentElement.lang = locale;
  return locale;
}

export function persistVercelCampaignLocale(
  locale: CampaignLocale,
  storage: LocaleStorage | null
): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(VERCEL_LOCALE_STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}

export function safeVercelLocaleStorage(
  windowReference: { readonly localStorage: Storage }
): Storage | null {
  try {
    return windowReference.localStorage;
  } catch {
    return null;
  }
}

export function vercelLocaleSelectionUrl(
  currentUrl: string,
  locale: CampaignLocale
): string {
  const url = new URL(currentUrl);
  url.searchParams.set("lang", locale);
  return url.href;
}

export function vercelCampaignUrl(locale: CampaignLocale): string {
  const url = new URL("https://game.amso.pl/");
  url.searchParams.set("lang", locale);
  return url.href;
}
