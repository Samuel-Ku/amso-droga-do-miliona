import generatedCatalogs from "./generated-catalogs.json";

export const BASE_TRANSLATIONS = {
  pl: {
    "Droga do Miliona": "Droga do Miliona",
    "Wycisz": "Wycisz",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Skok: Spacja/W/tap · Ślizg: S/swipe w dół"
  },
  de: {
    "Droga do Miliona": "Der Weg zur Million",
    "Wycisz": "Stummschalten",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Sprung: Leertaste oder W. Tippe auf Mobilgeräten auf den Bildschirm.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Rutschen: S. Wische auf Mobilgeräten nach unten.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Sprung: Leertaste oder W; tippe auf dem Handy auf den Bildschirm. Rutschen: S; wische auf dem Handy nach unten.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Sprung: Leertaste/W/Tippen · Rutschen: S/Wischen nach unten"
  },
  en: {
    "Droga do Miliona": "Road to a Million",
    "Wycisz": "Mute",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Jump: Space or W. On mobile, tap the screen.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Slide: S. On mobile, swipe down.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Jump: Space or W; on mobile, tap the screen. Slide: S; on mobile, swipe down.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Jump: Space/W/tap · Slide: S/swipe down",
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez kolejne etapy historii AMSO aż do zamówienia nr 1 000 000.":
      "Help the courier fulfil orders by collecting parcels and devices while running through the stages of AMSO's history all the way to order number 1,000,000.",
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez historię AMSO aż do zamówienia nr 1 000 000.":
      "Help the courier fulfil orders by collecting parcels and devices while running through AMSO's history all the way to order number 1,000,000."
  },
  es: {
    "Droga do Miliona": "Camino al millón",
    "Wycisz": "Silenciar",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Salto: Espacio o W. En móvil, toca la pantalla.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Deslizarse: S. En móvil, desliza hacia abajo.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Salto: Espacio o W; en móvil, toca la pantalla. Deslizarse: S; en móvil, desliza hacia abajo.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Salto: Espacio/W/toque · Deslizarse: S/deslizar hacia abajo"
  },
  cs: {
    "Droga do Miliona": "Cesta k milionu",
    "Wycisz": "Ztlumit",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Skok: Mezerník nebo W. Na mobilu klepněte na obrazovku.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Skluz: S. Na mobilu přejeďte prstem dolů.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Skok: Mezerník nebo W; na mobilu klepněte na obrazovku. Skluz: S; na mobilu přejeďte dolů.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Skok: Mezerník/W/klepnutí · Skluz: S/přejetí dolů"
  },
  it: {
    "Droga do Miliona": "La strada verso il milione",
    "Wycisz": "Disattiva audio",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Salto: Spazio o W. Su mobile, tocca lo schermo.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Scivolata: S. Su mobile, scorri verso il basso.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Salto: Spazio o W; su mobile, tocca lo schermo. Scivolata: S; su mobile, scorri verso il basso.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Salto: Spazio/W/tocco · Scivolata: S/scorri in basso"
  },
  fr: {
    "Droga do Miliona": "En route vers le million",
    "Wycisz": "Couper le son",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Saut : Espace ou W. Sur mobile, touchez l’écran.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Glissade : S. Sur mobile, balayez vers le bas.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Saut : Espace ou W ; sur mobile, touchez l’écran. Glissade : S ; sur mobile, balayez vers le bas.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Saut : Espace/W/toucher · Glissade : S/balayer vers le bas"
  },
  uk: {
    "Droga do Miliona": "Шлях до мільйона",
    "Wycisz": "Вимкнути звук",
    "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.":
      "Стрибок: пробіл або W. На мобільному пристрої торкніться екрана.",
    "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.":
      "Ковзання: S. На мобільному пристрої проведіть пальцем униз.",
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.":
      "Стрибок: пробіл або W; на телефоні торкніться екрана. Ковзання: S; на телефоні проведіть пальцем униз.",
    "Skok: Spacja/W/tap · Ślizg: S/swipe w dół":
      "Стрибок: пробіл/W/дотик · Ковзання: S/свайп униз"
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
