import generatedCatalogs from "./generated-catalogs.json";

export const BASE_TRANSLATIONS = {
  pl: {
    "Droga do Miliona": "Droga do Miliona",
    "Wycisz": "Wycisz"
  },
  de: {
    "Droga do Miliona": "Der Weg zur Million",
    "Wycisz": "Stummschalten"
  },
  en: {
    "Droga do Miliona": "Road to a Million",
    "Wycisz": "Mute",
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez kolejne etapy historii AMSO aż do zamówienia nr 1 000 000.":
      "Help the courier fulfil orders by collecting parcels and devices while running through the stages of AMSO's history all the way to order number 1,000,000.",
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez historię AMSO aż do zamówienia nr 1 000 000.":
      "Help the courier fulfil orders by collecting parcels and devices while running through AMSO's history all the way to order number 1,000,000.",
    "Ślizg: S lub ↓. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Slide: S or ↓. On mobile, swipe down.",
    "Skok: Spacja, W lub ↑; na telefonie dotknij ekranu. Ślizg: S lub ↓; na telefonie przesuń palcem w dół.":
      "Jump: Space, W or ↑; on mobile, tap the screen. Slide: S or ↓; on mobile, swipe down."
  },
  es: {
    "Droga do Miliona": "Camino al millón",
    "Wycisz": "Silenciar"
  },
  cs: {
    "Droga do Miliona": "Cesta k milionu",
    "Wycisz": "Ztlumit"
  },
  it: {
    "Droga do Miliona": "La strada verso il milione",
    "Wycisz": "Disattiva audio"
  },
  fr: {
    "Droga do Miliona": "En route vers le million",
    "Wycisz": "Couper le son"
  },
  uk: {
    "Droga do Miliona": "Шлях до мільйона",
    "Wycisz": "Вимкнути звук"
  }
} as const;

export const CAMPAIGN_TRANSLATIONS = Object.freeze(Object.fromEntries(
  Object.entries(generatedCatalogs).map(([locale, generated]) => [
    locale,
    Object.freeze({
      ...(generated as Readonly<Record<string, string>>),
      ...(BASE_TRANSLATIONS[locale as keyof typeof BASE_TRANSLATIONS] ?? {})
    })
  ])
)) as unknown as Readonly<
  Record<keyof typeof BASE_TRANSLATIONS, Readonly<Record<string, string>>>
>;
