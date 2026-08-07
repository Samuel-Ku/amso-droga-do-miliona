import type { CampaignLocale } from ".";

export interface IdoSellLocaleRow {
  readonly locale: CampaignLocale;
  readonly htmlLang: string;
  readonly url: string;
  readonly canonical: string;
  readonly pageTitle: string;
  readonly metaDescription: string;
  readonly teaser: string;
  readonly cta: string;
  readonly socialTitle: string;
  readonly socialDescription: string;
  readonly meaningfulAlt: string;
}

const rows: readonly IdoSellLocaleRow[] = [
  { locale: "pl", htmlLang: "pl", url: "https://amso.pl/droga-do-miliona", canonical: "https://amso.pl/droga-do-miliona", pageTitle: "Droga do Miliona | AMSO", metaDescription: "Poznaj historię AMSO i pomóż kurierowi dotrzeć do zamówienia numer 1 000 000.", teaser: "Biegnij przez historię AMSO, zbieraj zamówienia i dotrzyj do miliona.", cta: "Zagraj", socialTitle: "Droga do Miliona", socialDescription: "Jubileuszowa gra AMSO.", meaningfulAlt: "Kurier AMSO biegnący przez historię firmy" },
  { locale: "de", htmlLang: "de", url: "https://amso.eu/road-to-a-million", canonical: "https://amso.eu/road-to-a-million", pageTitle: "Der Weg zur Million | AMSO", metaDescription: "Entdecke die Geschichte von AMSO und hilf dem Kurier, die Bestellung Nummer 1.000.000 zu erreichen.", teaser: "Laufe durch die Geschichte von AMSO, sammle Bestellungen und erreiche die Million.", cta: "Spielen", socialTitle: "Der Weg zur Million", socialDescription: "Das Jubiläumsspiel von AMSO.", meaningfulAlt: "AMSO-Kurier auf dem Weg durch die Firmengeschichte" },
  { locale: "en", htmlLang: "en", url: "https://amso.eu/en/road-to-a-million", canonical: "https://amso.eu/en/road-to-a-million", pageTitle: "Road to a Million | AMSO", metaDescription: "Discover AMSO's story and help the courier reach order number 1,000,000.", teaser: "Run through AMSO's history, collect orders and reach a million.", cta: "Play", socialTitle: "Road to a Million", socialDescription: "AMSO's anniversary game.", meaningfulAlt: "AMSO courier running through the company's history" },
  { locale: "es", htmlLang: "es", url: "https://amso.eu/es/road-to-a-million", canonical: "https://amso.eu/es/road-to-a-million", pageTitle: "Camino al millón | AMSO", metaDescription: "Descubre la historia de AMSO y ayuda al mensajero a alcanzar el pedido número 1 000 000.", teaser: "Recorre la historia de AMSO, recoge pedidos y alcanza el millón.", cta: "Jugar", socialTitle: "Camino al millón", socialDescription: "El juego de aniversario de AMSO.", meaningfulAlt: "Mensajero de AMSO recorriendo la historia de la empresa" },
  { locale: "cs", htmlLang: "cs", url: "https://amso.eu/cs/road-to-a-million", canonical: "https://amso.eu/cs/road-to-a-million", pageTitle: "Cesta k milionu | AMSO", metaDescription: "Poznejte příběh AMSO a pomozte kurýrovi dosáhnout objednávky číslo 1 000 000.", teaser: "Proběhněte historií AMSO, sbírejte objednávky a dosáhněte milionu.", cta: "Hrát", socialTitle: "Cesta k milionu", socialDescription: "Jubilejní hra AMSO.", meaningfulAlt: "Kurýr AMSO běžící historií společnosti" },
  { locale: "it", htmlLang: "it", url: "https://amso.eu/it/road-to-a-million", canonical: "https://amso.eu/it/road-to-a-million", pageTitle: "La strada verso il milione | AMSO", metaDescription: "Scopri la storia di AMSO e aiuta il corriere a raggiungere l'ordine numero 1.000.000.", teaser: "Corri nella storia di AMSO, raccogli gli ordini e raggiungi il milione.", cta: "Gioca", socialTitle: "La strada verso il milione", socialDescription: "Il gioco celebrativo di AMSO.", meaningfulAlt: "Corriere AMSO che attraversa la storia dell'azienda" },
  { locale: "fr", htmlLang: "fr", url: "https://amso.eu/fr/road-to-a-million", canonical: "https://amso.eu/fr/road-to-a-million", pageTitle: "En route vers le million | AMSO", metaDescription: "Découvrez l'histoire d'AMSO et aidez le coursier à atteindre la commande numéro 1 000 000.", teaser: "Parcourez l'histoire d'AMSO, collectez les commandes et atteignez le million.", cta: "Jouer", socialTitle: "En route vers le million", socialDescription: "Le jeu anniversaire d'AMSO.", meaningfulAlt: "Coursier AMSO parcourant l'histoire de l'entreprise" },
  { locale: "uk", htmlLang: "uk", url: "https://amso.eu/uk/road-to-a-million", canonical: "https://amso.eu/uk/road-to-a-million", pageTitle: "Шлях до мільйона | AMSO", metaDescription: "Відкрийте історію AMSO та допоможіть кур’єру дістатися до замовлення № 1 000 000.", teaser: "Біжіть крізь історію AMSO, збирайте замовлення й дістаньтеся мільйона.", cta: "Грати", socialTitle: "Шлях до мільйона", socialDescription: "Ювілейна гра AMSO.", meaningfulAlt: "Кур’єр AMSO біжить крізь історію компанії" }
];

export const IDOSELL_LOCALE_ROWS = Object.freeze(rows);
export const IDOSELL_HREFLANG = Object.freeze({
  "pl-PL": rows[0]!.url,
  "de-DE": rows[1]!.url,
  "en-GB": rows[2]!.url,
  "es-ES": rows[3]!.url,
  "cs-CZ": rows[4]!.url,
  "it-IT": rows[5]!.url,
  "fr-FR": rows[6]!.url,
  "uk-UA": rows[7]!.url,
  "x-default": rows[2]!.url
});

export function campaignUrl(locale: CampaignLocale): string {
  return IDOSELL_LOCALE_ROWS.find((row) => row.locale === locale)!.url;
}
